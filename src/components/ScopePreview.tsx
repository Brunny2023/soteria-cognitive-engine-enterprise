import { WAREHOUSE, scopeForAgent } from "@/lib/secp-scopes";

/**
 * Per-executive data-scope preview: exactly which tables, columns, row caps
 * and masked fields an agent may query before any execution runs.
 */
export function ScopePreview({ agents }: { agents: string[] }) {
  const unique = [...new Set(agents.filter(Boolean))];
  if (unique.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {unique.map((agent) => {
        const scope = scopeForAgent(agent);
        return (
          <div key={agent} className="border border-border rounded-sm p-3 bg-surface-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-accent uppercase truncate">{agent}</span>
              <span className="font-mono text-[9px] text-muted-foreground">
                cap {scope.rowCap} rows
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{scope.title}</div>
            <div className="mt-2 flex flex-col gap-1.5">
              {scope.tables.map((t) => {
                const spec = WAREHOUSE[t];
                const readable = spec.columns.filter((c) => !scope.masked.includes(c));
                return (
                  <div key={t} className="border border-border rounded-sm px-2 py-1.5">
                    <div className="font-mono text-[10px] text-foreground">{t}</div>
                    <div className="font-mono text-[9px] text-muted-foreground leading-relaxed break-words">
                      {readable.join(", ")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 font-mono text-[9px]">
              {scope.masked.length > 0 ? (
                <span className="text-[color:var(--warn)]">masked · {scope.masked.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground">masked · none</span>
              )}
            </div>
            <div className="mt-1 font-mono text-[9px] text-muted-foreground">
              statements · SELECT only · values bound as $n parameters
            </div>
          </div>
        );
      })}
    </div>
  );
}
