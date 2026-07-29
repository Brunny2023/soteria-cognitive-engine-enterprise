CREATE TABLE public.retention_audit_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  kind TEXT NOT NULL,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT NOT NULL,
  approver_name TEXT,
  field TEXT NOT NULL,
  before TEXT NOT NULL DEFAULT '',
  after TEXT NOT NULL DEFAULT '',
  records_affected BIGINT NOT NULL DEFAULT 0,
  disposition TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.retention_audit_entries TO authenticated;
GRANT ALL ON public.retention_audit_entries TO service_role;
ALTER TABLE public.retention_audit_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ra_read_authed" ON public.retention_audit_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "ra_insert_authed" ON public.retention_audit_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "ra_delete_admin" ON public.retention_audit_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX retention_audit_ts_idx ON public.retention_audit_entries (ts DESC);