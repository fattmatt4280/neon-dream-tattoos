import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-8xl text-magenta flicker">404</h1>
        <h2 className="mt-4 font-display text-2xl uppercase tracking-tight">Signal Lost</h2>
        <p className="mt-2 text-sm text-muted-foreground font-mono">
          This page is off the grid. Try a different transmission.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-magenta px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-cyan hover:text-background transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl uppercase">Connection Error</h1>
        <p className="mt-2 text-sm text-muted-foreground font-mono">Something dropped. Try again.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="bg-magenta px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-cyan hover:text-background transition-colors"
          >
            Retry
          </button>
          <a href="/" className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-secondary transition-colors">
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shyftd Ink — Neon Color Realism Tattoo Artist" },
      { name: "description", content: "Neon color realism, pop culture surrealism, and custom graffiti tattoos by Shyftd Ink. Booking now." },
      { name: "author", content: "Shyftd Ink" },
      { name: "theme-color", content: "#050505" },
      { property: "og:title", content: "Shyftd Ink — Neon Color Realism Tattoos" },
      { property: "og:description", content: "Color realism, pop culture and graffiti surrealism tattoos. Book now." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInvalidator />
      <Outlet />
      <Toaster theme="dark" position="bottom-center" />
    </QueryClientProvider>
  );
}

function AuthInvalidator() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
