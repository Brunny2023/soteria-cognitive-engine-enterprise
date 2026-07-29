CREATE POLICY "ks_storage_read_authed" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'knowledge-sources');

CREATE POLICY "ks_storage_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'knowledge-sources'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ks_storage_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "ks_storage_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'knowledge-sources' AND auth.uid()::text = (storage.foldername(name))[1]);