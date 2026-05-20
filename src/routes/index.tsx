import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/site/Layout";
import { Reveal } from "@/components/site/Reveal";
import { supabase } from "@/integrations/supabase/client";
import { HERO_IMAGE, seedPortfolio, fmtPrice, seedFlash } from "@/lib/seed-content";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Shyftd Ink — Neon Color Realism Tattoo Artist" },
      { name: "description", content: "Custom neon color realism and pop culture surrealism tattoos. Portfolio, available flash designs, prints and stickers. Book a session at shyftdink.com." },
      { property: "og:title", content: "Shyftd Ink — Neon Color Realism Tattoo Artist" },
      { property: "og:description", content: "Custom neon color realism and pop culture surrealism tattoos." },
      { property: "og:image", content: "/og.jpg" },
      { rel: "canonical", href: "/" } as never,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TattooParlor",
          name: "Shyftd Ink",
          url: "https://shyftdink.com",
          description: "Neon color realism and pop culture surrealism tattoo studio.",
          image: HERO_IMAGE,
          priceRange: "$$$",
        }),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: featured = seedPortfolio } = useQuery({
    queryKey: ["portfolio", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("featured", true)
        .order("sort_order", { ascending: true })
        .limit(6);
      return data && data.length ? data : seedPortfolio.filter((p) => p.featured);
    },
  });

  const { data: flash = seedFlash } = useQuery({
    queryKey: ["flash", "preview"],
    queryFn: async () => {
      const { data } = await supabase.from("flash_designs").select("*").limit(4);
      return data && data.length ? data : seedFlash;
    },
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden border-b border-border">
        <div className="grid-bg absolute inset-0 opacity-40" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 0%, var(--background) 75%)" }}
        />
        <div className="relative z-10 text-center px-6">
          <p className="font-mono text-cyan tracking-[0.4em] text-xs md:text-sm mb-6 animate-fade-up">
            COLOR REALISM // NEON SURREALISM
          </p>
          <h1 className="font-display text-[18vw] md:text-[12vw] leading-[0.85] uppercase tracking-tighter animate-fade-up">
            SHYFTD<span className="text-magenta flicker px-2 md:px-4">INK</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-sm md:text-base animate-fade-up" style={{ animationDelay: "120ms" }}>
            Custom neon tattoos. Pop culture portraits, color realism, graffiti surrealism — booked from shyftdink.com.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-up" style={{ animationDelay: "240ms" }}>
            <Link to="/book" className="bg-magenta px-6 py-3 font-mono text-xs uppercase tracking-widest text-white hover:bg-cyan hover:text-background transition-colors shadow-neon-magenta">
              Book a Session
            </Link>
            <Link to="/portfolio" className="border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest hover:border-magenta hover:text-magenta transition-colors">
              View Portfolio
            </Link>
          </div>
        </div>

        <div className="hidden md:flex absolute bottom-8 inset-x-0 px-12 justify-between items-end z-10">
          <div className="font-mono text-[10px] text-muted-foreground uppercase leading-relaxed">
            [Studio: by appointment]<br />
            [Status: accepting bookings]<br />
            [Domain: shyftdink.com]
          </div>
          <img
            src={HERO_IMAGE}
            alt="Featured neon color realism tattoo by Shyftd Ink"
            width={288}
            height={384}
            fetchPriority="high"
            className="w-64 lg:w-72 aspect-[3/4] object-cover border border-border shadow-neon-magenta rotate-3 hover:rotate-0 transition-transform duration-700"
          />
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-b border-border py-4 bg-card">
        <div className="flex gap-12 animate-marquee whitespace-nowrap font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span>● Color Realism</span>
              <span className="text-magenta">● Pop Culture</span>
              <span>● Graffiti Surrealism</span>
              <span className="text-cyan">● Custom Flash</span>
              <span>● Neon Portraits</span>
              <span className="text-acid">● Cover-ups</span>
              <span>● Sleeves</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Gallery */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-baseline border-b border-border pb-4 mb-12">
            <h2 className="font-display text-4xl md:text-5xl uppercase">The Gallery</h2>
            <Link to="/portfolio" className="font-mono text-xs text-cyan hover:text-magenta transition-colors">
              VIEW_ALL →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.slice(0, 3).map((item, i) => (
              <Reveal key={item.id} delay={i * 80}>
                <Link to="/portfolio" className="group block relative overflow-hidden aspect-[4/5] bg-card border border-border">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="font-mono text-[10px] text-cyan uppercase">#{String(i + 1).padStart(3, "0")}_{item.title.replace(/\s+/g, "_").toUpperCase()}</p>
                    <p className="text-sm mt-1 text-foreground">{item.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Flash teaser */}
      <section className="py-24 px-6 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="font-display text-4xl md:text-5xl uppercase">
              <span className="text-magenta">Ready</span> To Ink
            </h2>
            <Link to="/flash" className="font-mono text-xs text-magenta hover:text-cyan transition-colors">
              ALL_FLASH →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {flash.slice(0, 4).map((f, i) => (
              <Reveal key={f.id} delay={i * 60}>
                <Link to="/flash" className="group block border border-border p-2 hover:border-magenta transition-colors">
                  <div className="aspect-square bg-background mb-3 overflow-hidden">
                    <img src={f.image_url} alt={f.title} loading="lazy" width={400} height={400} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[10px] uppercase truncate">{f.title}</span>
                    <span className={f.claimed ? "text-muted-foreground text-xs" : "text-acid text-xs"}>
                      {f.claimed ? "CLAIMED" : fmtPrice(f.price_cents)}
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-magenta/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Reveal>
            <h2 className="font-display text-6xl md:text-8xl uppercase leading-none">
              Claim Your<br /><span className="text-magenta">Canvas</span>
            </h2>
            <p className="mt-6 text-muted-foreground max-w-lg mx-auto">
              Custom concepts, available flash, or a full sleeve plan. Send your idea and we'll build it.
            </p>
            <Link
              to="/book"
              className="mt-10 inline-flex items-center gap-3 bg-magenta px-10 py-5 font-display text-xl uppercase tracking-widest text-white hover:bg-cyan hover:text-background transition-colors shadow-neon-magenta"
            >
              Book The Chair <ArrowRight className="size-5" />
            </Link>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
