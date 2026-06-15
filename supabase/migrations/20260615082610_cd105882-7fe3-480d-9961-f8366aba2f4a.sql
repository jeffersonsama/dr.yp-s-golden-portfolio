
-- 1. sort_order on realisations
ALTER TABLE public.realisations ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_realisations_sort_order ON public.realisations(sort_order);
-- seed sort_order from created_at desc
WITH ord AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY featured DESC, created_at DESC) AS rn FROM public.realisations
)
UPDATE public.realisations r SET sort_order = ord.rn FROM ord WHERE r.id = ord.id;

-- 2. realisation_images table (gallery)
CREATE TABLE IF NOT EXISTS public.realisation_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  realisation_id UUID NOT NULL REFERENCES public.realisations(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_realisation_images_realisation ON public.realisation_images(realisation_id, sort_order);

GRANT SELECT ON public.realisation_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.realisation_images TO authenticated;
GRANT ALL ON public.realisation_images TO service_role;

ALTER TABLE public.realisation_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view gallery images of published realisations"
  ON public.realisation_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.realisations r
      WHERE r.id = realisation_id
        AND (r.status = 'published' OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Admin manages gallery images"
  ON public.realisation_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. proof images on testimonials
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS proof_image_paths TEXT[] NOT NULL DEFAULT '{}';

-- 4. storage policies: allow public uploads to testimonials/ subfolder of portfolio bucket
CREATE POLICY "Anyone can upload testimonial proof"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[1] = 'testimonials');
