import { AnimatedCounter } from "./animated-counter";

export function StatsSection({ stats }: { stats?: { clients?: number; projects?: number; years?: number } | null }) {
  const s = stats ?? {};
  const items = [
    { value: s.clients ?? 0, suffix: "+", label: "Clients satisfaits" },
    { value: s.projects ?? 0, suffix: "+", label: "Projets réalisés" },
    { value: s.years ?? 0, suffix: "", label: "Années d'expérience" },
  ];

  return (
    <section className="py-24 px-6 lg:px-12 border-y hairline border-x-0">
      <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-12 text-center">
        {items.map((it) => (
          <div key={it.label}>
            <AnimatedCounter value={it.value} suffix={it.suffix} />
            <div className="gold-divider w-12 mt-4 mx-auto" />
            <p className="mt-4 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
