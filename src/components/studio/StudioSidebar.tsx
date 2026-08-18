import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Image, Zap, ShoppingBag, CalendarCheck } from "lucide-react";

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/studio", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/studio/content", label: "Site content", icon: FileText },
  { to: "/studio/portfolio", label: "Portfolio", icon: Image },
  { to: "/studio/flash", label: "Flash", icon: Zap },
  { to: "/studio/merch", label: "Merch", icon: ShoppingBag },
  { to: "/studio/bookings", label: "Bookings", icon: CalendarCheck },
];

export function StudioSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact?: boolean) => (exact ? pathname === to : pathname.startsWith(to));

  return (
    <>
      {/* Desktop: fixed left rail */}
      <aside className="hidden md:flex md:flex-col fixed top-16 left-0 h-[calc(100vh-4rem)] w-56 border-r border-border bg-background overflow-y-auto">
        <nav className="flex-1 py-3">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-5 py-2.5 font-mono text-xs uppercase tracking-widest border-l-2 transition-colors ${
                  active
                    ? "border-magenta text-magenta bg-magenta/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Icon className="size-3.5" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-3 border-t border-border">
          <Link
            to="/"
            target="_blank"
            className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            View site ↗
          </Link>
        </div>
      </aside>

      {/* Mobile: horizontal scroll bar */}
      <nav className="md:hidden flex border-b border-border overflow-x-auto">
        {NAV.map(({ to, label, exact }) => {
          const active = isActive(to, exact);
          return (
            <Link
              key={to}
              to={to}
              className={`px-5 py-4 font-mono text-xs uppercase tracking-widest border-b-2 whitespace-nowrap ${
                active ? "border-magenta text-magenta" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
