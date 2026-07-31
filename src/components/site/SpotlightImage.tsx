import { useEffect, useRef } from "react";

/**
 * Grayscale image with a roaming "spotlight ball" that reveals the real colors
 * underneath. Follows pointer / touch; drifts on its own when untouched.
 */
export function SpotlightImage({
  src,
  alt,
  className = "",
  radius = 110,
}: {
  src: string;
  alt: string;
  className?: string;
  radius?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const seed = useRef(Math.random() * 1000);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let box = el.getBoundingClientRect();
    let tx = box.width / 2;
    let ty = box.height / 2;
    let cx = tx;
    let cy = ty;

    const ro = new ResizeObserver(() => {
      box = el.getBoundingClientRect();
    });
    ro.observe(el);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) box = el.getBoundingClientRect();
    });
    io.observe(el);

    const set = (x: number, y: number) => {
      el.style.setProperty("--sx", `${x.toFixed(1)}px`);
      el.style.setProperty("--sy", `${y.toFixed(1)}px`);
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (!active.current) {
        const s = seed.current;
        tx = box.width * (0.5 + 0.34 * Math.sin(t / 1300 + s));
        ty = box.height * (0.5 + 0.32 * Math.cos(t / 950 + s * 1.7));
      }
      // fast easing toward the target keeps it snappy but smooth
      const k = active.current ? 0.45 : 0.25;
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;
      set(cx, cy);
    };

    if (!reduce) raf = requestAnimationFrame(loop);
    else set(box.width / 2, box.height / 2);

    const move = (e: PointerEvent) => {
      active.current = true;
      el.style.setProperty("--sr", `${radius * 1.25}px`);
      tx = e.clientX - box.left;
      ty = e.clientY - box.top;
      if (reduce) set(tx, ty);
    };
    const leave = () => {
      active.current = false;
      el.style.setProperty("--sr", `${radius}px`);
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerdown", move);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);
    el.addEventListener("pointerup", leave);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerdown", move);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointercancel", leave);
      el.removeEventListener("pointerup", leave);
    };
  }, [radius]);

  const mask =
    "radial-gradient(circle var(--sr) at var(--sx) var(--sy), #000 0%, #000 55%, rgba(0,0,0,0.35) 78%, transparent 100%)";

  return (
    <div
      ref={wrap}
      className={`relative overflow-hidden ${className}`}
      style={
        {
          "--sx": "50%",
          "--sy": "50%",
          "--sr": `${radius}px`,
        } as React.CSSProperties
      }
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={800}
        height={1000}
        className="w-full h-full object-cover grayscale contrast-125"
      />
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover saturate-150"
        style={{ maskImage: mask, WebkitMaskImage: mask }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-screen opacity-70"
        style={{
          background:
            "radial-gradient(circle calc(var(--sr) * 1.15) at var(--sx) var(--sy), color-mix(in oklab, var(--cyan, #22d3ee) 22%, transparent) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
