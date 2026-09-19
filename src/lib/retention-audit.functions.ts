import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KindSchema = z.enum([
  "retention_window",
  "disposition_mode",
  "legal_hold",
  "purge_execution",
]);

const LogInput = z.object({
  kind: KindSchema,
  category_code: z.string().min(1),
  category_name: z.string().min(1),
  actor_name: z.string().min(1),
  approver_name: z.string().nullable().optional(),
  field: z.string().min(1),
  before: z.string().default(""),
  after: z.string().default(""),
  records_affected: z.number().int().nonnegative().default(0),
  disposition: z.string().default(""),
  note: z.string().default(""),
});

export type RetentionAuditRow = {
  id: string;
  ts: string;
  kind: z.infer<typeof KindSchema>;
  category_code: string;
  category_name: string;
  actor_id: string | null;
  actor_name: string;
  approver_name: string | null;
  field: string;
  before: string;
  after: string;
  records_affected: number;
  disposition: string;
  note: string;
};

export const listRetentionAuditFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("retention_audit_entries")
      .select(
        "id,ts,kind,category_code,category_name,actor_id,actor_name,approver_name,field,before,after,records_affected,disposition,note",
      )
      .order("ts", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []) as RetentionAuditRow[];
  });

export const logRetentionAuditFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LogInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("retention_audit_entries")
      .insert({
        kind: data.kind,
        category_code: data.category_code,
        category_name: data.category_name,
        actor_id: context.userId,
        actor_name: data.actor_name,
        approver_name: data.approver_name ?? null,
        field: data.field,
        before: data.before,
        after: data.after,
        records_affected: data.records_affected,
        disposition: data.disposition,
        note: data.note,
      })
      .select(
        "id,ts,kind,category_code,category_name,actor_id,actor_name,approver_name,field,before,after,records_affected,disposition,note",
      )
      .single();
    if (error) throw new Error(error.message);
    return row as RetentionAuditRow;
  });
