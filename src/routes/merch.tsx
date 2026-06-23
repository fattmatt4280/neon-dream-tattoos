import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import { supabase } from "@/integrations/supabase/client";
import { seedMerch, fmtPrice } from "@/lib/seed-content";
import { toast } from "sonner";

export const Route = createFileRoute("/merch")({
  head: () => ({
    meta: [
      { title: "Shop — Prints, Stickers & Merch by Shyftd Ink" },
      { name: "description", content: "Limited prints, holographic stickers, and original artwork from Shyftd Ink." },
      { property: "og:title", content: "Shop — Shyftd Ink" },
      { property: "og:description", content: "Limited prints, holographic stickers, and original artwork." },
      { property: "og:url", content: "/merch" },
      { rel: "canonical", href: "/merch" } as never,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Shop — Shyftd Ink",
          description: "Limited prints, holographic stickers, and original artwork from Shyftd Ink.",
          url: "/merch",
        }),
      },
    ],
  }),
  component: MerchPage,
});

function MerchPage() {
  const { data = seedMerch } = useQuery({
    queryKey: ["merch"],
    queryFn: async () => {
      const { data } = await supabase
        .from("merch_products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      return data && data.length ? data : seedMerch;
    },
  });

  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs text-acid tracking-[0.3em] uppercase mb-4">STREETWEAR_DROP</p>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">The Shop</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Wear the work. Limited prints and holographic vinyl. Restocks announced on social.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item, i) => (
            <Reveal key={item.id} delay={(i % 6) * 60}>
              <article className="group border border-border bg-card hover:border-magenta transition-colors">
                <div className="aspect-square overflow-hidden bg-background">
                  <img src={item.image_url} alt={item.title} loading="lazy" width={600} height={600} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{item.product_type}</p>
                      <h2 className="font-display text-xl uppercase mt-1">{item.title}</h2>
                    </div>
                    <span className="font-mono text-acid">{fmtPrice(item.price_cents)}</span>
                  </div>
                  {item.description && <p className="text-sm text-muted-foreground mt-3">{item.description}</p>}
                  <button
                    onClick={() =>
                      toast("Checkout coming soon", {
                        description: "Stripe checkout is being wired up. Email orders@shyftdink.com to claim now.",
                      })
                    }
                    disabled={item.stock <= 0}
                    className="mt-5 w-full bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {item.stock <= 0 ? "Sold Out" : "Add to Cart"}
                  </button>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </Layout>
  );
}
