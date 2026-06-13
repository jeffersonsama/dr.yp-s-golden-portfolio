
ALTER TABLE public.site_profile
  ADD COLUMN IF NOT EXISTS stats jsonb NOT NULL DEFAULT '{"clients": 50, "projects": 200, "years": 3}'::jsonb;

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service text NOT NULL,
  rating smallint NOT NULL DEFAULT 5,
  message text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read approved testimonials"
  ON public.testimonials FOR SELECT
  TO anon, authenticated
  USING (approved = true);

CREATE POLICY "Anyone can submit a testimonial"
  ON public.testimonials FOR INSERT
  TO anon, authenticated
  WITH CHECK (approved = false);

CREATE POLICY "Admin can read all testimonials"
  ON public.testimonials FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update testimonials"
  ON public.testimonials FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete testimonials"
  ON public.testimonials FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
