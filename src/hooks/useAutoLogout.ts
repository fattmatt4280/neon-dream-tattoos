import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Keep the user signed in for the duration of their active session plus a
// 5-minute grace window after their last activity. After 5 minutes of
// inactivity (or 5 min after the tab was last seen), sign them out.
const GRACE_MS = 5 * 60 * 1000;
const KEY = "shyftd:last_active";

export function useAutoLogout() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let signedIn = false;

    const markActive = () => {
      if (signedIn) localStorage.setItem(KEY, String(Date.now()));
    };

    const checkExpiry = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        signedIn = false;
        localStorage.removeItem(KEY);
        return;
      }
      signedIn = true;
      const raw = localStorage.getItem(KEY);
      const last = raw ? Number(raw) : Date.now();
      if (Date.now() - last > GRACE_MS) {
        localStorage.removeItem(KEY);
        await supabase.auth.signOut();
      } else {
        markActive();
      }
    };

    checkExpiry();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      signedIn = !!session;
      if (session) markActive();
      else localStorage.removeItem(KEY);
    });

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "visibilitychange"];
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }));

    const interval = window.setInterval(checkExpiry, 30_000);

    return () => {
      sub.subscription.unsubscribe();
      events.forEach((ev) => window.removeEventListener(ev, markActive));
      window.clearInterval(interval);
    };
  }, []);
}
