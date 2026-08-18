/**
 * Grayscale image with a color half revealed behind a diagonal cut that slowly
 * leans back and forth ("shifts"). No pointer/hover needed — pure CSS clip-path
 * animation, so it reads the same on mobile as on desktop. Distinct from
 * SpotlightImage's roaming circular reveal.
 */
export function ShiftImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ contain: "paint" }}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        width={800}
        height={1000}
        className="w-full h-full object-cover grayscale contrast-125"
      />
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover saturate-150 animate-shift-diagonal"
        style={{ willChange: "clip-path" }}
      />
    </div>
  );
}
