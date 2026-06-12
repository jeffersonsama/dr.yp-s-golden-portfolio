
CREATE POLICY "Admin can upload portfolio images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admin can update portfolio images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admin can delete portfolio images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admin can list portfolio images" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'portfolio' AND public.has_role(auth.uid(), 'admin')
  );
