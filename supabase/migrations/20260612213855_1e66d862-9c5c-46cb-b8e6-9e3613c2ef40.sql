
-- Tighten function execution
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- admin_exists and claim_admin_if_empty stay callable (UI needs them)
-- Tighten portfolio_views insert (must be recent timestamp; prevents back-dated stuffing)
DROP POLICY IF EXISTS "Anyone can log a view" ON public.portfolio_views;
CREATE POLICY "Anyone can log a view" ON public.portfolio_views
  FOR INSERT TO anon, authenticated WITH CHECK (created_at >= now() - interval '5 seconds');
