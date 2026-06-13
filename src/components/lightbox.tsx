import { useEffect, useCallback } from "react";

export type LightboxItem = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url: string | null;
};

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: LightboxItem[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const item = items[index];

  const prev = useCallback(() => onNavigate((index - 1 + items.length) % items.length), [index, items.length, onNavigate]);
  const next = useCallback(() => onNavigate((index + 1) % items.length), [index, items.length, onNavigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-navy/95 backdrop-blur-md flex flex-col animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <header className="flex items-center justify-between px-6 lg:px-12 py-5 hairline border-x-0 border-t-0">
        <span className="text-[10px] uppercase tracking-[0.4em] text-gold">
          {index + 1} / {items.length}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-gold transition-colors"
          aria-label="Fermer"
        >
          Fermer ✕
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 lg:px-16 py-6 relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={prev}
          className="absolute left-2 lg:left-8 top-1/2 -translate-y-1/2 hairline w-12 h-12 flex items-center justify-center text-gold hover:bg-gold hover:text-navy transition-all duration-300"
          aria-label="Précédent"
        >
          ←
        </button>

        <figure className="max-w-5xl w-full text-center">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="mx-auto max-h-[70vh] w-auto object-contain hairline"
            />
          ) : (
            <div className="aspect-square w-full max-w-md mx-auto hairline flex items-center justify-center text-muted-foreground">
              Aucune image
            </div>
          )}
          <figcaption className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-2">{item.category}</p>
            <h3 className="font-display italic text-2xl md:text-3xl">{item.title}</h3>
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground font-light max-w-2xl mx-auto">
                {item.description}
              </p>
            )}
          </figcaption>
        </figure>

        <button
          onClick={next}
          className="absolute right-2 lg:right-8 top-1/2 -translate-y-1/2 hairline w-12 h-12 flex items-center justify-center text-gold hover:bg-gold hover:text-navy transition-all duration-300"
          aria-label="Suivant"
        >
          →
        </button>
      </div>
    </div>
  );
}
