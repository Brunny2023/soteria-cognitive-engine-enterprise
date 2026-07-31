CREATE TABLE public.secp_artifacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL DEFAULT auth.uid(),
  request_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  agent TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'document',
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  checksum TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.secp_artifacts TO authenticated;
GRANT ALL ON public.secp_artifacts TO service_role;
ALTER TABLE public.secp_artifacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own artifacts" ON public.secp_artifacts FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX secp_artifacts_request_idx ON public.secp_artifacts (request_id, created_at DESC);