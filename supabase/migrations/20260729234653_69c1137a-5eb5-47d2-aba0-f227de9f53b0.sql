GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT ALL ON storage.objects TO service_role;
GRANT SELECT ON storage.buckets TO authenticated, anon;
GRANT ALL ON storage.buckets TO service_role;