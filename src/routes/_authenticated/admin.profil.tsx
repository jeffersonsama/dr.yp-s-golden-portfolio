import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import { getSiteProfile, adminUpdateProfile } from "@/lib/portfolio.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/profil")({
  head: () => ({
    meta: [{ title: "Profil — Admin dr.yp" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminProfile,
});

const SERVICES = [
  { v: "logo", l: "Logos" },
  { v: "affiche", l: "Affiches" },
  { v: "flyer", l: "Flyers" },
  { v: "carte", l: "Cartes" },
  { v: "video", l: "Vidéos" },
] as const;

function AdminProfile() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getSiteProfile);
  const update = useServerFn(adminUpdateProfile);

  const { data } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [form, setForm] = useState({
    tagline: "",
    about: "",
    photo_path: null as string | null,
    social_links: { whatsapp: "", email: "", tiktok: "", instagram: "", facebook: "" },
    active_services: ["logo", "affiche", "flyer", "carte", "video"] as string[],
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      tagline: data.tagline,
      about: data.about,
      photo_path: (data as any).photo_path ?? null,
      social_links: data.social_links as any,
      active_services: (data.active_services as string[]) ?? [],
    });
    setPreview(data.photo_url ?? null);
  }, [data]);

  const onFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error("Max 5 Mo");
    const ext = file.name.split(".").pop();
    const path = `profile-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("portfolio").upload(path, file);
    if (error) return toast.error(error.message);
    setForm((f) => ({ ...f, photo_path: path }));
    setPreview(URL.createObjectURL(file));
    toast.success("Photo téléversée.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await update({ data: form as any });
      toast.success("Profil enregistré.");
      qc.invalidateQueries({ queryKey: ["profile"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (v: string) => {
    setForm((f) => ({
      ...f,
      active_services: f.active_services.includes(v)
        ? f.active_services.filter((s) => s !== v)
        : [...f.active_services, v],
    }));
  };

  return (
    <AdminShell>
      <AdminPageHeader title="Profil" subtitle="Modifications visibles immédiatement sur le site public" />

      <form onSubmit={submit} className="max-w-4xl space-y-8">
        <Field label="Slogan / Tagline">
          <input
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full bg-transparent hairline px-3 py-2 text-sm focus:border-gold focus:outline-none"
          />
        </Field>

        <Field label="À propos (texte long)">
          <textarea
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            rows={8}
            className="w-full bg-transparent hairline px-3 py-2 text-sm font-light leading-relaxed focus:border-gold focus:outline-none"
          />
        </Field>

        <Field label="Photo de profil">
          <div className="flex items-center gap-6">
            <label className="w-32 h-32 hairline border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0">
              {preview ? (
                <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground px-2 text-center">
                  Choisir
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            {form.photo_path && (
              <button
                type="button"
                onClick={() => {
                  setForm({ ...form, photo_path: null });
                  setPreview(null);
                }}
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
              >
                Retirer la photo
              </button>
            )}
          </div>
        </Field>

        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Liens sociaux</legend>
          <div className="grid sm:grid-cols-2 gap-4">
            {(["whatsapp", "email", "tiktok", "instagram", "facebook"] as const).map((k) => (
              <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
                <input
                  value={form.social_links[k]}
                  onChange={(e) => setForm({ ...form, social_links: { ...form.social_links, [k]: e.target.value } })}
                  className="w-full bg-transparent hairline px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </Field>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[10px] uppercase tracking-[0.3em] text-gold mb-4">Services actifs</legend>
          <div className="flex flex-wrap gap-3">
            {SERVICES.map((s) => {
              const active = form.active_services.includes(s.v);
              return (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => toggleService(s.v)}
                  className={`hairline px-4 py-2 text-[11px] uppercase tracking-[0.25em] ${
                    active ? "bg-gold text-navy border-gold" : "text-muted-foreground hover:text-gold"
                  }`}
                >
                  {s.l}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="hairline px-6 py-3 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}
