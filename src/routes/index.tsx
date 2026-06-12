import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout, Logo } from "@/components/site-layout";
import { getFeaturedRealisations, getSiteProfile } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "dr.yp — Faradito Fibi Florent · Designer graphique" },
      { name: "description", content: "Portfolio luxe minimaliste de dr.yp : logos, affiches, flyers, cartes, montage vidéo." },
      { property: "og:title", content: "dr.yp — Designer graphique" },
      { property: "og:description", content: "Portfolio de dr.yp · designs élégants et créations visuelles." },
    ],
  }),
  component: Home,
});

function Home() {
  const fetchFeatured = useServerFn(getFeaturedRealisations);
  const fetchProfile = useServerFn(getSiteProfile);
  const { data: featured } = useQuery({ queryKey: ["featured"], queryFn: () => fetchFeatured() });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  return (
    <SiteLayout>
      <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-6">
        <div className="text-center max-w-5xl">
          <p className="text-[11px] md:text-xs uppercase tracking-[0.45em] text-muted-foreground mb-8">
            Faradito Fibi Florent
          </p>
          <h1
            className="font-display italic text-gold leading-[0.95]"
            style={{ fontSize: "clamp(5rem, 18vw, 16rem)", letterSpacing: "0.02em" }}
          >
            dr.yp
          </h1>
          <div className="mx-auto my-10 gold-divider w-40" />
          <p className="text-sm md:text-base uppercase tracking-[0.35em] text-offwhite/90">
            {profile?.tagline ?? "Designer graphique · Créateur visuel"}
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/realisations"
              className="inline-block hairline px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-500"
            >
              Voir mes réalisations
            </Link>
            <Link
              to="/contact"
              className="inline-block px-10 py-4 text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold transition-colors"
            >
              Me contacter →
            </Link>
          </div>
        </div>
      </section>

      {featured && featured.length > 0 && (
        <section className="py-28 px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12 flex-wrap gap-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-gold mb-3">— En vedette</p>
                <h2 className="font-display italic text-4xl md:text-5xl">Sélection</h2>
              </div>
              <Link to="/realisations" className="text-[11px] uppercase tracking-[0.3em] text-gold hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, 6).map((r) => (
                <figure key={r.id} className="group relative aspect-square hairline overflow-hidden">
                  {r.image_url ? (
                    <img
                      src={r.image_url}
                      alt={r.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0d2a52]">
                      <Logo className="text-5xl opacity-20" />
                    </div>
                  )}
                  <figcaption className="absolute inset-0 bg-navy/85 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-center p-4">
                    <span className="text-[10px] uppercase tracking-[0.35em] text-gold mb-2">{r.category}</span>
                    <span className="font-display text-lg">{r.title}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
