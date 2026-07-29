import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HERO_IMAGE } from "@/lib/seed-content";

export type FieldType = "text" | "textarea" | "image" | "link";

export type ContentField = {
  key: string;
  label: string;
  type: FieldType;
  value: string;
};

export type ContentGroup = {
  id: string;
  label: string;
  fields: ContentField[];
};

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "nav",
    label: "Navigation",
    fields: [
      { key: "nav.brand", label: "Brand wordmark", type: "text", value: "Shyftd" },
      { key: "nav.status", label: "Status pill", type: "text", value: "● Online" },
      { key: "nav.cta_label", label: "Nav button label", type: "text", value: "Book_Session" },
      { key: "nav.cta_href", label: "Nav button link", type: "link", value: "/book" },
    ],
  },
  {
    id: "home_hero",
    label: "Home — Hero",
    fields: [
      { key: "home.hero_eyebrow", label: "Eyebrow line", type: "text", value: "COLOR REALISM // NEON SURREALISM" },
      { key: "home.hero_title", label: "Headline", type: "text", value: "SHYFTD" },
      { key: "home.hero_title_accent", label: "Headline accent", type: "text", value: "INK" },
      {
        key: "home.hero_subtitle",
        label: "Subtitle",
        type: "textarea",
        value: "Custom neon tattoos. Pop culture portraits, color realism, graffiti surrealism — booked from shyftdink.com.",
      },
      { key: "home.hero_cta1_label", label: "Primary button label", type: "text", value: "Book a Session" },
      { key: "home.hero_cta1_href", label: "Primary button link", type: "link", value: "/book" },
      { key: "home.hero_cta2_label", label: "Secondary button label", type: "text", value: "View Portfolio" },
      { key: "home.hero_cta2_href", label: "Secondary button link", type: "link", value: "/portfolio" },
      { key: "home.hero_image", label: "Hero image", type: "image", value: HERO_IMAGE },
      {
        key: "home.hero_status",
        label: "Status block (one line each)",
        type: "textarea",
        value: "[Studio: by appointment]\n[Status: accepting bookings]\n[Domain: shyftdink.com]",
      },
      {
        key: "home.marquee",
        label: "Scrolling marquee (comma separated)",
        type: "textarea",
        value: "Color Realism, Pop Culture, Graffiti Surrealism, Custom Flash, Neon Portraits, Cover-ups, Sleeves",
      },
    ],
  },
  {
    id: "home_sections",
    label: "Home — Sections",
    fields: [
      { key: "home.gallery_heading", label: "Gallery heading", type: "text", value: "The Gallery" },
      { key: "home.gallery_link_label", label: "Gallery link label", type: "text", value: "VIEW_ALL →" },
      { key: "home.flash_heading", label: "Flash heading (accent)", type: "text", value: "Ready" },
      { key: "home.flash_heading_rest", label: "Flash heading (rest)", type: "text", value: "To Ink" },
      { key: "home.flash_link_label", label: "Flash link label", type: "text", value: "ALL_FLASH →" },
      { key: "home.cta_heading1", label: "CTA heading line 1", type: "text", value: "Claim Your" },
      { key: "home.cta_heading2", label: "CTA heading line 2 (accent)", type: "text", value: "Canvas" },
      {
        key: "home.cta_body",
        label: "CTA body",
        type: "textarea",
        value: "Custom concepts, available flash, or a full sleeve plan. Send your idea and we'll build it.",
      },
      { key: "home.cta_button_label", label: "CTA button label", type: "text", value: "Book The Chair" },
      { key: "home.cta_button_href", label: "CTA button link", type: "link", value: "/book" },
    ],
  },
  {
    id: "contact",
    label: "Contact page",
    fields: [
      { key: "contact.eyebrow", label: "Eyebrow", type: "text", value: "SIGNAL_OUT" },
      { key: "contact.title", label: "Title", type: "text", value: "Contact" },
      { key: "contact.email", label: "Email address", type: "text", value: "studio@shyftdink.com" },
      { key: "contact.instagram_handle", label: "Instagram handle", type: "text", value: "@shyftdink" },
      { key: "contact.instagram_url", label: "Instagram link", type: "link", value: "https://instagram.com" },
      { key: "contact.tiktok_handle", label: "TikTok handle", type: "text", value: "@shyftdink" },
      { key: "contact.tiktok_url", label: "TikTok link", type: "link", value: "https://tiktok.com" },
      { key: "contact.twitter_handle", label: "X / Twitter handle", type: "text", value: "@shyftdink" },
      { key: "contact.twitter_url", label: "X / Twitter link", type: "link", value: "https://twitter.com" },
      {
        key: "contact.studio_body",
        label: "Studio blurb",
        type: "textarea",
        value: "By appointment only. Submit a booking request and I'll send the address with your confirmation.",
      },
      {
        key: "contact.hours",
        label: "Hours block",
        type: "textarea",
        value: "Hours: Tue–Sat / 12pm – Late\nResponse time: within 48h",
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    fields: [
      { key: "footer.brand", label: "Brand", type: "text", value: "Shyftd Ink" },
      {
        key: "footer.blurb",
        label: "Blurb",
        type: "textarea",
        value: "Color realism. Pop culture surrealism. Neon-soaked custom tattoos by appointment.",
      },
      { key: "footer.instagram_url", label: "Instagram link", type: "link", value: "https://instagram.com" },
      { key: "footer.twitter_url", label: "X / Twitter link", type: "link", value: "https://twitter.com" },
      { key: "footer.tiktok_url", label: "TikTok link", type: "link", value: "https://tiktok.com" },
      { key: "footer.note", label: "Bottom-right note", type: "text", value: "shyftdink.com" },
    ],
  },
];

export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.value])),
);

export const ALL_CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap((g) => g.fields);

export function useSiteContent() {
  const { data } = useQuery({
    queryKey: ["site_content"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("key, value");
      if (error) throw error;
      return data ?? [];
    },
  });

  const overrides: Record<string, string> = {};
  for (const row of data ?? []) {
    if (row.value !== null && row.value !== "") overrides[row.key] = row.value;
  }

  const c = (key: string) => overrides[key] ?? CONTENT_DEFAULTS[key] ?? "";
  return { c, overrides };
}
