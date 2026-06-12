import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SIGN_EXPIRES = 60 * 60 * 24 * 365; // 1 year

async function signImageUrls(rows: Array<{ image_path: string | null }>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const paths = rows.map((r) => r.image_path).filter((p): p is string => !!p);
  if (paths.length === 0) return new Map<string, string>();
  const { data } = await supabaseAdmin.storage.from("portfolio").createSignedUrls(paths, SIGN_EXPIRES);
  const map = new Map<string, string>();
  data?.forEach((d) => d.signedUrl && d.path && map.set(d.path, d.signedUrl));
  return map;
}

// ============ PUBLIC ============

export const getSiteProfile = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("site_profile").select("*").eq("id", 1).single();
  if (!data) return null;
  let photo_url: string | null = null;
  if (data.photo_url) {
    const map = await signImageUrls([{ image_path: data.photo_url }]);
    photo_url = map.get(data.photo_url) ?? null;
  }
  return { ...data, photo_url, photo_path: data.photo_url };
});

export const getPublicRealisations = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("realisations")
    .select("id, title, category, description, image_path, featured, date_month, date_year, created_at")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const urls = await signImageUrls(data ?? []);
  return (data ?? []).map((r) => ({ ...r, image_url: r.image_path ? urls.get(r.image_path) ?? null : null }));
});

export const getFeaturedRealisations = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("realisations")
    .select("id, title, category, image_path")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(6);
  const urls = await signImageUrls(data ?? []);
  return (data ?? []).map((r) => ({ ...r, image_url: r.image_path ? urls.get(r.image_path) ?? null : null }));
});

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  contact: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("messages").insert(data);
    if (error) throw error;
    return { ok: true };
  });

export const logPortfolioView = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("portfolio_views").insert({});
  return { ok: true };
});

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  return { exists: (count ?? 0) > 0 };
});

// ============ ADMIN ============

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("claim_admin_if_empty");
    if (error) throw error;
    return { claimed: !!data };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: !!data };
  });

export const adminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: totalReal }, { count: totalViews }, { count: totalMsgs }, { count: unreadMsgs }, recent] =
      await Promise.all([
        supabaseAdmin.from("realisations").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("portfolio_views").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("messages").select("*", { count: "exact", head: true }).eq("archived", false),
        supabaseAdmin
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("read", false)
          .eq("archived", false),
        supabaseAdmin
          .from("realisations")
          .select("id, title, category, created_at, status")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
    return {
      totalRealisations: totalReal ?? 0,
      totalViews: totalViews ?? 0,
      totalMessages: totalMsgs ?? 0,
      unreadMessages: unreadMsgs ?? 0,
      recent: recent.data ?? [],
    };
  });

export const adminListRealisations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("realisations")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const urls = await signImageUrls(data ?? []);
    return (data ?? []).map((r) => ({ ...r, image_url: r.image_path ? urls.get(r.image_path) ?? null : null }));
  });

const realisationSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  category: z.enum(["logo", "affiche", "flyer", "carte", "video"]),
  description: z.string().max(2000).optional().nullable(),
  image_path: z.string().min(1),
  status: z.enum(["published", "draft"]),
  featured: z.boolean(),
  date_month: z.number().int().min(1).max(12).optional().nullable(),
  date_year: z.number().int().min(2000).max(2100).optional().nullable(),
});

export const adminUpsertRealisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => realisationSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.id) {
      const { error } = await supabaseAdmin.from("realisations").update(data).eq("id", data.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin.from("realisations").insert({ ...data, image_url: data.image_path });
      if (error) throw error;
    }
    return { ok: true };
  });

export const adminDeleteRealisation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("realisations")
      .select("image_path")
      .eq("id", data.id)
      .single();
    if (row?.image_path) {
      await supabaseAdmin.storage.from("portfolio").remove([row.image_path]);
    }
    const { error } = await supabaseAdmin.from("realisations").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const adminListMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminUpdateMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        read: z.boolean().optional(),
        archived: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("messages").update(patch).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("messages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

const profileSchema = z.object({
  tagline: z.string().min(1).max(200),
  about: z.string().min(1).max(5000),
  photo_path: z.string().nullable().optional(),
  social_links: z.object({
    whatsapp: z.string().max(50),
    email: z.string().max(200),
    tiktok: z.string().max(100),
    instagram: z.string().max(100),
    facebook: z.string().max(100),
  }),
  active_services: z.array(z.enum(["logo", "affiche", "flyer", "carte", "video"])),
});

export const adminUpdateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_profile")
      .update({
        tagline: data.tagline,
        about: data.about,
        photo_url: data.photo_path ?? null,
        social_links: data.social_links,
        active_services: data.active_services,
      })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });
