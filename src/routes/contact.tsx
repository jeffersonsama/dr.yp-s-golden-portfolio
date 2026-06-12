import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteLayout, PageHeader } from "@/components/site-layout";
import { getSiteProfile, submitContact } from "@/lib/portfolio.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — dr.yp" },
      { name: "description", content: "Contactez dr.yp pour un projet de design graphique : WhatsApp, email, réseaux sociaux ou formulaire." },
      { property: "og:title", content: "Contact — dr.yp" },
      { property: "og:description", content: "Une idée, un projet, une collaboration ? Écrivez-moi." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const fetchProfile = useServerFn(getSiteProfile);
  const send = useServerFn(submitContact);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const [form, setForm] = useState({ name: "", contact: "", subject: "", body: "" });
  const [loading, setLoading] = useState(false);

  const s = profile?.social_links as any | undefined;
  const channels = [
    s?.whatsapp && { label: `WhatsApp ${s.whatsapp}`, href: `https://wa.me/${s.whatsapp.replace(/[^0-9]/g, "")}` },
    s?.email && { label: `Email · ${s.email}`, href: `mailto:${s.email}` },
    s?.tiktok && { label: `TikTok · ${s.tiktok}`, href: `https://www.tiktok.com/${s.tiktok.replace(/^@/, "@")}` },
    s?.instagram && { label: `Instagram · ${s.instagram}`, href: `https://instagram.com/${s.instagram.replace(/^@/, "")}` },
    s?.facebook && { label: `Facebook · ${s.facebook}`, href: `https://facebook.com/` },
  ].filter(Boolean) as { label: string; href: string }[];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.contact || !form.subject || !form.body) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await send({ data: form });
      toast.success("Message envoyé. Je vous recontacte rapidement.");
      setForm({ name: "", contact: "", subject: "", body: "" });
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <PageHeader eyebrow="04" title="Contact" subtitle="Une idée, un projet, une collaboration." />

      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-8">Canaux directs</p>
            <div className="flex flex-col gap-3">
              {channels.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  className="hairline px-6 py-4 text-[12px] uppercase tracking-[0.25em] hover:text-navy hover:bg-gold hover:border-gold transition-all duration-500"
                >
                  {c.label}
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-3">Formulaire</p>
            <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Email ou WhatsApp" value={form.contact} onChange={(v) => setForm({ ...form, contact: v })} />
            <Field label="Sujet" value={form.subject} onChange={(v) => setForm({ ...form, subject: v })} />
            <Field
              label="Message"
              textarea
              value={form.body}
              onChange={(v) => setForm({ ...form, body: v })}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full hairline px-6 py-4 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-500 disabled:opacity-50"
            >
              {loading ? "Envoi…" : "Envoyer le message"}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={5}
          className="w-full bg-transparent hairline px-4 py-3 text-offwhite text-sm font-light focus:border-gold focus:outline-none transition-colors"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent hairline px-4 py-3 text-offwhite text-sm font-light focus:border-gold focus:outline-none transition-colors"
        />
      )}
    </label>
  );
}
