import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { SiteLayout, PageHeader, Logo } from "@/components/site-layout";
import { getPublicRealisations, logPortfolioView } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/realisations")({
  head: () => ({
    meta: [
      { title: "Réalisations — dr.yp" },
      { name: "description", content: "Sélection de logos, affiches, flyers, cartes et montages vidéo signés dr.yp." },
      { property: "og:title", content: "Réalisations — dr.yp" },
      { property: "og:description", content: "Le portfolio complet de dr.yp, filtré par catégorie." },
    ],
  }),
  component: Realisations,
});

const FILTERS = [
  { v: "all", l: "Tous" },
  { v: "logo", l: "Logos" },
  { v: "affiche", l: "Affiches" },
  { v: "flyer", l: "Flyers" },
  { v: "carte", l: "Cartes" },
  { v: "video", l: "Vidéos" },
] as const;

function Realisations() {
  const fetchAll = useServerFn(getPublicRealisations);
  const logView = useServerFn(logPortfolioView);
  const { data } = useQuery({ queryKey: ["public-realisations"], queryFn: () => fetchAll() });
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    logView().catch(() => {});
  }, [logView]);

  const filtered = cat === "all" ? data ?? [] : (data ?? []).filter((r) => r.category === cat);

  return (
    <SiteLayout>
      <PageHeader eyebrow="03" title="Réalisations" subtitle="Filtre par catégorie pour explorer." />
      <section className="px-6 lg:px-12 pb-28">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {FILTERS.map((f) => {
              const active = f.v === cat;
              return (
                <button
                  key={f.v}
                  onClick={() => setCat(f.v)}
                  className={`hairline px-5 py-2 text-[11px] uppercase tracking-[0.25em] transition-all duration-300 ${
                    active ? "bg-gold text-navy border-gold" : "text-muted-foreground hover:text-gold"
                  }`}
                >
                  {f.l}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20 font-light">
              {data ? "Aucune réalisation dans cette catégorie pour le moment." : "Chargement…"}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filtered.map((r) => (
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
                  <figcaption className="absolute inset-0 bg-navy/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center text-center p-6">
                    <span className="text-[10px] uppercase tracking-[0.35em] text-gold mb-3">{r.category}</span>
                    <span className="font-display text-xl">{r.title}</span>
                    {r.description && (
                      <p className="mt-3 text-xs text-muted-foreground font-light line-clamp-3">{r.description}</p>
                    )}
                    <div className="mt-4 gold-divider w-10" />
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
