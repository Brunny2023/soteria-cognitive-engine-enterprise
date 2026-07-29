CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('document','policy','dataset','connector')),
  source TEXT NOT NULL DEFAULT 'upload',
  storage_path TEXT,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','parsing','embedding','indexed','failed')),
  progress REAL NOT NULL DEFAULT 0,
  entities INTEGER NOT NULL DEFAULT 0,
  edges INTEGER NOT NULL DEFAULT 0,
  target_layer TEXT NOT NULL DEFAULT 'L1',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_sources TO authenticated;
GRANT ALL ON public.knowledge_sources TO service_role;

ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ks_read_all_authed" ON public.knowledge_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ks_insert_self" ON public.knowledge_sources
  FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "ks_update_own_or_admin" ON public.knowledge_sources
  FOR UPDATE TO authenticated
  USING (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ks_delete_own_or_admin" ON public.knowledge_sources
  FOR DELETE TO authenticated
  USING (uploader_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.ks_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ks_updated_at
  BEFORE UPDATE ON public.knowledge_sources
  FOR EACH ROW EXECUTE FUNCTION public.ks_touch_updated_at();

CREATE INDEX ks_created_idx ON public.knowledge_sources (created_at DESC);
CREATE INDEX ks_status_idx ON public.knowledge_sources (status);