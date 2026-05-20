import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import { supabase } from "@/integrations/supabase/client";
import { seedFlash, fmtPrice } from "@/lib/seed-content";

export const Route = createFileRoute("/flash")({
  head: () => ({
    meta: [
      { title: "Available Flash — Shyftd Ink" },
      { name: "description", content: "Available tattoo flash designs ready to be claimed. Custom neon, pop culture, and graffiti pieces." },
      { property: "og:title", content: "Available Flash — Shyftd Ink" },
      { property: "og:description", content: "Available tattoo flash designs ready to be claimed." },
      { rel: "canonical", href: "/flash" } as never,
    ],
  }),
  component: FlashPage,
});

function FlashPage() {
  const { data = seedFlash } = useQuery({
    queryKey: ["flash", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("flash_designs").select("*").order("created_at", { ascending: false });
      return data && data.length ? data : seedFlash;
    },
  });

  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs text-magenta tracking-[0.3em] uppercase mb-4">AVAILABLE_FLASH</p>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">Ready To Ink</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            One-of-a-kind designs. Each flash is tattooed once — first claim wins.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {data.map((f, i) => (
            <Reveal key={f.id} delay={(i % 8) * 50}>
              <article className={`border border-border p-3 group transition-colors ${f.claimed ? "opacity-60" : "hover:border-magenta"}`}>
                <div className="aspect-square bg-background mb-3 overflow-hidden">
                  <img
                    src={f.image_url}
                    alt={f.title}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-mono text-xs uppercase">{f.title}</p>
                    {f.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>}
                  </div>
                  <span className={`font-mono text-xs shrink-0 ${f.claimed ? "text-muted-foreground" : "text-acid"}`}>
                    {f.claimed ? "CLAIMED" : fmtPrice(f.price_cents)}
                  </span>
                </div>
                {!f.claimed && (
                  <Link
                    to="/book"
                    search={{ flash: f.id, title: f.title }}
                    className="mt-3 block text-center border border-magenta text-magenta font-mono text-[10px] py-2 uppercase tracking-widest hover:bg-magenta hover:text-white transition-colors"
                  >
                    Claim
                  </Link>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </Layout>
  );
}
