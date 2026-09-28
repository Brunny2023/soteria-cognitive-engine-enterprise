-- Connected Coxec project: ragjpjkkagrfbcwfrefm
-- Keep the ingest bucket private; object access is governed by the policies in
-- 20260729163058_secure_knowledge_source_storage.sql.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('knowledge-sources', 'knowledge-sources', false, 52428800)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit;

-- This helper is not part of the application API.
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
