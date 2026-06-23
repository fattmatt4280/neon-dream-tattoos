import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { AccountMenu } from "./AccountMenu";

const links = [
  { to: "/portfolio", label: "Portfolio", color: "hover:text-cyan" },
  { to: "/flash", label: "Flash", color: "hover:text-magenta" },
  { to: "/merch", label: "Shop", color: "hover:text-acid" },
  { to: "/book", label: "Book", color: "hover:text-cyan" },
  { to: "/contact", label: "Contact", color: "hover:text-magenta" },
] as const;

export function Nav() {
  const { location } = useRouterState();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-8 rounded-full bg-magenta shadow-neon-magenta group-hover:scale-110 transition-transform" />
          <span className="font-display text-2xl tracking-tighter uppercase">Shyftd</span>
        </Link>
        <div className="hidden md:flex gap-8 font-mono text-xs uppercase tracking-widest">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`transition-colors ${l.color}`}
              activeProps={{ className: "text-magenta" }}
            >
              {l.label}
            </Link>
          ))}
          <span className="text-magenta flicker">● Online</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <AccountMenu />
          <Link
            to="/book"
            className="inline-flex px-4 py-2 border border-magenta text-magenta font-mono text-xs uppercase tracking-wider hover:bg-magenta hover:text-white transition-all"
          >
            Book_Session
          </Link>
        </div>
        <button
          className="md:hidden text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-6 flex flex-col gap-4 font-mono text-sm uppercase tracking-widest">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="py-2">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
