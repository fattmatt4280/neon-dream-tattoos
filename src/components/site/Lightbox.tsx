import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export type LightboxItem = {
  id: string | number;
  image_url: string;
  title: string;
  description?: string | null;
  tags?: string[] | null;
};

export function Lightbox({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const open = index !== null;
  const item = open ? items[index] : null;

  const next = useCallback(() => {
    if (index === null) return;
    onIndexChange((index + 1) % items.length);
  }, [index, items.length, onIndexChange]);

  const prev = useCallback(() => {
    if (index === null) return;
    onIndexChange((index - 1 + items.length) % items.length);
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, next, prev]);

  if (!open || !item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Close preview"
        className="absolute top-4 right-4 z-10 p-2 border border-border bg-card/70 text-foreground hover:text-magenta hover:border-magenta transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {items.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Previous image"
            className="absolute left-2 md:left-6 z-10 p-3 border border-border bg-card/70 hover:text-cyan hover:border-cyan transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Next image"
            className="absolute right-2 md:right-6 z-10 p-3 border border-border bg-card/70 hover:text-cyan hover:border-cyan transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <figure
        className="max-w-[92vw] max-h-[92vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.image_url}
          alt={item.title}
          className="max-w-[92vw] max-h-[74vh] object-contain shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)]"
        />
        <figcaption className="text-center px-4">
          <p className="font-mono text-[10px] text-magenta uppercase tracking-widest">
            {String(index! + 1).padStart(3, "0")} / {String(items.length).padStart(3, "0")}
          </p>
          <p className="font-display text-2xl uppercase mt-1">{item.title}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{item.description}</p>
          )}
          {item.tags?.length ? (
            <div className="flex gap-2 mt-3 flex-wrap justify-center">
              {item.tags.map((t) => (
                <span key={t} className="font-mono text-[9px] uppercase text-cyan border border-cyan/40 px-2 py-0.5">{t}</span>
              ))}
            </div>
          ) : null}
        </figcaption>
      </figure>
    </div>
  );
}
