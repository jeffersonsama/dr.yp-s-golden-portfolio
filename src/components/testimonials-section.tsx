import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublicTestimonials, submitTestimonial } from "@/lib/portfolio.functions";
import { toast } from "sonner";

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          disabled={!onChange}
          className={`text-xl ${i <= value ? "text-gold" : "text-muted-foreground/40"} ${
            onChange ? "hover:text-gold cursor-pointer" : "cursor-default"
          } transition-colors`}
          aria-label={`${i} étoiles`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getPublicTestimonials);
  const submit = useServerFn(submitTestimonial);
  const { data } = useQuery({ queryKey: ["testimonials"], queryFn: () => fetchAll() });

  const [form, setForm] = useState({ name: "", service: "", rating: 5, message: "" });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.service.trim() || form.message.trim().length < 5) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: form });
      toast.success("Merci ! Votre avis sera publié après validation.");
      setForm({ name: "", service: "", rating: 5, message: "" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["testimonials"] });
    } catch {
      toast.error("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-28 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[0.4em] text-gold mb-3">— Témoignages</p>
          <h2 className="font-display italic text-4xl md:text-5xl">Ce qu'ils en disent</h2>
          <div className="gold-divider w-20 mt-6 mx-auto" />
        </div>

        {data && data.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {data.slice(0, 6).map((t) => (
              <article key={t.id} className="hairline p-8 flex flex-col">
                <Stars value={t.rating} />
                <p className="mt-5 text-sm font-light leading-relaxed text-offwhite/90 flex-1">
                  « {t.message} »
                </p>
                <footer className="mt-6 pt-5 border-t hairline border-x-0 border-b-0">
                  <p className="font-display italic text-gold">{t.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">{t.service}</p>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground font-light mb-16">
            Soyez le premier à laisser un avis.
          </p>
        )}

        <div className="max-w-2xl mx-auto text-center">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="hairline px-8 py-4 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-500"
            >
              Laisser un avis
            </button>
          ) : (
            <form onSubmit={onSubmit} className="text-left space-y-5 hairline p-8 animate-fade-in">
              <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Votre avis</p>
              <input
                placeholder="Votre nom"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-transparent hairline px-4 py-3 text-sm font-light focus:border-gold focus:outline-none"
              />
              <input
                placeholder="Service commandé (ex : Logo)"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full bg-transparent hairline px-4 py-3 text-sm font-light focus:border-gold focus:outline-none"
              />
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Note</span>
                <Stars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
              </div>
              <textarea
                placeholder="Votre message…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
                className="w-full bg-transparent hairline px-4 py-3 text-sm font-light focus:border-gold focus:outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 hairline px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy disabled:opacity-50 transition-all"
                >
                  {loading ? "Envoi…" : "Publier mon avis"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
