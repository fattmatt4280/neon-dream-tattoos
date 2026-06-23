
CREATE POLICY "Admins can upload portfolio images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update portfolio images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete portfolio images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read portfolio images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin'));
