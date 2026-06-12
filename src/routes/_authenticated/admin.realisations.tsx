import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import {
  adminListRealisations,
  adminUpsertRealisation,
  adminDeleteRealisation,
} from "@/lib/portfolio.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/realisations")({
  head: () => ({
    meta: [{ title: "Réalisations — Admin dr.yp" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRealisations,
});

type Real = {
  id: string;
  title: string;
  category: "logo" | "affiche" | "flyer" | "carte" | "video";
  description: string | null;
  image_path: string | null;
  image_url: string | null;
  status: "published" | "draft";
  featured: boolean;
  date_month: number | null;
  date_year: number | null;
  created_at: string;
};

const CATS = [
  { v: "logo", l: "Logo" },
  { v: "affiche", l: "Affiche" },
  { v: "flyer", l: "Flyer" },
  { v: "carte", l: "Carte" },
  { v: "video", l: "Vidéo" },
] as const;

function AdminRealisations() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(adminListRealisations);
  const upsert = useServerFn(adminUpsertRealisation);
  const remove = useServerFn(adminDeleteRealisation);

  const { data } = useQuery({ queryKey: ["admin-realisations"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<Partial<Real> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Real | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = (data ?? []).filter(
    (r) => (filterCat === "all" || r.category === filterCat) && (filterStatus === "all" || r.status === filterStatus),
  );

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-realisations"] });

  const onDelete = async (r: Real) => {
    try {
      await remove({ data: { id: r.id } });
      toast.success("Réalisation supprimée.");
      refresh();
    } catch {
      toast.error("Suppression impossible.");
    }
    setConfirmDel(null);
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Réalisations"
        subtitle="Gérer le catalogue affiché sur le portfolio public"
        action={
          <button
            onClick={() =>
              setEditing({
                title: "",
                category: "logo",
                description: "",
                status: "draft",
                featured: false,
                date_year: new Date().getFullYear(),
                date_month: new Date().getMonth() + 1,
              })
            }
            className="hairline px-5 py-3 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy transition-all"
          >
            + Ajouter
          </button>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterCat} onChange={setFilterCat} options={[{ v: "all", l: "Toutes catégories" }, ...CATS]} />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { v: "all", l: "Tous statuts" },
            { v: "published", l: "Publié" },
            { v: "draft", l: "Brouillon" },
          ]}
        />
      </div>

      <div className="hairline overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            <tr className="border-b hairline border-x-0 border-t-0">
              <th className="p-4">Aperçu</th>
              <th className="p-4">Titre</th>
              <th className="p-4">Catégorie</th>
              <th className="p-4">Statut</th>
              <th className="p-4">Vedette</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b hairline border-x-0 border-t-0 last:border-0">
                <td className="p-4">
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="w-14 h-14 object-cover hairline" />
                  ) : (
                    <div className="w-14 h-14 bg-[#0d2a52] hairline" />
                  )}
                </td>
                <td className="p-4 font-light">{r.title}</td>
                <td className="p-4 text-muted-foreground capitalize">{r.category}</td>
                <td className="p-4">
                  <span
                    className={`text-[10px] uppercase tracking-[0.2em] px-2 py-1 hairline ${
                      r.status === "published" ? "text-gold border-gold" : "text-muted-foreground"
                    }`}
                  >
                    {r.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </td>
                <td className="p-4">{r.featured ? "★" : ""}</td>
                <td className="p-4 text-muted-foreground text-xs">
                  {r.date_month && r.date_year ? `${String(r.date_month).padStart(2, "0")}/${r.date_year}` : "—"}
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => setEditing(r)}
                      className="text-[10px] uppercase tracking-[0.2em] text-gold hover:underline"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => setConfirmDel(r)}
                      className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                  Aucune réalisation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <RealisationForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={async (payload) => {
            try {
              await upsert({ data: payload });
              toast.success("Enregistré.");
              setEditing(null);
              refresh();
            } catch (e: any) {
              toast.error(e?.message ?? "Erreur");
            }
          }}
        />
      )}

      {confirmDel && (
        <Modal onClose={() => setConfirmDel(null)}>
          <p className="font-display text-2xl text-gold mb-4">Supprimer ?</p>
          <p className="text-sm text-muted-foreground mb-6 font-light">
            « {confirmDel.title} » sera supprimée définitivement, image comprise.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmDel(null)}
              className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
            >
              Annuler
            </button>
            <button
              onClick={() => onDelete(confirmDel)}
              className="hairline px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy"
            >
              Confirmer
            </button>
          </div>
        </Modal>
      )}
    </AdminShell>
  );
}

function RealisationForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Real>;
  onClose: () => void;
  onSave: (p: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    id: initial.id,
    title: initial.title ?? "",
    category: initial.category ?? "logo",
    description: initial.description ?? "",
    image_path: initial.image_path ?? "",
    status: initial.status ?? "draft",
    featured: initial.featured ?? false,
    date_month: initial.date_month ?? new Date().getMonth() + 1,
    date_year: initial.date_year ?? new Date().getFullYear(),
  });
  const [preview, setPreview] = useState<string | null>(initial.image_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onFile = async (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format JPG, PNG ou WEBP requis.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Maximum 5 Mo.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("portfolio").upload(path, file, { upsert: false });
      if (error) throw error;
      setForm((f) => ({ ...f, image_path: path }));
      setPreview(URL.createObjectURL(file));
      toast.success("Image téléversée.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_path) {
      toast.error("Image requise.");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <p className="font-display italic text-2xl text-gold mb-2">
          {form.id ? "Modifier" : "Nouvelle réalisation"}
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Image</span>
            <label className="aspect-square hairline border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden">
              {preview ? (
                <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-muted-foreground text-center px-4">
                  {uploading ? "Téléversement…" : "Cliquer ou déposer une image (JPG/PNG/WEBP, 5 Mo max)"}
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>

          <div className="space-y-4">
            <FormField label="Titre">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                maxLength={200}
                className="w-full bg-transparent hairline px-3 py-2 text-sm text-offwhite focus:border-gold focus:outline-none"
              />
            </FormField>

            <FormField label="Catégorie">
              <Select
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v as any })}
                options={CATS}
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                maxLength={2000}
                className="w-full bg-transparent hairline px-3 py-2 text-sm text-offwhite focus:border-gold focus:outline-none"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Mois">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.date_month ?? ""}
                  onChange={(e) => setForm({ ...form, date_month: parseInt(e.target.value) || null as any })}
                  className="w-full bg-transparent hairline px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </FormField>
              <FormField label="Année">
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.date_year ?? ""}
                  onChange={(e) => setForm({ ...form, date_year: parseInt(e.target.value) || null as any })}
                  className="w-full bg-transparent hairline px-3 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </FormField>
            </div>

            <FormField label="Statut">
              <Select
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as any })}
                options={[
                  { v: "draft", l: "Brouillon" },
                  { v: "published", l: "Publié" },
                ]}
              />
            </FormField>

            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="accent-[var(--gold)]"
              />
              <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">En vedette</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground hover:text-gold"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || uploading}
            className="hairline px-5 py-2 text-[11px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { v: string; l: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-navy hairline px-3 py-2 text-sm text-offwhite focus:border-gold focus:outline-none"
    >
      {options.map((o) => (
        <option key={o.v} value={o.v} className="bg-navy">
          {o.l}
        </option>
      ))}
    </select>
  );
}

function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-navy/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-navy hairline w-full ${wide ? "max-w-4xl" : "max-w-md"} p-8 my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
