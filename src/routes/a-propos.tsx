import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout, PageHeader, Logo } from "@/components/site-layout";
import { getSiteProfile } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos — dr.yp" },
      { name: "description", content: "Faradito Fibi Florent, alias dr.yp : designer graphique passionné par les identités visuelles élégantes." },
      { property: "og:title", content: "À propos — dr.yp" },
      { property: "og:description", content: "Designer graphique attentif à votre vision, ouvert aux retours, fidèle aux délais." },
    ],
  }),
  component: About,
});

const ENGAGEMENTS = [
  "Je prends le temps de comprendre votre vision",
  "Ouvert aux retours et modifications",
  "Livraisons dans les délais convenus",
];

function About() {
  const fetchProfile = useServerFn(getSiteProfile);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  return (
    <SiteLayout>
      <PageHeader eyebrow="01" title="À propos" subtitle="Designer graphique · Créateur visuel" />

      <section className="px-6 lg:px-12 pb-28">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_2fr] gap-12 lg:gap-20 items-start">
          <div className="aspect-square hairline overflow-hidden">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="dr.yp" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0d2a52]">
                <Logo className="text-6xl opacity-30" />
              </div>
            )}
          </div>

          <div>
            <div className="space-y-5 text-[15px] leading-relaxed text-offwhite/85 font-light">
              {(profile?.about ?? "").split("\n").map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              {!profile?.about && (
                <p>
                  Je suis <span className="text-gold">Faradito Fibi Florent</span>, designer graphique sous le pseudo
                  <Logo className="text-lg mx-2" />.
                </p>
              )}
            </div>

            <div className="mt-14">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-8">Mes engagements</p>
              <ul className="space-y-5">
                {ENGAGEMENTS.map((s) => (
                  <li key={s} className="flex items-start gap-4 text-[15px] text-offwhite/90 font-light">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
