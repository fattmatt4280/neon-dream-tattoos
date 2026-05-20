import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { toast } from "sonner";
import { LogOut, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Shyftd Ink" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

type Tab = "portfolio" | "flash" | "merch" | "bookings";

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("portfolio");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground">LOADING…</div>;
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="font-display text-3xl uppercase">No admin access</p>
          <p className="mt-2 text-muted-foreground text-sm">Signed in as {user.email}</p>
          <p className="mt-4 text-xs text-muted-foreground font-mono max-w-md">
            Open Cloud → Database → user_roles and add a row with your user id and role <span className="text-magenta">admin</span>.
          </p>
          <button
            onClick={async () => { await supabase.auth.signOut(); }}
            className="mt-6 border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:border-magenta"
          >
            Sign out
          </button>
          <p className="mt-6 font-mono text-[10px] text-muted-foreground select-all">{user.id}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-2xl uppercase">
          SHYFTD<span className="text-magenta">INK</span><span className="text-xs text-muted-foreground ml-3 font-mono normal-case">/admin</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
          <button
            onClick={async () => { await supabase.auth.signOut(); nav({ to: "/" }); }}
            className="flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-xs uppercase hover:border-magenta hover:text-magenta"
          >
            <LogOut className="size-3" /> Out
          </button>
        </div>
      </header>

      <div className="flex border-b border-border overflow-x-auto">
        {(["portfolio", "flash", "merch", "bookings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-4 font-mono text-xs uppercase tracking-widest border-b-2 whitespace-nowrap ${tab === t ? "border-magenta text-magenta" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {tab === "portfolio" && <ContentManager table="portfolio_items" fields={portfolioFields} />}
        {tab === "flash" && <ContentManager table="flash_designs" fields={flashFields} />}
        {tab === "merch" && <ContentManager table="merch_products" fields={merchFields} />}
        {tab === "bookings" && <BookingsManager />}
      </div>
    </div>
  );
}

type Field = { name: string; label: string; type?: "text" | "number" | "url" | "textarea" | "checkbox" | "select"; options?: string[]; required?: boolean };

const portfolioFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "sort_order", label: "Sort order", type: "number" },
];
const flashFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "price_cents", label: "Price (cents)", type: "number", required: true },
  { name: "claimed", label: "Claimed", type: "checkbox" },
];
const merchFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "price_cents", label: "Price (cents)", type: "number", required: true },
  { name: "product_type", label: "Type", type: "select", options: ["print", "sticker", "apparel", "other"], required: true },
  { name: "stock", label: "Stock", type: "number", required: true },
  { name: "active", label: "Active", type: "checkbox" },
];

function ContentManager({ table, fields }: { table: "portfolio_items" | "flash_designs" | "merch_products"; fields: Field[] }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      const v = fd.get(f.name);
      if (f.type === "checkbox") row[f.name] = v === "on";
      else if (f.type === "number") row[f.name] = v ? Number(v) : 0;
      else row[f.name] = v || null;
    }
    const { error } = await supabase.from(table).insert(row as never);
    if (error) return toast.error(error.message);
    toast.success("Created");
    setCreating(false);
    qc.invalidateQueries({ queryKey: ["admin", table] });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin", table] });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-3xl uppercase">{table.replace("_", " ")}</h2>
        <button
          onClick={() => setCreating((c) => !c)}
          className="flex items-center gap-2 bg-magenta text-white px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background"
        >
          <Plus className="size-3" /> {creating ? "Cancel" : "New"}
        </button>
      </div>

      {creating && (
        <form onSubmit={onCreate} className="border border-magenta p-6 space-y-4 bg-card">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{f.label}{f.required && <span className="text-magenta"> *</span>}</span>
              {f.type === "textarea" ? (
                <textarea name={f.name} required={f.required} rows={3} className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta" />
              ) : f.type === "checkbox" ? (
                <input type="checkbox" name={f.name} className="ml-2 mt-1" />
              ) : f.type === "select" ? (
                <select name={f.name} required={f.required} className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta">
                  {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type ?? "text"} name={f.name} required={f.required} className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta" />
              )}
            </label>
          ))}
          <button type="submit" className="w-full bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background">Save</button>
        </form>
      )}

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">LOADING…</p>
      ) : data.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No items yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((row: { id: string; title?: string; image_url?: string }) => (
            <div key={row.id} className="border border-border p-4 bg-card flex gap-4">
              {row.image_url && <img src={row.image_url} alt="" className="size-20 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate">{row.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{row.id}</p>
              </div>
              <button onClick={() => onDelete(row.id)} className="text-destructive hover:text-magenta" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsManager() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(id: string, status: "pending" | "confirmed" | "declined" | "completed") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
  }

  if (isLoading) return <p className="font-mono text-xs text-muted-foreground">LOADING…</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl uppercase">Bookings</h2>
      {data.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No bookings yet.</p>
      ) : (
        data.map((b: { id: string; client_name: string; client_email: string; phone: string | null; concept: string; status: string; preferred_date: string | null; created_at: string }) => (
          <article key={b.id} className="border border-border p-5 bg-card">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <p className="font-display text-xl uppercase">{b.client_name}</p>
                <p className="font-mono text-xs text-muted-foreground">{b.client_email} {b.phone && `· ${b.phone}`}</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-1">
                  Submitted {new Date(b.created_at).toLocaleDateString()}{b.preferred_date && ` · prefers ${b.preferred_date}`}
                </p>
              </div>
              <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${
                b.status === "confirmed" ? "border-acid text-acid" :
                b.status === "declined" ? "border-destructive text-destructive" :
                b.status === "completed" ? "border-cyan text-cyan" : "border-magenta text-magenta"
              }`}>{b.status}</span>
            </div>
            <p className="mt-4 text-sm whitespace-pre-wrap">{b.concept}</p>
            <div className="mt-4 flex gap-2 flex-wrap">
              {(["pending", "confirmed", "declined", "completed"] as const).map((s) => (
                <button key={s} onClick={() => updateStatus(b.id, s)} className="font-mono text-[10px] uppercase border border-border px-3 py-1 hover:border-magenta hover:text-magenta">
                  {s}
                </button>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
