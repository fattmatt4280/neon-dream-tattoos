import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";

export const Route = createFileRoute("/book/success")({
  validateSearch: (s: Record<string, unknown>) => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Deposit Received — Shyftd Ink" },
      { name: "description", content: "Your tattoo deposit has been received. I'll be in touch to lock in your session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SuccessPage,
});

function SuccessPage() {
  return (
    <Layout>
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center border border-acid p-12">
          <p className="font-mono text-xs text-acid tracking-[0.3em] uppercase mb-4">DEPOSIT_CONFIRMED</p>
          <h1 className="font-display text-5xl md:text-6xl uppercase leading-none text-acid">
            You're On The Books
          </h1>
          <p className="mt-6 text-muted-foreground">
            Your deposit came through. I'll review your concept and reach out within 48 hours
            to lock in the date and details.
          </p>
          <Link
            to="/"
            className="mt-8 inline-block bg-magenta text-white px-8 py-4 font-display text-lg uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </Layout>
  );
}
