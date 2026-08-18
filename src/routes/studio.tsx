import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { StudioSidebar } from "@/components/studio/StudioSidebar";

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
  component: StudioLayout,
});

function StudioLayout() {
  const { user, isAdmin } = Route.useRouteContext();
  const nav = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/login", search: { redirect: "/studio" }, replace: true });
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="font-display text-3xl uppercase">No studio access</p>
          <p className="mt-2 text-muted-foreground text-sm">Signed in as {user.email}</p>
          <button
            onClick={signOut}
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
      <header className="h-16 border-b border-border px-6 flex items-center justify-between">
        <Link to="/studio" className="font-display text-2xl uppercase">
          SHYFTD<span className="text-magenta">INK</span>
          <span className="text-xs text-muted-foreground ml-3 font-mono normal-case">/studio</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground hidden sm:inline">{user.email}</span>
          <button
            onClick={signOut}
            className="flex items-center gap-2 border border-border px-3 py-1.5 font-mono text-xs uppercase hover:border-magenta hover:text-magenta"
          >
            <LogOut className="size-3" /> Out
          </button>
        </div>
      </header>

      <StudioSidebar />

      <main className="md:ml-56 p-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
