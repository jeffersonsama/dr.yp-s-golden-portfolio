import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import { adminDashboardStats } from "@/lib/portfolio.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Admin dr.yp" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchStats = useServerFn(adminDashboardStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });

  return (
    <AdminShell>
      <AdminPageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre activité" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--gold-line)] hairline mb-12">
        <Stat label="Réalisations" value={data?.totalRealisations} />
        <Stat label="Vues du portfolio" value={data?.totalViews} />
        <Stat label="Messages reçus" value={data?.totalMessages} />
        <Stat label="Non lus" value={data?.unreadMessages} accent />
      </div>

      <div className="flex flex-wrap gap-3 mb-14">
        <QuickLink to="/admin/realisations">+ Ajouter une réalisation</QuickLink>
        <QuickLink to="/admin/temoignages">Modérer les avis</QuickLink>
        <QuickLink to="/admin/messages">Voir les messages</QuickLink>
        <QuickLink to="/admin/profil">Modifier le profil</QuickLink>
      </div>


      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold mb-6">Dernière activité</p>
        {data?.recent.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light">Aucune réalisation pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {data?.recent.map((r) => (
              <li key={r.id} className="hairline p-4 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm">{r.title}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">
                    {r.category} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.25em] px-3 py-1 hairline ${
                    r.status === "published" ? "text-gold border-gold" : "text-muted-foreground"
                  }`}
                >
                  {r.status === "published" ? "Publié" : "Brouillon"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | undefined; accent?: boolean }) {
  return (
    <div className="bg-navy p-8">
      <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">{label}</p>
      <p className={`font-display text-5xl ${accent ? "text-gold" : "text-offwhite"}`}>{value ?? "—"}</p>
    </div>
  );
}

function QuickLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="hairline px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy transition-all duration-300"
    >
      {children}
    </Link>
  );
}
