import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import { SpotlightImage } from "@/components/site/SpotlightImage";
import { Lightbox } from "@/components/site/Lightbox";

import { supabase } from "@/integrations/supabase/client";
import { seedPortfolio } from "@/lib/seed-content";


export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio — Shyftd Ink Tattoo Artist" },
      { name: "description", content: "Browse the full portfolio of neon color realism and graffiti surrealism tattoos by Shyftd Ink." },
      { property: "og:title", content: "Portfolio — Shyftd Ink" },
      { property: "og:description", content: "Browse the full portfolio of neon color realism and graffiti surrealism tattoos." },
      { property: "og:url", content: "https://shyftdink.com/portfolio" },
      { rel: "canonical", href: "https://shyftdink.com/portfolio" } as never,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Portfolio — Shyftd Ink",
          description: "Full archive of neon color realism and graffiti surrealism tattoos by Shyftd Ink.",
          url: "/portfolio",
        }),
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { data = seedPortfolio, isLoading } = useQuery({
    queryKey: ["portfolio", "all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portfolio_items")
        .select("*")
        .order("sort_order", { ascending: true });
      return data && data.length ? data : seedPortfolio;
    },
  });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);



  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-4">PORTFOLIO_ARCHIVE</p>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">The Gallery</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Every piece. Color realism, neon surrealism, custom commissions. Hover to reveal details.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-card animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {data.map((item, i) => (
                <Reveal key={item.id} delay={(i % 6) * 60}>
                  <figure
                    role="button"
                    tabIndex={0}
                    aria-label={`Open full preview of ${item.title}`}
                    onClick={() => setLightboxIndex(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setLightboxIndex(i);
                      }
                    }}
                    className={`group relative overflow-hidden aspect-[4/5] bg-card border border-border cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${i % 5 === 1 ? "md:mt-12" : ""}`}
                  >
                    <SpotlightImage
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full"
                    />

                    <figcaption className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="font-mono text-[10px] text-magenta uppercase tracking-widest">#{String(i + 1).padStart(3, "0")}</p>
                      <p className="font-display text-lg uppercase mt-1">{item.title}</p>
                      {item.description && <p className="text-xs text-muted-foreground mt-1">{item.description}</p>}
                      {item.tags?.length ? (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {item.tags.map((t: string) => (
                            <span key={t} className="font-mono text-[9px] uppercase text-cyan border border-cyan/40 px-2 py-0.5">{t}</span>
                          ))}
                        </div>
                      ) : null}
                    </figcaption>
                  </figure>

                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <Lightbox
        items={data as never}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />

    </Layout>
  );
}
