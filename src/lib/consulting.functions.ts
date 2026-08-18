import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Engagement = {
  id: string;
  request_id: string;
  request_title: string;
  consultant: string;
  domain: string;
  content: string;
  checksum: string;
  created_at: string;
};

export const listEngagementsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Engagement[]> => {
    const { data, error } = await context.supabase
      .from("secp_artifacts")
      .select("id,request_id,agent,name,content,checksum,inputs,created_at")
      .eq("stage", "consultant")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as {
      id: string; request_id: string; agent: string; name: string;
      content: string; checksum: string; inputs: Record<string, unknown>; created_at: string;
    }[];
    const { data: reqs } = await context.supabase.from("secp_requests").select("id,title");
    const reqMap = new Map(((reqs ?? []) as { id: string; title: string }[]).map((r) => [r.id, r.title]));
    return rows.map((r) => ({
      id: r.id,
      request_id: r.request_id,
      request_title: reqMap.get(r.request_id) ?? r.request_id,
      consultant: r.agent,
      domain: String((r.inputs as { domain?: string })?.domain ?? "General"),
      content: r.content,
      checksum: r.checksum,
      created_at: r.created_at,
    }));
  });

const EngageSchema = z.object({
  requestId: z.string().min(1).max(120),
  consultantId: z.string().min(2).max(20),
  consultantName: z.string().min(2).max(80),
  domain: z.string().min(2).max(60),
  expertise: z.array(z.string().max(60)).max(8),
});

/** Commission a domain consultant (L3) to produce a solution architecture for a directive. */
export const runEngagementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EngageSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: req, error } = await context.supabase
      .from("secp_requests")
      .select("id,title,brief,priority,autonomy")
      .eq("id", data.requestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!req) throw new Error("Directive not found");
    const r = req as { id: string; title: string; brief: string; priority: string; autonomy: number };

    const { sha256, synthesize, engagementFallback } = await import("./exec.server");
    const fallback = engagementFallback({
      consultant: data.consultantName,
      domain: data.domain,
      directive: r.title,
      brief: r.brief,
    });
    const { content, source } = await synthesize(
      `You are the ${data.consultantName} in the SECP L3 consultant tier. Expertise: ${data.expertise.join(", ") || data.domain}.

Directive: ${r.title}
Brief: ${r.brief}
Priority: ${r.priority} · Autonomy: ${r.autonomy}

Produce a domain solution architecture in markdown with sections: Situation, Domain constraints, Solution architecture, Specialist requisition (roles and why), Risks, Acceptance criteria (measurable). Be concrete and never invent named customers, vendors, or regulations.`,
      fallback,
    );

    const checksum = await sha256(content);
    const { data: row, error: insErr } = await context.supabase
      .from("secp_artifacts")
      .insert({
        owner_id: context.userId,
        request_id: r.id,
        stage: "consultant",
        agent: `${data.consultantId} · ${data.consultantName}`,
        kind: "solution-architecture",
        name: `${data.consultantId} engagement — ${r.title}`,
        content,
        checksum,
        inputs: { domain: data.domain, expertise: data.expertise, priority: r.priority, source },
      })
      .select("id")
      .maybeSingle();
    if (insErr) throw new Error(insErr.message);
    return { id: (row as { id: string } | null)?.id ?? null, checksum, source };
  });
