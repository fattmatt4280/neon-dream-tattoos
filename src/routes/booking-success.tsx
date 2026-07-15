import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/site/Layout";

export const Route = createFileRoute("/booking-success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [{ title: "Booking Confirmed — Shyftd Ink" }, { name: "robots", content: "noindex" }],
  }),
  component: BookingSuccessPage,
});

function BookingSuccessPage() {
  const { session_id } = Route.useSearch();
  const nav = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!session_id) {
      nav({ to: "/" });
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          nav({ to: "/" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [session_id, nav]);

  if (!session_id) return null;

  return (
    <Layout>
      <section className="min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl w-full border border-acid p-8 md:p-12 text-center space-y-6">
          <p className="font-mono text-xs text-acid tracking-[0.3em] uppercase">
            Transmission Received
          </p>
          <h1 className="font-display text-4xl md:text-5xl uppercase text-acid">
            Payment Successful
          </h1>
          <div className="space-y-4 text-muted-foreground">
            <p className="text-lg">
              Your deposit has been received and your consultation is confirmed.
            </p>
            <p>I'll reach out at the email you provided within 48 hours with next steps.</p>
            <p className="text-sm">
              Session ID: <span className="font-mono text-xs">{session_id}</span>
            </p>
          </div>
          <div className="pt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting to homepage in {countdown} seconds…
            </p>
            <button
              onClick={() => nav({ to: "/" })}
              className="bg-magenta text-white px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
