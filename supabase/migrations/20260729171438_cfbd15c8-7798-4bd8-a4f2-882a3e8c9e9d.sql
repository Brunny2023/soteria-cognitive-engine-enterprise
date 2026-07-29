
CREATE TABLE public.secp_requests (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  brief text NOT NULL,
  origin text NOT NULL,
  autonomy int NOT NULL,
  priority text NOT NULL,
  progress real NOT NULL DEFAULT 0,
  updated_label text NOT NULL DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  validators jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_requests TO authenticated;
GRANT ALL ON public.secp_requests TO service_role;
ALTER TABLE public.secp_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY secp_req_read ON public.secp_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY secp_req_insert ON public.secp_requests FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY secp_req_update ON public.secp_requests FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY secp_req_delete ON public.secp_requests FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_secp_req_touch BEFORE UPDATE ON public.secp_requests
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();

CREATE TABLE public.secp_archetypes (
  id text PRIMARY KEY,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  codename text NOT NULL,
  "role" text NOT NULL,
  layer text NOT NULL,
  department text NOT NULL,
  autonomy int NOT NULL,
  skills text[] NOT NULL DEFAULT '{}',
  packs text[] NOT NULL DEFAULT '{}',
  guardrails text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  trained real NOT NULL DEFAULT 0,
  deployed int NOT NULL DEFAULT 0,
  updated_label text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_archetypes TO authenticated;
GRANT ALL ON public.secp_archetypes TO service_role;
ALTER TABLE public.secp_archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY secp_at_read ON public.secp_archetypes FOR SELECT TO authenticated USING (true);
CREATE POLICY secp_at_insert ON public.secp_archetypes FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY secp_at_update ON public.secp_archetypes FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY secp_at_delete ON public.secp_archetypes FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_secp_at_touch BEFORE UPDATE ON public.secp_archetypes
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();

CREATE TABLE public.secp_pack_state (
  pack_id text PRIMARY KEY,
  status text NOT NULL,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_pack_state TO authenticated;
GRANT ALL ON public.secp_pack_state TO service_role;
ALTER TABLE public.secp_pack_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY secp_pack_read ON public.secp_pack_state FOR SELECT TO authenticated USING (true);
CREATE POLICY secp_pack_upsert ON public.secp_pack_state FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY secp_pack_update ON public.secp_pack_state FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY secp_pack_delete ON public.secp_pack_state FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER trg_secp_pack_touch BEFORE UPDATE ON public.secp_pack_state
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();
