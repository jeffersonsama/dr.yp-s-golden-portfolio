import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AdminShell, AdminPageHeader } from "@/components/admin-shell";
import {
  adminListRealisations,
  adminUpsertRealisation,
  adminDeleteRealisation,
  adminReorderRealisations,
} from "@/lib/portfolio.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/realisations")({
  head: () => ({
    meta: [{ title: "Réalisations — Admin dr.yp" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminRealisations,
});

type GalleryItem = {
  id?: string;
  image_path: string;
  image_url?: string | null;
  caption?: string | null;
};

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
  sort_order: number;
  gallery: GalleryItem[];
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
  const reorder = useServerFn(adminReorderRealisations);

  const { data } = useQuery({ queryKey: ["admin-realisations"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<Partial<Real> | null>(null);
  const [confirmDel, setConfirmDel] = useState<Real | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [items, setItems] = useState<Real[]>([]);

  useEffect(() => {
    setItems((data ?? []) as Real[]);
  }, [data]);

  const filtered = items.filter(
    (r) => (filterCat === "all" || r.category === filterCat) && (filterStatus === "all" || r.status === filterStatus),
  );
  const canReorder = filterCat === "all" && filterStatus === "all";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    try {
      await reorder({ data: { ids: next.map((i) => i.id) } });
      qc.invalidateQueries({ queryKey: ["public-realisations"] });
    } catch {
      toast.error("Réordonnancement impossible.");
      setItems(items);
    }
  };

  return (
    <AdminShell>
      <AdminPageHeader
        title="Réalisations"
        subtitle={canReorder ? "Glissez-déposez pour réordonner" : "Désactivez les filtres pour réordonner"}
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
                gallery: [],
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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={canReorder ? onDragEnd : undefined}>
        <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
          <div className="hairline overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                <tr className="border-b hairline border-x-0 border-t-0">
                  <th className="p-4 w-8"></th>
                  <th className="p-4">Aperçu</th>
                  <th className="p-4">Titre</th>
                  <th className="p-4">Catégorie</th>
                  <th className="p-4">Galerie</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Vedette</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <SortableRow
                    key={r.id}
                    r={r}
                    canReorder={canReorder}
                    onEdit={() => setEditing(r)}
                    onDelete={() => setConfirmDel(r)}
                  />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-sm">
                      Aucune réalisation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SortableContext>
      </DndContext>

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
              qc.invalidateQueries({ queryKey: ["public-realisations"] });
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
            « {confirmDel.title} » sera supprimée définitivement, images comprises.
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

function SortableRow({
  r,
  canReorder,
  onEdit,
  onDelete,
}: {
  r: Real;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: r.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className="border-b hairline border-x-0 border-t-0 last:border-0 bg-navy">
      <td className="p-4">
        {canReorder ? (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-gold text-lg"
            aria-label="Réordonner"
            title="Glisser pour réordonner"
          >
            ⋮⋮
          </button>
        ) : (
          <span className="text-muted-foreground/30">⋮⋮</span>
        )}
      </td>
      <td className="p-4">
        {r.image_url ? (
          <img src={r.image_url} alt="" className="w-14 h-14 object-cover hairline" />
        ) : (
          <div className="w-14 h-14 bg-[#0d2a52] hairline" />
        )}
      </td>
      <td className="p-4 font-light">{r.title}</td>
      <td className="p-4 text-muted-foreground capitalize">{r.category}</td>
      <td className="p-4 text-muted-foreground text-xs">
        {r.gallery.length > 0 ? `+${r.gallery.length}` : "—"}
      </td>
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
      <td className="p-4 text-right">
        <div className="inline-flex gap-2">
          <button onClick={onEdit} className="text-[10px] uppercase tracking-[0.2em] text-gold hover:underline">
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}

const ACCEPTED_IMAGE = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const ACCEPTED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];
const ACCEPT_ATTR = [...ACCEPTED_IMAGE, ...ACCEPTED_VIDEO].join(",");
const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 Mo
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500 Mo

export function isVideoUrl(u?: string | null) {
  return !!u && /\.(mp4|webm|mov|m4v|qt)(\?|$)/i.test(u);
}

async function uploadOne(file: File, prefix = "") {
  const isVideo = file.type.startsWith("video/") || ACCEPTED_VIDEO.includes(file.type);
  const isImage = file.type.startsWith("image/") || ACCEPTED_IMAGE.includes(file.type);
  if (!isVideo && !isImage) {
    throw new Error("Format non supporté (images ou vidéos uniquement).");
  }
  const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > limit) {
    throw new Error(`Fichier trop volumineux (max ${Math.round(limit / 1024 / 1024)} Mo).`);
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? (isVideo ? "mp4" : "jpg");
  const path = `${prefix}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("portfolio")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw error;
  return path;
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
  const [mainIsVideo, setMainIsVideo] = useState<boolean>(isVideoUrl(initial.image_path ?? initial.image_url));
  const [gallery, setGallery] = useState<GalleryItem[]>(initial.gallery ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onMainFile = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadOne(file);
      setForm((f) => ({ ...f, image_path: path }));
      setPreview(URL.createObjectURL(file));
      setMainIsVideo(file.type.startsWith("video/"));
      toast.success("Média principal téléversé.");
    } catch (e: any) {
      toast.error(e?.message ?? "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const onGalleryFiles = async (files: FileList) => {
    if (gallery.length + files.length > 50) {
      toast.error("Maximum 50 fichiers dans la galerie.");
      return;
    }
    setUploading(true);
    const next: GalleryItem[] = [...gallery];
    for (const file of Array.from(files)) {
      try {
        const path = await uploadOne(file, "gallery/");
        next.push({ image_path: path, image_url: URL.createObjectURL(file), caption: "" });
      } catch (e: any) {
        toast.error(`${file.name} : ${e?.message ?? "échec"}`);
      }
    }
    setGallery(next);
    setUploading(false);
  };

  const removeFromGallery = (idx: number) => setGallery((g) => g.filter((_, i) => i !== idx));

  const onGalleryDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = gallery.findIndex((g) => (g.image_path) === active.id);
    const newIdx = gallery.findIndex((g) => (g.image_path) === over.id);
    setGallery(arrayMove(gallery, oldIdx, newIdx));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_path) {
      toast.error("Image principale requise.");
      return;
    }
    setSaving(true);
    await onSave({
      ...form,
      gallery: gallery.map((g) => ({ image_path: g.image_path, caption: g.caption ?? null })),
    });
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
            <span className="block text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Média principal</span>
            <label className="aspect-square hairline border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden">
              {preview ? (
                isVideoUrl(form.image_path) || preview.startsWith("blob:") && mainIsVideo ? (
                  <video src={preview} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                ) : (
                  <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )
              ) : (
                <span className="text-xs text-muted-foreground text-center px-4">
                  {uploading ? "Téléversement…" : "Cliquer — image 50 Mo / vidéo 500 Mo max"}
                </span>
              )}
              <input
                type="file"
                accept={ACCEPT_ATTR}
                onChange={(e) => e.target.files?.[0] && onMainFile(e.target.files[0])}
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

        {/* Gallery */}
        <div className="pt-4 border-t hairline border-x-0 border-b-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Galerie supplémentaire ({gallery.length}/20)
            </span>
            <label className="hairline px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-gold hover:bg-gold hover:text-navy cursor-pointer">
              + Ajouter des images
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => e.target.files && onGalleryFiles(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {gallery.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onGalleryDragEnd}>
              <SortableContext items={gallery.map((g) => g.image_path)} strategy={horizontalListSortingStrategy}>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {gallery.map((g, i) => (
                    <GalleryTile
                      key={g.image_path}
                      g={g}
                      onRemove={() => removeFromGallery(i)}
                      onCaption={(c) =>
                        setGallery((arr) => arr.map((x, j) => (j === i ? { ...x, caption: c } : x)))
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
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

function GalleryTile({
  g,
  onRemove,
  onCaption,
}: {
  g: GalleryItem;
  onRemove: () => void;
  onCaption: (c: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: g.image_path });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="hairline overflow-hidden group">
      <div className="aspect-square relative cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        {g.image_url ? (
          <img src={g.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[#0d2a52]" />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 right-1 w-6 h-6 bg-navy/80 hairline text-gold text-xs hover:bg-gold hover:text-navy"
          aria-label="Supprimer"
        >
          ✕
        </button>
      </div>
      <input
        value={g.caption ?? ""}
        onChange={(e) => onCaption(e.target.value)}
        placeholder="Légende…"
        maxLength={500}
        className="w-full bg-transparent px-2 py-1 text-[10px] text-offwhite border-t hairline border-x-0 border-b-0 focus:outline-none focus:text-gold"
      />
    </div>
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
