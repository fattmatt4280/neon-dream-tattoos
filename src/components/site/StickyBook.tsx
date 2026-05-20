import { Link, useRouterState } from "@tanstack/react-router";

export function StickyBook() {
  const { location } = useRouterState();
  if (location.pathname.startsWith("/book") || location.pathname.startsWith("/admin") || location.pathname.startsWith("/login")) {
    return null;
  }
  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      <div className="absolute inset-0 bg-magenta blur-xl opacity-0 group-hover:opacity-50 transition-opacity" aria-hidden />
      <Link
        to="/book"
        className="relative bg-background border-2 border-magenta px-5 py-3 flex flex-col items-center gap-0.5 hover:-translate-y-1 transition-transform"
      >
        <span className="font-mono text-[8px] text-magenta uppercase tracking-widest">Insert Coin</span>
        <span className="font-display text-base text-foreground leading-none">START</span>
      </Link>
    </div>
  );
}
