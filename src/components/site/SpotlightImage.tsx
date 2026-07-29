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

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);

    const set = (x: number, y: number) => {
      el.style.setProperty("--sx", `${x}px`);
      el.style.setProperty("--sy", `${y}px`);
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || active.current) return;
      const r = el.getBoundingClientRect();
      const s = seed.current;
      const x = r.width * (0.5 + 0.34 * Math.sin(t / 2600 + s));
      const y = r.height * (0.5 + 0.32 * Math.cos(t / 1900 + s * 1.7));
      set(x, y);
    };

    if (!reduce) raf = requestAnimationFrame(loop);
    else set(el.clientWidth / 2, el.clientHeight / 2);

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      active.current = true;
      el.style.setProperty("--sr", `${radius * 1.25}px`);
      set(e.clientX - r.left, e.clientY - r.top);
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
