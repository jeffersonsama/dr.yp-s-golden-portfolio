import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import {
  adminListTestimonials,
  adminSetTestimonialApproval,
  adminDeleteTestimonial,
} from "@/lib/portfolio.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/temoignages")({
  head: () => ({
    meta: [{ title: "Témoignages — Admin dr.yp" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminTestimonials,
});

function AdminTestimonials() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(adminListTestimonials);
  const setApproval = useServerFn(adminSetTestimonialApproval);
  const del = useServerFn(adminDeleteTestimonial);

  const { data } = useQuery({ queryKey: ["admin-testimonials"], queryFn: () => fetchAll() });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-testimonials"] });
    qc.invalidateQueries({ queryKey: ["testimonials"] });
  };

  const toggle = async (id: string, approved: boolean) => {
    try {
      await setApproval({ data: { id, approved } });
      toast.success(approved ? "Avis publié." : "Avis retiré.");
      invalidate();
    } catch {
      toast.error("Erreur.");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer cet avis ?")) return;
    try {
      await del({ data: { id } });
      toast.success("Avis supprimé.");
      invalidate();
    } catch {
      toast.error("Erreur.");
    }
  };

  const pending = (data ?? []).filter((t) => !t.approved);
  const approved = (data ?? []).filter((t) => t.approved);

  return (
    <AdminShell>
      <AdminPageHeader
        title="Témoignages"
        subtitle="Valider, retirer ou supprimer les avis déposés par les visiteurs"
      />

      <Section title={`À valider (${pending.length})`} accent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light">Aucun avis en attente.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((t) => (
              <Card key={t.id} t={t} onApprove={() => toggle(t.id, true)} onDelete={() => remove(t.id)} />
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Publiés (${approved.length})`}>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground font-light">Aucun avis publié.</p>
        ) : (
          <ul className="space-y-3">
            {approved.map((t) => (
              <Card key={t.id} t={t} onUnapprove={() => toggle(t.id, false)} onDelete={() => remove(t.id)} />
            ))}
          </ul>
        )}
      </Section>
    </AdminShell>
  );
}

function Section({ title, accent, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className={`text-[11px] uppercase tracking-[0.3em] mb-5 ${accent ? "text-gold" : "text-muted-foreground"}`}>
        {title}
      </p>
      {children}
    </section>
  );
}

function Card({
  t,
  onApprove,
  onUnapprove,
  onDelete,
}: {
  t: { id: string; name: string; service: string; rating: number; message: string; created_at: string };
  onApprove?: () => void;
  onUnapprove?: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="hairline p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-display italic text-gold">{t.name}</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{t.service}</span>
            <span className="text-gold">{"★".repeat(t.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - t.rating)}</span></span>
          </div>
          <p className="mt-3 text-sm font-light leading-relaxed">« {t.message} »</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {new Date(t.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex gap-2">
          {onApprove && (
            <button onClick={onApprove} className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy transition-all">
              Approuver
            </button>
          )}
          {onUnapprove && (
            <button onClick={onUnapprove} className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold">
              Retirer
            </button>
          )}
          <button onClick={onDelete} className="hairline px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-red-400">
            Supprimer
          </button>
        </div>
      </div>
    </li>
  );
}
