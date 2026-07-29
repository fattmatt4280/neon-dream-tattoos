import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";

export const Route = createFileRoute("/book/cancel")({
  head: () => ({
    meta: [
      { title: "Checkout Canceled — Shyftd Ink" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <Layout>
      <section className="px-6 py-24">
        <div className="max-w-2xl mx-auto text-center border border-border p-12">
          <h1 className="font-display text-5xl uppercase">Checkout Canceled</h1>
          <p className="mt-4 text-muted-foreground">
            Your booking draft was saved but the deposit wasn't charged. Come back when you're ready.
          </p>
          <Link
            to="/book"
            className="mt-8 inline-block bg-magenta text-white px-8 py-4 font-display text-lg uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors"
          >
            Try Again
          </Link>
        </div>
      </section>
    </Layout>
  );
}
