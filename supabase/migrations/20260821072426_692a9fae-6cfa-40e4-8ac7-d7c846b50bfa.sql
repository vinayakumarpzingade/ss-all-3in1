DROP POLICY IF EXISTS "startsafe assets read" ON storage.objects;
CREATE POLICY "startsafe assets read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'startsafe-assets');

DROP POLICY IF EXISTS "startsafe assets write" ON storage.objects;
CREATE POLICY "startsafe assets write" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'startsafe-assets');

DROP POLICY IF EXISTS "startsafe assets update" ON storage.objects;
CREATE POLICY "startsafe assets update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'startsafe-assets' AND owner = auth.uid());

DROP POLICY IF EXISTS "startsafe assets delete" ON storage.objects;
CREATE POLICY "startsafe assets delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'startsafe-assets' AND owner = auth.uid());