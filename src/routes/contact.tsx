import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Instagram, Twitter, Music2, Mail } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Shyftd Ink" },
      { name: "description", content: "Get in touch with Shyftd Ink for bookings, collaborations, or merch inquiries." },
      { property: "og:title", content: "Contact — Shyftd Ink" },
      { property: "og:description", content: "Get in touch with Shyftd Ink." },
      { property: "og:url", content: "/contact" },
      { rel: "canonical", href: "/contact" } as never,
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://shyftdink.com/#studio",
          name: "Shyftd Ink",
          description: "Neon color realism and pop culture graffiti surrealism tattoo studio. By appointment only.",
          url: "https://shyftdink.com/contact",
          email: "studio@shyftdink.com",
          priceRange: "$$$",
          openingHoursSpecification: [
            {
              "@type": "OpeningHoursSpecification",
              dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              opens: "12:00",
              closes: "23:00",
            },
          ],
          sameAs: [
            "https://instagram.com",
            "https://tiktok.com",
            "https://twitter.com",
          ],
        }),
      },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { c } = useSiteContent();
  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-4">{c("contact.eyebrow")}</p>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">{c("contact.title")}</h1>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl uppercase mb-6">Direct</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3"><Mail className="size-4 text-magenta" /> <a href={`mailto:${c("contact.email")}`} className="hover:text-magenta">{c("contact.email")}</a></li>
              <li className="flex items-center gap-3"><Instagram className="size-4 text-magenta" /> <a href={c("contact.instagram_url")} target="_blank" rel="noreferrer" className="hover:text-magenta">{c("contact.instagram_handle")}</a></li>
              <li className="flex items-center gap-3"><Music2 className="size-4 text-magenta" /> <a href={c("contact.tiktok_url")} target="_blank" rel="noreferrer" className="hover:text-magenta">{c("contact.tiktok_handle")}</a></li>
              <li className="flex items-center gap-3"><Twitter className="size-4 text-magenta" /> <a href={c("contact.twitter_url")} target="_blank" rel="noreferrer" className="hover:text-magenta">{c("contact.twitter_handle")}</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl uppercase mb-6">Studio</h2>
            <p className="text-muted-foreground">{c("contact.studio_body")}</p>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-widest leading-relaxed whitespace-pre-line">
              {c("contact.hours")}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
