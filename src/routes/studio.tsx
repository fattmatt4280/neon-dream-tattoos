import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { LogOut } from "lucide-react";
import {
  BookingsManager,
  ContentManager,
  SiteContentEditor,
  flashFields,
  merchFields,
  portfolioFields,
} from "@/components/studio/Managers";

export const Route = createFileRoute("/studio")({
  ssr: false,
  head: () => ({ meta: [{ title: "Studio — Shyftd Ink" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: "/studio" } });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    return { user: data.user, isAdmin: !!isAdmin };
  },
  component: StudioPage,
});

type Tab = "content" | "portfolio" | "flash" | "merch" | "bookings";
const TABS: Tab[] = ["content", "portfolio", "flash", "merch", "bookings"];

function StudioPage() {
  const { user, isAdmin } = Route.useRouteContext();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("content");


  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="font-display text-3xl uppercase">No studio access</p>
          <p className="mt-2 text-muted-foreground text-sm">Signed in as {user.email}</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
            }}
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
          SHYFTD<span className="text-magenta">INK</span>
          <span className="text-xs text-muted-foreground ml-3 font-mono normal-case">/studio</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/" });
            }}
            className="flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-xs uppercase hover:border-magenta hover:text-magenta"
          >
            <LogOut className="size-3" /> Out
          </button>
        </div>
      </header>

      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-4 font-mono text-xs uppercase tracking-widest border-b-2 whitespace-nowrap ${
              tab === t ? "border-magenta text-magenta" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {tab === "content" && <SiteContentEditor />}
        {tab === "portfolio" && <ContentManager table="portfolio_items" fields={portfolioFields} />}
        {tab === "flash" && <ContentManager table="flash_designs" fields={flashFields} />}
        {tab === "merch" && <ContentManager table="merch_products" fields={merchFields} />}
        {tab === "bookings" && <BookingsManager />}
      </div>
    </div>
  );
}
