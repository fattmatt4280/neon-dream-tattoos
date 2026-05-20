import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Shyftd Ink" },
      { name: "description", content: "Sign in to the Shyftd Ink admin dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Welcome back");
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <Link to="/" className="font-display text-3xl uppercase mb-10">
        SHYFTD<span className="text-magenta">INK</span>
      </Link>
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 border border-border p-8 bg-card">
        <p className="font-mono text-xs text-magenta tracking-widest uppercase">
          {mode === "signin" ? "ADMIN_LOGIN" : "CREATE_ACCOUNT"}
        </p>
        <input
          name="email"
          type="email"
          required
          placeholder="email@shyftdink.com"
          className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-magenta"
        />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="••••••••"
          className="w-full bg-background border border-border px-4 py-3 focus:outline-none focus:border-magenta"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors disabled:opacity-50"
        >
          {busy ? "…" : mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-xs text-muted-foreground hover:text-magenta"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </form>
      <Link to="/" className="mt-6 font-mono text-[10px] text-muted-foreground hover:text-magenta uppercase tracking-widest">
        ← Back to site
      </Link>
    </div>
  );
}
