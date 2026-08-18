import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/studio/")({
  component: StudioDashboard,
});

async function getCount(table: "portfolio_items" | "flash_designs" | "merch_products" | "bookings", filter?: [string, unknown]) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) query = query.eq(filter[0], filter[1] as never);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

function StudioDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["studio", "dashboard-stats"],
    queryFn: async () => {
      const [portfolio, flash, flashUnclaimed, merch, merchActive, bookings, bookingsPending] = await Promise.all([
        getCount("portfolio_items"),
        getCount("flash_designs"),
        getCount("flash_designs", ["claimed", false]),
        getCount("merch_products"),
        getCount("merch_products", ["active", true]),
        getCount("bookings"),
        getCount("bookings", ["status", "pending"]),
      ]);
      return { portfolio, flash, flashUnclaimed, merch, merchActive, bookings, bookingsPending };
    },
  });

  const { data: pendingBookings = [] } = useQuery({
    queryKey: ["studio", "dashboard-pending-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, client_name, client_email, deposit_paid, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl uppercase">Dashboard</h1>
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Shyftd Ink — command center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Bookings pending" value={stats?.bookingsPending} total={stats?.bookings} color="magenta" />
        <StatCard label="Portfolio pieces" value={stats?.portfolio} color="cyan" />
        <StatCard label="Flash unclaimed" value={stats?.flashUnclaimed} total={stats?.flash} color="acid" />
        <StatCard label="Merch active" value={stats?.merchActive} total={stats?.merch} color="cyan" />
      </div>

      <section className="border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl uppercase">Pending bookings</h2>
          <Link to="/studio/bookings" className="font-mono text-[10px] uppercase tracking-widest text-magenta hover:underline">
            View all →
          </Link>
        </div>
        {pendingBookings.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground">Nothing waiting on you.</p>
        ) : (
          <div className="space-y-2">
            {pendingBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between border border-border px-4 py-3">
                <div>
                  <p className="font-mono text-sm">{b.client_name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{b.client_email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {b.deposit_paid && <span className="font-mono text-[9px] uppercase text-acid border border-acid px-1.5 py-0.5">Deposit paid</span>}
                  <p className="font-mono text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border border-border bg-card p-6">
        <h2 className="font-display text-xl uppercase mb-4">Quick links</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { href: "https://supabase.com/dashboard", label: "Supabase dashboard ↗", external: true },
            { href: "https://dashboard.stripe.com", label: "Stripe dashboard ↗", external: true },
            { href: "/", label: "Live site" },
            { href: "/portfolio", label: "Portfolio page" },
            { href: "/flash", label: "Flash page" },
            { href: "/merch", label: "Merch page" },
            { href: "/book", label: "Booking page" },
          ].map(({ href, label, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="block px-4 py-3 border border-border font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value?: number;
  total?: number;
  color: "magenta" | "cyan" | "acid";
}) {
  const colorClass = color === "magenta" ? "text-magenta" : color === "cyan" ? "text-cyan" : "text-acid";
  return (
    <div className="border border-border bg-card p-5">
      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <p className={`font-display text-4xl ${colorClass}`}>
        {value ?? "—"}
        {typeof total === "number" && <span className="text-base text-muted-foreground font-mono"> / {total}</span>}
      </p>
    </div>
  );
}
