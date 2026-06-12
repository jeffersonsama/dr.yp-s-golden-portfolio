
-- ============= ENUMS =============
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.realisation_category AS ENUM ('logo', 'affiche', 'flyer', 'carte', 'video');
CREATE TYPE public.realisation_status AS ENUM ('published', 'draft');

-- ============= USER ROLES =============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Authenticated can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Block public signup of admin: only existing admin (or service role) can add admins
CREATE POLICY "Admin can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function for the first user to claim admin if no admin exists yet
CREATE OR REPLACE FUNCTION public.claim_admin_if_empty()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INT;
BEGIN
  IF v_uid IS NULL THEN RETURN FALSE; END IF;
  SELECT COUNT(*) INTO v_count FROM public.user_roles WHERE role = 'admin';
  IF v_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin');
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_empty() TO authenticated;

-- Helper to check if any admin exists (for UI lock of signup)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;

-- ============= REALISATIONS =============
CREATE TABLE public.realisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.realisation_category NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_path TEXT, -- storage path for deletion
  status public.realisation_status NOT NULL DEFAULT 'draft',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  date_month INT CHECK (date_month BETWEEN 1 AND 12),
  date_year INT,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.realisations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.realisations TO authenticated;
GRANT ALL ON public.realisations TO service_role;
ALTER TABLE public.realisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published realisations" ON public.realisations
  FOR SELECT TO anon, authenticated USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert realisations" ON public.realisations
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update realisations" ON public.realisations
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete realisations" ON public.realisations
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_realisations_status ON public.realisations(status);
CREATE INDEX idx_realisations_category ON public.realisations(category);
CREATE INDEX idx_realisations_featured ON public.realisations(featured);

-- ============= MESSAGES =============
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.messages TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit messages" ON public.messages
  FOR INSERT TO anon, authenticated WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(contact) BETWEEN 1 AND 200
    AND length(subject) BETWEEN 1 AND 200
    AND length(body) BETWEEN 1 AND 5000
  );
CREATE POLICY "Admin can view messages" ON public.messages
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update messages" ON public.messages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete messages" ON public.messages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= SITE PROFILE (singleton) =============
CREATE TABLE public.site_profile (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tagline TEXT NOT NULL DEFAULT 'Designer graphique · Créateur visuel',
  about TEXT NOT NULL DEFAULT 'Je suis Faradito Fibi Florent, designer graphique sous le pseudo dr.yp.',
  photo_url TEXT,
  social_links JSONB NOT NULL DEFAULT '{"whatsapp":"+229 61463001","email":"fibiflorent@gmail.com","tiktok":"@dr.yopcity","instagram":"@florent_dr","facebook":"Florent Faradito"}'::jsonb,
  active_services JSONB NOT NULL DEFAULT '["logo","affiche","flyer","carte","video"]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_profile TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_profile TO authenticated;
GRANT ALL ON public.site_profile TO service_role;
ALTER TABLE public.site_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view profile" ON public.site_profile
  FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin can update profile" ON public.site_profile
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert profile" ON public.site_profile
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_profile (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============= PORTFOLIO VIEWS =============
CREATE TABLE public.portfolio_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.portfolio_views TO anon, authenticated;
GRANT SELECT ON public.portfolio_views TO authenticated;
GRANT ALL ON public.portfolio_views TO service_role;
ALTER TABLE public.portfolio_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log a view" ON public.portfolio_views
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);
CREATE POLICY "Admin can read views" ON public.portfolio_views
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= UPDATED_AT TRIGGER =============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_realisations_updated BEFORE UPDATE ON public.realisations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_site_profile_updated BEFORE UPDATE ON public.site_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
