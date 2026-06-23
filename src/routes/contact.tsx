import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { Instagram, Twitter, Music2, Mail } from "lucide-react";

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
  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase mb-4">SIGNAL_OUT</p>
          <h1 className="font-display text-6xl md:text-8xl uppercase leading-none">Contact</h1>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-2xl uppercase mb-6">Direct</h2>
            <ul className="space-y-4">
              <li className="flex items-center gap-3"><Mail className="size-4 text-magenta" /> <a href="mailto:studio@shyftdink.com" className="hover:text-magenta">studio@shyftdink.com</a></li>
              <li className="flex items-center gap-3"><Instagram className="size-4 text-magenta" /> <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-magenta">@shyftdink</a></li>
              <li className="flex items-center gap-3"><Music2 className="size-4 text-magenta" /> <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-magenta">@shyftdink</a></li>
              <li className="flex items-center gap-3"><Twitter className="size-4 text-magenta" /> <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-magenta">@shyftdink</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-2xl uppercase mb-6">Studio</h2>
            <p className="text-muted-foreground">
              By appointment only. Submit a booking request and I'll send the address with your confirmation.
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground uppercase tracking-widest leading-relaxed">
              Hours: Tue–Sat / 12pm – Late<br />
              Response time: within 48h
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
