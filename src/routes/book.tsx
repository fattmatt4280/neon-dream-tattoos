import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({
    flash: typeof s.flash === "string" ? s.flash : undefined,
    title: typeof s.title === "string" ? s.title : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a Session — Shyftd Ink" },
      { name: "description", content: "Submit a booking request for a custom tattoo with Shyftd Ink. Color realism, neon surrealism, and pop culture pieces." },
      { property: "og:title", content: "Book a Session — Shyftd Ink" },
      { property: "og:description", content: "Submit a booking request for a custom tattoo with Shyftd Ink." },
      { rel: "canonical", href: "/book" } as never,
    ],
  }),
  component: BookPage,
});

const schema = z.object({
  client_name: z.string().min(2, "Name is required").max(120),
  client_email: z.string().email("Valid email required").max(255),
  phone: z.string().max(40).optional().or(z.literal("")),
  concept: z.string().min(10, "Tell me a bit more").max(2000),
  size_estimate: z.string().max(120).optional().or(z.literal("")),
  placement: z.string().max(120).optional().or(z.literal("")),
  preferred_date: z.string().optional().or(z.literal("")),
});

function BookPage() {
  const { flash, title } = Route.useSearch();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user?.id ?? null,
      client_name: parsed.data.client_name,
      client_email: parsed.data.client_email,
      phone: parsed.data.phone || null,
      concept: flash ? `[Flash claim: ${title ?? flash}] ${parsed.data.concept}` : parsed.data.concept,
      size_estimate: parsed.data.size_estimate || null,
      placement: parsed.data.placement || null,
      preferred_date: parsed.data.preferred_date || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not submit. Try again.");
      console.error(error);
      return;
    }
    setDone(true);
    toast.success("Request received. I'll reply within 48h.");
  }

  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-magenta tracking-[0.3em] uppercase mb-4">BOOKING_REQUEST</p>
          <h1 className="font-display text-6xl md:text-7xl uppercase leading-none">Book The Chair</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Tell me what you want. I'll review every request personally and reply within 48 hours.
          </p>
          {flash && (
            <div className="mt-6 p-4 border border-magenta bg-magenta/10 font-mono text-xs uppercase tracking-widest text-magenta">
              ● Claiming flash: {title ?? flash}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {done ? (
            <div className="border border-acid p-12 text-center">
              <p className="font-display text-4xl uppercase text-acid">Transmission Received</p>
              <p className="mt-4 text-muted-foreground">I'll reach out at the email you provided. Stay tuned.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <Field name="client_name" label="Full name" required defaultValue="" />
              <div className="grid md:grid-cols-2 gap-6">
                <Field name="client_email" label="Email" type="email" required defaultValue={user?.email ?? ""} />
                <Field name="phone" label="Phone (optional)" type="tel" />
              </div>
              <TextareaField name="concept" label="Concept / description" required rows={5} placeholder="Describe what you want, references, style..." />
              <div className="grid md:grid-cols-3 gap-6">
                <Field name="size_estimate" label="Size estimate" placeholder='e.g. "8x10 inches"' />
                <Field name="placement" label="Placement" placeholder='e.g. "Right forearm"' />
                <Field name="preferred_date" label="Preferred date" type="date" />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full bg-magenta text-white py-4 font-display text-xl uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors shadow-neon-magenta disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send Request"}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
}

function Field({ name, label, required, ...rest }: { name: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}{required && <span className="text-magenta"> *</span>}
      </span>
      <input
        name={name}
        required={required}
        {...rest}
        className="mt-2 w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-magenta transition-colors"
      />
    </label>
  );
}

function TextareaField({ name, label, required, rows = 4, placeholder }: { name: string; label: string; required?: boolean; rows?: number; placeholder?: string }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}{required && <span className="text-magenta"> *</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        placeholder={placeholder}
        className="mt-2 w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-magenta transition-colors resize-y"
      />
    </label>
  );
}
