import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { User, LogOut, ChevronDown } from "lucide-react";
import { toast } from "sonner";

export function AccountMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    localStorage.removeItem("shyftd:last_active");
    toast.success("Signed out");
    setOpen(false);
  }

  if (!email) {
    return (
      <Link
        to="/login"
        className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-magenta flex items-center gap-1"
      >
        <User className="size-3" /> Sign In
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-foreground hover:text-magenta"
      >
        <span className="size-6 rounded-full bg-magenta/20 border border-magenta flex items-center justify-center">
          <User className="size-3 text-magenta" />
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate">{email}</span>
        <ChevronDown className="size-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 border border-border bg-card shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Signed in as</p>
            <p className="text-xs truncate">{email}</p>
          </div>
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs font-mono uppercase tracking-widest hover:bg-secondary"
          >
            Admin
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-xs font-mono uppercase tracking-widest text-magenta hover:bg-secondary flex items-center gap-2"
          >
            <LogOut className="size-3" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
