import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout, PageHeader } from "@/components/site-layout";
import { getSiteProfile } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — dr.yp" },
      { name: "description", content: "Logos, affiches, flyers, cartes de visite et d'invitation, montage vidéo — par dr.yp." },
      { property: "og:title", content: "Services — dr.yp" },
      { property: "og:description", content: "Design graphique haut de gamme : 5 services pour votre marque et vos événements." },
    ],
  }),
  component: Services,
});

const SERVICES = [
  { key: "logo", n: "01", t: "Logos", d: "Identités visuelles distinctives, pensées pour durer." },
  { key: "affiche", n: "02", t: "Affiches", d: "Compositions percutantes pour vos campagnes et événements." },
  { key: "flyer", n: "03", t: "Flyers", d: "Supports promotionnels élégants, clairs et efficaces." },
  { key: "carte", n: "04", t: "Cartes de visite & d'invitation", d: "Une première impression à la hauteur de votre marque." },
  { key: "video", n: "05", t: "Montage vidéo", d: "Récits visuels rythmés, montés avec précision." },
] as const;

function Services() {
  const fetchProfile = useServerFn(getSiteProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const active = new Set<string>((profile?.active_services as string[] | undefined) ?? SERVICES.map((s) => s.key));
  const visible = SERVICES.filter((s) => active.has(s.key));

  return (
    <SiteLayout>
      <PageHeader eyebrow="02" title="Services" subtitle="Cinq pratiques au service de votre image." />
      <section className="px-6 lg:px-12 pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--gold-line)] hairline">
            {visible.map((s) => (
              <article
                key={s.key}
                className="bg-navy p-10 lg:p-12 group transition-colors duration-500 hover:bg-[#0d2a52] min-h-[260px] flex flex-col"
              >
                <span className="font-display text-gold/70 text-3xl mb-8">{s.n}</span>
                <h2 className="text-2xl text-offwhite mb-4 group-hover:text-gold transition-colors duration-300">{s.t}</h2>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{s.d}</p>
              </article>
            ))}
            <Link
              to="/contact"
              className="bg-navy p-10 lg:p-12 min-h-[260px] flex flex-col justify-center items-center text-center group hover:bg-gold hover:text-navy transition-all duration-500"
            >
              <span className="font-display italic text-gold text-3xl mb-4 group-hover:text-navy">06</span>
              <p className="font-display text-2xl">Un projet en tête ?</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.3em] text-gold group-hover:text-navy">Parlons-en →</p>
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
