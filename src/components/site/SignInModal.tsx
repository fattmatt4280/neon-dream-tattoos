import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { Chrome, X } from "lucide-react";

export function SignInModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (!data.session) setOpen(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setOpen(false);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

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
      toast.success("Welcome");
      setOpen(false);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Check your email to confirm.");
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-sm border border-border bg-card p-8 shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 text-muted-foreground hover:text-magenta"
        >
          <X className="size-4" />
        </button>
        <p className="font-display text-2xl uppercase tracking-tight mb-1">
          SHYFTD<span className="text-magenta">INK</span>
        </p>
        <p className="font-mono text-[10px] text-magenta tracking-widest uppercase mb-6">
          {mode === "signin" ? "Sign in to continue" : "Create your account"}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            placeholder="email@shyftdink.com"
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-magenta"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="••••••••"
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-magenta"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>
        <div className="flex items-center gap-3 my-4">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[10px] text-muted-foreground uppercase">Or</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-2 border border-border bg-background py-3 font-mono text-xs uppercase tracking-widest hover:border-magenta hover:text-magenta transition-colors"
        >
          <Chrome className="size-4" />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-magenta"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 w-full text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}
