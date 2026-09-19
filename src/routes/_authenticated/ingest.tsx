import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell, SectionHeading, StatChip } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/ingest")({
  head: () => ({
    meta: [
      { title: "Knowledge Ingestion — Soteria SECP" },
      {
        name: "description",
        content:
          "Feed documents, policies, and connector datasets into the L1 organizational cognition layer.",
      },
    ],
  }),
  component: IngestPage,
});

type Kind = "document" | "policy" | "dataset" | "connector";
type Status = "queued" | "parsing" | "embedding" | "indexed" | "failed";

interface Source {
  id: string;
  uploader_id: string;
  name: string;
  kind: Kind;
  source: string;
  storage_path: string | null;
  size_bytes: number;
  mime: string | null;
  tags: string[];
  status: Status;
  progress: number;
  entities: number;
  edges: number;
  target_layer: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const CONNECTORS = [
  {
    id: "sharepoint",
    name: "SharePoint",
    kind: "document" as Kind,
    hint: "Corporate wiki & policies",
  },
  {
    id: "confluence",
    name: "Confluence",
    kind: "document" as Kind,
    hint: "Engineering & product knowledge",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    kind: "dataset" as Kind,
    hint: "Accounts, opportunities, pipeline",
  },
  {
    id: "snowflake",
    name: "Snowflake Warehouse",
    kind: "dataset" as Kind,
    hint: "Semantic layer & governed marts",
  },
  { id: "notion", name: "Notion", kind: "document" as Kind, hint: "Playbooks & meeting notes" },
  { id: "s3", name: "S3 Data Lake", kind: "dataset" as Kind, hint: "Raw event streams & exports" },
  { id: "jira", name: "Jira", kind: "dataset" as Kind, hint: "Delivery & incident history" },
  { id: "onedrive", name: "OneDrive", kind: "document" as Kind, hint: "Executive & board files" },
];

const KIND_TONE: Record<Kind, string> = {
  document: "text-accent border-accent/40",
  policy: "text-[color:var(--warn)] border-[color:var(--warn)]/40",
  dataset: "text-primary border-primary/40",
  connector: "text-[color:var(--signal)] border-[color:var(--signal)]/40",
};
const STATUS_TONE: Record<Status, string> = {
  queued: "text-muted-foreground border-border",
  parsing: "text-accent border-accent/40",
  embedding: "text-primary border-primary/40",
  indexed: "text-[color:var(--signal)] border-[color:var(--signal)]/40",
  failed: "text-[color:var(--danger)] border-[color:var(--danger)]/40",
};

function fmtBytes(n: number): string {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function IngestPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    const { data, error } = await supabase
      .from("knowledge_sources")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    else setRows((data ?? []) as Source[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("ks-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "knowledge_sources" }, refresh)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

  const filtered = useMemo(
    () => rows.filter((r) => kindFilter === "all" || r.kind === kindFilter),
    [rows, kindFilter],
  );

  const kpis = useMemo(() => {
    const indexed = rows.filter((r) => r.status === "indexed").length;
    const inflight = rows.filter(
      (r) => r.status === "parsing" || r.status === "embedding" || r.status === "queued",
    ).length;
    const failed = rows.filter((r) => r.status === "failed").length;
    const entities = rows.reduce((s, r) => s + r.entities, 0);
    const edges = rows.reduce((s, r) => s + r.edges, 0);
    return { indexed, inflight, failed, entities, edges };
  }, [rows]);

  function classify(mime: string, name: string): Kind {
    const lower = name.toLowerCase();
    if (lower.match(/policy|compliance|charter|sop|standard/)) return "policy";
    if (
      mime.startsWith("text/csv") ||
      lower.endsWith(".csv") ||
      lower.endsWith(".parquet") ||
      lower.endsWith(".json")
    )
      return "dataset";
    return "document";
  }

  async function handleFiles(files: FileList | File[]) {
    if (!user) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const kind = classify(file.type, file.name);
        const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
        const path = `${user.id}/${Date.now()}-${safeName}`;
        const up = await supabase.storage
          .from("knowledge-sources")
          .upload(path, file, { upsert: false, contentType: file.type || undefined });
        if (up.error) throw up.error;
        const ins = await supabase
          .from("knowledge_sources")
          .insert({
            uploader_id: user.id,
            name: file.name,
            kind,
            source: "upload",
            storage_path: path,
            size_bytes: file.size,
            mime: file.type || "application/octet-stream",
            tags: [],
            status: "queued",
            progress: 0.05,
          })
          .select("id")
          .single();
        if (ins.error) throw ins.error;
        simulatePipeline(ins.data.id, file.size);
      }
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function ingestConnector(c: (typeof CONNECTORS)[number]) {
    if (!user) return;
    setError(null);
    const ins = await supabase
      .from("knowledge_sources")
      .insert({
        uploader_id: user.id,
        name: `${c.name} :: incremental sync`,
        kind: c.kind === "dataset" ? "dataset" : "connector",
        source: c.id,
        storage_path: null,
        size_bytes: Math.floor(Math.random() * 90 + 10) * 1024 * 1024,
        mime: c.kind === "dataset" ? "application/x-parquet" : "application/vnd.connector",
        tags: [c.id],
        status: "queued",
        progress: 0.05,
        notes: c.hint,
      })
      .select("id")
      .single();
    if (ins.error) {
      setError(ins.error.message);
      return;
    }
    simulatePipeline(ins.data.id, 40 * 1024 * 1024);
    refresh();
  }

  function simulatePipeline(id: string, bytes: number) {
    const stages: { status: Status; progress: number; ms: number }[] = [
      { status: "parsing", progress: 0.25, ms: 900 },
      { status: "embedding", progress: 0.65, ms: 1400 },
      { status: "indexed", progress: 1, ms: 1200 },
    ];
    let acc = 0;
    stages.forEach((s) => {
      acc += s.ms;
      setTimeout(async () => {
        const patch: Partial<Source> = { status: s.status, progress: s.progress };
        if (s.status === "indexed") {
          patch.entities = Math.max(12, Math.round(bytes / 12_000));
          patch.edges = Math.max(24, Math.round(bytes / 4_800));
        }
        await supabase.from("knowledge_sources").update(patch).eq("id", id);
      }, acc);
    });
  }

  async function retry(id: string) {
    await supabase
      .from("knowledge_sources")
      .update({ status: "queued", progress: 0.05 })
      .eq("id", id);
    simulatePipeline(id, 8 * 1024 * 1024);
  }

  async function remove(id: string, path: string | null) {
    if (path) await supabase.storage.from("knowledge-sources").remove([path]);
    await supabase.from("knowledge_sources").delete().eq("id", id);
    refresh();
  }

  return (
    <AppShell
      title="KNOWLEDGE INGESTION"
      crumb="L1 :: organizational.intake"
      status="INGEST_STATUS: ONLINE"
      inspector={
        selected ? <Inspector s={selected} onRetry={retry} onRemove={remove} /> : undefined
      }
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatChip label="INDEXED SOURCES" value={String(kpis.indexed)} tone="signal" />
          <StatChip label="IN PIPELINE" value={String(kpis.inflight)} tone="accent" />
          <StatChip
            label="FAILED"
            value={String(kpis.failed)}
            tone={kpis.failed ? "danger" : "default"}
          />
          <StatChip label="ENTITIES EXTRACTED" value={kpis.entities.toLocaleString()} />
          <StatChip label="EDGES INFERRED" value={kpis.edges.toLocaleString()} />
        </div>

        <section>
          <SectionHeading code="IN.01" title="Direct upload · documents, policies, datasets" />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={
              "border-2 border-dashed rounded-sm p-8 text-center transition-colors " +
              (dragOver ? "border-primary bg-primary/5" : "border-border bg-surface")
            }
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              DROP ZONE :: L1 INTAKE
            </div>
            <div className="text-sm text-foreground mb-4">
              Drop files here or{" "}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-primary underline underline-offset-4 hover:text-accent"
              >
                browse
              </button>
              . PDF, DOCX, MD, CSV, JSON, Parquet.
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
            <div className="text-[10px] font-mono text-muted-foreground">
              {uploading ? "TRANSFERRING …" : "MAX 20MB per file · classified on ingest"}
            </div>
            {error && (
              <div className="mt-3 text-[11px] font-mono text-[color:var(--danger)]">
                ERR :: {error}
              </div>
            )}
          </div>
        </section>

        <section>
          <SectionHeading code="IN.02" title="Managed connectors · scheduled sync" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {CONNECTORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => ingestConnector(c)}
                className="text-left border border-border bg-surface hover:border-primary/40 hover:bg-primary/5 rounded-sm p-3 flex flex-col gap-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {c.id.toUpperCase()}
                  </span>
                  <span
                    className={
                      "font-mono text-[10px] uppercase px-1.5 py-0.5 border rounded-sm " +
                      KIND_TONE[c.kind === "dataset" ? "dataset" : "connector"]
                    }
                  >
                    {c.kind === "dataset" ? "DATASET" : "DOCS"}
                  </span>
                </div>
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-[11px] text-muted-foreground">{c.hint}</div>
                <div className="text-[10px] font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  ▶ TRIGGER INCREMENTAL SYNC
                </div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionHeading
            code="IN.03"
            title="Ingestion pipeline"
            action={
              <div className="flex gap-1">
                {(["all", "document", "policy", "dataset", "connector"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKindFilter(k)}
                    className={
                      "px-2 py-1 text-[10px] font-mono uppercase border rounded-sm " +
                      (kindFilter === k
                        ? "border-primary text-primary bg-primary/10"
                        : "border-border text-muted-foreground hover:text-foreground")
                    }
                  >
                    {k}
                  </button>
                ))}
              </div>
            }
          />
          <div className="border border-border bg-surface rounded-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-border font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="col-span-4">SOURCE</span>
              <span className="col-span-1">KIND</span>
              <span className="col-span-1">SIZE</span>
              <span className="col-span-2">STATUS</span>
              <span className="col-span-3">PROGRESS</span>
              <span className="col-span-1 text-right">ENT / EDGE</span>
            </div>
            {loading && (
              <div className="p-6 text-center font-mono text-[10px] text-muted-foreground">
                LOADING …
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No sources yet. Drop a file or trigger a connector to feed L1.
              </div>
            )}
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={
                  "w-full text-left grid grid-cols-12 gap-3 items-center px-4 py-2.5 border-b border-border last:border-b-0 transition-colors " +
                  (r.id === selected?.id ? "bg-primary/5" : "hover:bg-secondary")
                }
              >
                <div className="col-span-4 min-w-0">
                  <div className="text-xs truncate">{r.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground truncate">
                    {r.source} ·{" "}
                    {new Date(r.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  className={
                    "col-span-1 font-mono text-[10px] uppercase px-1.5 py-0.5 border rounded-sm w-fit " +
                    KIND_TONE[r.kind]
                  }
                >
                  {r.kind}
                </span>
                <span className="col-span-1 font-mono text-[10px] text-muted-foreground">
                  {fmtBytes(r.size_bytes)}
                </span>
                <span
                  className={
                    "col-span-2 font-mono text-[10px] uppercase px-2 py-0.5 border rounded-sm w-fit " +
                    STATUS_TONE[r.status]
                  }
                >
                  {r.status}
                </span>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={
                        "h-full " +
                        (r.status === "failed"
                          ? "bg-[color:var(--danger)]"
                          : r.status === "indexed"
                            ? "bg-[color:var(--signal)]"
                            : "bg-primary")
                      }
                      style={{ width: `${Math.round(r.progress * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground w-8 text-right">
                    {Math.round(r.progress * 100)}%
                  </span>
                </div>
                <span className="col-span-1 font-mono text-[10px] text-muted-foreground text-right">
                  {r.entities}/{r.edges}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Inspector({
  s,
  onRetry,
  onRemove,
}: {
  s: Source;
  onRetry: (id: string) => void;
  onRemove: (id: string, path: string | null) => void;
}) {
  const stages = [
    { code: "01", label: "Queued", done: true },
    {
      code: "02",
      label: "Parse & OCR",
      done: ["parsing", "embedding", "indexed"].includes(s.status),
    },
    { code: "03", label: "Chunk & embed", done: ["embedding", "indexed"].includes(s.status) },
    { code: "04", label: "Graph link", done: s.status === "indexed" },
    { code: "05", label: "L1 indexed", done: s.status === "indexed" },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          INSPECTOR :: SOURCE
        </div>
        <div className="text-sm text-foreground mt-1 truncate">{s.name}</div>
        <div className="font-mono text-[10px] text-accent mt-0.5">
          {s.source} · {s.kind}
        </div>
      </div>
      <div className="p-5 space-y-4 overflow-y-auto text-xs">
        <Row label="SIZE" value={fmtBytes(s.size_bytes)} />
        <Row label="MIME" value={s.mime ?? "—"} />
        <Row label="TARGET LAYER" value={s.target_layer} />
        <Row label="STATUS" value={s.status.toUpperCase()} />
        <Row label="ENTITIES" value={String(s.entities)} />
        <Row label="EDGES" value={String(s.edges)} />
        <Row label="INGESTED" value={new Date(s.created_at).toLocaleString()} />

        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            PIPELINE TRACE
          </div>
          <ol className="space-y-2">
            {stages.map((st) => (
              <li key={st.code} className="flex items-center gap-3">
                <span
                  className={
                    "size-5 shrink-0 rounded-sm border flex items-center justify-center font-mono text-[9px] " +
                    (st.done
                      ? "border-[color:var(--signal)] text-[color:var(--signal)] bg-[color:var(--signal)]/10"
                      : "border-border text-muted-foreground")
                  }
                >
                  {st.done ? "✓" : st.code}
                </span>
                <span className="text-[11px]">{st.label}</span>
              </li>
            ))}
          </ol>
        </div>

        {s.notes && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
              NOTES
            </div>
            <div className="text-[11px] text-muted-foreground border-l-2 border-border pl-2">
              {s.notes}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          {s.status === "failed" && (
            <button
              type="button"
              onClick={() => onRetry(s.id)}
              className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-primary/40 text-primary hover:bg-primary/10 rounded-sm"
            >
              ▶ Retry ingestion
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(s.id, s.storage_path)}
            className="text-[10px] font-mono uppercase tracking-widest px-3 py-2 border border-border text-muted-foreground hover:text-[color:var(--danger)] hover:border-[color:var(--danger)]/40 rounded-sm"
          >
            ◼ Remove from L1
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span
        className="font-mono text-[11px] text-foreground text-right truncate max-w-[60%]"
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
