import { Link } from "@tanstack/react-router";
import { Instagram, Twitter, Music2 } from "lucide-react";
import { useSiteContent } from "@/lib/site-content";

export function Footer() {
  const { c } = useSiteContent();
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-full bg-magenta shadow-neon-magenta" />
            <span className="font-display text-2xl tracking-tighter uppercase">{c("footer.brand")}</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-sm">{c("footer.blurb")}</p>
          <div className="flex gap-4 mt-6">
            <a href={c("footer.instagram_url")} target="_blank" rel="noreferrer" className="size-10 grid place-items-center border border-border hover:border-magenta hover:text-magenta transition-colors" aria-label="Instagram">
              <Instagram className="size-4" />
            </a>
            <a href={c("footer.twitter_url")} target="_blank" rel="noreferrer" className="size-10 grid place-items-center border border-border hover:border-cyan hover:text-cyan transition-colors" aria-label="Twitter">
              <Twitter className="size-4" />
            </a>
            <a href={c("footer.tiktok_url")} target="_blank" rel="noreferrer" className="size-10 grid place-items-center border border-border hover:border-acid hover:text-acid transition-colors" aria-label="TikTok">
              <Music2 className="size-4" />
            </a>
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Studio</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/portfolio" className="hover:text-magenta">Portfolio</Link></li>
            <li><Link to="/flash" className="hover:text-magenta">Available Flash</Link></li>
            <li><Link to="/merch" className="hover:text-magenta">Shop</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Contact</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/book" className="hover:text-magenta">Book a session</Link></li>
            <li><Link to="/contact" className="hover:text-magenta">Get in touch</Link></li>
            <li><Link to="/login" className="hover:text-magenta">Studio login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <p>© {new Date().getFullYear()} {c("footer.brand")} — All rights reserved</p>
          <p>{c("footer.note")}</p>
        </div>
      </div>
    </footer>
  );
}
