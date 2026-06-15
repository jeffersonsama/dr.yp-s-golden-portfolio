import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublicTestimonials, submitTestimonial } from "@/lib/portfolio.functions";
import { supabase } from "@/integrations/supabase/client";
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

const MAX_PROOFS = 3;

export function TestimonialsSection() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getPublicTestimonials);
  const submit = useServerFn(submitTestimonial);
  const { data } = useQuery({ queryKey: ["testimonials"], queryFn: () => fetchAll() });

  const [form, setForm] = useState({ name: "", service: "", rating: 5, message: "" });
  const [proofs, setProofs] = useState<Array<{ path: string; preview: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const onProofFiles = async (files: FileList) => {
    if (proofs.length + files.length > MAX_PROOFS) {
      toast.error(`Maximum ${MAX_PROOFS} images de preuve.`);
      return;
    }
    setUploading(true);
    const next = [...proofs];
    for (const f of Array.from(files)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        toast.error(`${f.name} : format non supporté.`);
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} : 5 Mo max.`);
        continue;
      }
      try {
        const ext = f.name.split(".").pop();
        const path = `testimonials/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("portfolio").upload(path, f);
        if (error) throw error;
        next.push({ path, preview: URL.createObjectURL(f) });
      } catch (e: any) {
        toast.error(`${f.name} : ${e?.message ?? "échec"}`);
      }
    }
    setProofs(next);
    setUploading(false);
  };

  const removeProof = (i: number) => setProofs((p) => p.filter((_, j) => j !== i));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.service.trim() || form.message.trim().length < 5) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      await submit({ data: { ...form, proof_image_paths: proofs.map((p) => p.path) } });
      toast.success("Merci ! Votre avis sera publié après validation.");
      setForm({ name: "", service: "", rating: 5, message: "" });
      setProofs([]);
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
            {data.slice(0, 6).map((t: any) => (
              <article key={t.id} className="hairline p-8 flex flex-col">
                <Stars value={t.rating} />
                <p className="mt-5 text-sm font-light leading-relaxed text-offwhite/90 flex-1">
                  « {t.message} »
                </p>
                {t.proof_image_urls && t.proof_image_urls.length > 0 && (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {t.proof_image_urls.map((u: string, i: number) => (
                      <button
                        key={i}
                        onClick={() => setLightbox(u)}
                        className="w-14 h-14 hairline overflow-hidden hover:border-gold transition-colors"
                        aria-label="Voir la preuve"
                      >
                        <img src={u} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
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

              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                  Photos de preuve <span className="text-muted-foreground/60">(optionnel · {proofs.length}/{MAX_PROOFS})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {proofs.map((p, i) => (
                    <div key={i} className="relative w-16 h-16 hairline overflow-hidden">
                      <img src={p.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProof(i)}
                        className="absolute top-0 right-0 w-5 h-5 bg-navy/80 text-gold text-xs hover:bg-gold hover:text-navy"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {proofs.length < MAX_PROOFS && (
                    <label className="w-16 h-16 hairline border-dashed flex items-center justify-center text-xs text-muted-foreground hover:text-gold cursor-pointer">
                      {uploading ? "…" : "+"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(e) => e.target.files && onProofFiles(e.target.files)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || uploading}
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

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-full object-contain hairline" />
        </div>
      )}
    </section>
  );
}
