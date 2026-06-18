import { useEffect, useCallback, useState } from "react";

const isVideo = (u?: string | null) => !!u && /\.(mp4|webm|mov|m4v|qt)(\?|$)/i.test(u);

export type LightboxItem = {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  image_url: string | null;
  gallery?: Array<{ image_url: string | null; caption?: string | null }>;
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
  const [imgIdx, setImgIdx] = useState(0);

  // images for this project = main + gallery
  const projectImages: Array<{ url: string | null; caption?: string | null }> = item
    ? [
        { url: item.image_url, caption: null },
        ...((item.gallery ?? []).map((g) => ({ url: g.image_url, caption: g.caption ?? null }))),
      ].filter((x) => x.url)
    : [];

  useEffect(() => {
    setImgIdx(0);
  }, [index]);

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
  const currentImg = projectImages[imgIdx] ?? projectImages[0];

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
          {currentImg?.url ? (
            isVideo(currentImg.url) ? (
              <video
                src={currentImg.url}
                controls
                playsInline
                className="mx-auto max-h-[70vh] w-auto hairline bg-black"
              />
            ) : (
              <img
                src={currentImg.url}
                alt={item.title}
                className="mx-auto max-h-[60vh] w-auto object-contain hairline"
              />
            )
          ) : (
            <div className="aspect-square w-full max-w-md mx-auto hairline flex items-center justify-center text-muted-foreground">
              Aucune image
            </div>
          )}
          <figcaption className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold mb-2">{item.category}</p>
            <h3 className="font-display italic text-2xl md:text-3xl">{item.title}</h3>
            {currentImg?.caption ? (
              <p className="mt-2 text-xs text-gold/80 font-light italic">{currentImg.caption}</p>
            ) : null}
            {item.description && (
              <p className="mt-3 text-sm text-muted-foreground font-light max-w-2xl mx-auto">
                {item.description}
              </p>
            )}
          </figcaption>

          {projectImages.length > 1 && (
            <div className="mt-6 flex gap-2 justify-center flex-wrap">
              {projectImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-14 h-14 hairline overflow-hidden ${i === imgIdx ? "border-gold ring-1 ring-gold" : "opacity-60 hover:opacity-100"}`}
                  aria-label={`Image ${i + 1}`}
                >
                  {img.url && (isVideo(img.url) ? (
                    <video src={img.url} className="w-full h-full object-cover" muted playsInline />
                  ) : (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ))}
                </button>
              ))}
            </div>
          )}
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
