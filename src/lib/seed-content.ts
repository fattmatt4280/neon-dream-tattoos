// Fallback content shown when the database is empty so the site looks complete out of the box.
import hero from "@/assets/hero-featured.jpg";
import p1 from "@/assets/portfolio-1.jpg";
import p2 from "@/assets/portfolio-2.jpg";
import p3 from "@/assets/portfolio-3.jpg";
import f1 from "@/assets/flash-1.jpg";
import f2 from "@/assets/flash-2.jpg";
import f3 from "@/assets/flash-3.jpg";
import f4 from "@/assets/flash-4.jpg";
import mPrint from "@/assets/merch-print.jpg";
import mStickers from "@/assets/merch-stickers.jpg";

export const HERO_IMAGE = hero;

export type SeedPortfolio = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  tags: string[];
  featured: boolean;
};
export type SeedFlash = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_cents: number;
  claimed: boolean;
};
export type SeedMerch = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_cents: number;
  product_type: "print" | "sticker" | "apparel" | "other";
  stock: number;
  active: boolean;
};

export const seedPortfolio: SeedPortfolio[] = [
  { id: "s1", title: "Virtual Smile", description: "Color realism portrait. Magenta + cyan halo, 6h session.", image_url: p1, tags: ["color realism", "portrait"], featured: true },
  { id: "s2", title: "Void Walker", description: "Neon graffiti flamingo on a brick-textured backdrop.", image_url: p2, tags: ["graffiti", "neon"], featured: true },
  { id: "s3", title: "Neon Iris", description: "Macro realism eye with neon reflections.", image_url: p3, tags: ["realism", "macro"], featured: false },
];

export const seedFlash: SeedFlash[] = [
  { id: "f1", title: "Cyber Sigil", description: "Geometric ward, acid green glow.", image_url: f1, price_cents: 25000, claimed: false },
  { id: "f2", title: "Acid Drop", description: "Melting smiley, neon pink.", image_url: f2, price_cents: 18000, claimed: false },
  { id: "f3", title: "Core Link", description: "Cybernetic heart, blue circuitry.", image_url: f3, price_cents: 32000, claimed: false },
  { id: "f4", title: "Script Death", description: "Gothic skull, blackwork.", image_url: f4, price_cents: 28000, claimed: true },
];

export const seedMerch: SeedMerch[] = [
  { id: "m1", title: "Reliquary — A3 Print", description: "Limited 12x18 archival print, signed.", image_url: mPrint, price_cents: 4500, product_type: "print", stock: 25, active: true },
  { id: "m2", title: "Sticker Pack — 10pc", description: "Holographic vinyl, mixed flash designs.", image_url: mStickers, price_cents: 1500, product_type: "sticker", stock: 100, active: true },
];

export function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}
