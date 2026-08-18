import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { submitBookingRequest, BOOKING_TYPES, type BookingType } from "@/lib/booking.functions";

export const Route = createFileRoute("/book")({
  validateSearch: (s: Record<string, unknown>) => ({
    flash: typeof s.flash === "string" ? s.flash : undefined,
    title: typeof s.title === "string" ? s.title : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a Session — Shyftd Ink" },
      { name: "description", content: "Request your tattoo session. I review every booking personally before sending a deposit link." },
      { property: "og:title", content: "Book a Session — Shyftd Ink" },
      { property: "og:description", content: "Request your tattoo session. I review every booking personally before sending a deposit link." },
    ],
  }),
  component: BookPage,
});

const BOOKING_TYPE_OPTIONS: { value: BookingType; label: string }[] = [
  { value: "smaller_tattoo", label: "Smaller tattoo — $50 deposit" },
  { value: "half_day", label: "Half day — $100 deposit" },
  { value: "whole_day", label: "Whole day — $200 deposit" },
  { value: "multiple_days", label: "Multiple days — custom deposit (quoted after review)" },
  { value: "consultation", label: "Consultation — free" },
];

const schema = z.object({
  client_name: z.string().min(2, "Name is required").max(120),
  client_email: z.string().email("Valid email required").max(255),
  phone: z.string().max(40).optional().or(z.literal("")),
  concept: z.string().min(10, "Tell me a bit more").max(4000),
  size_estimate: z.string().max(120).optional().or(z.literal("")),
  placement: z.string().max(120).optional().or(z.literal("")),
  body_location: z.string().max(120).optional().or(z.literal("")),
  booking_type: z.enum(BOOKING_TYPES, { message: "Pick a booking type" }),
  preferred_date: z.string().optional().or(z.literal("")),
});

function BookPage() {
  const { flash, title } = Route.useSearch();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const result = await submitBookingRequest({
      data: {
        booking: {
          client_name: parsed.data.client_name,
          client_email: parsed.data.client_email,
          phone: parsed.data.phone || null,
          concept: flash ? `[Flash claim: ${title ?? flash}] ${parsed.data.concept}` : parsed.data.concept,
          size_estimate: parsed.data.size_estimate || null,
          placement: parsed.data.placement || null,
          body_location: parsed.data.body_location || null,
          booking_type: parsed.data.booking_type,
          preferred_date: parsed.data.preferred_date || null,
          user_id: user?.id ?? null,
        },
      },
    });
    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSubmitted(true);
  }

  return (
    <Layout>
      <PaymentTestModeBanner />
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-magenta tracking-[0.3em] uppercase mb-4">
            BOOKING_REQUEST
          </p>
          <h1 className="font-display text-6xl md:text-7xl uppercase leading-none">Book The Chair</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Tell me what you want and pick a booking type below. I review every request personally —
            once approved, I'll send you a link to lock in your session with a{" "}
            <span className="text-acid font-mono">non-refundable deposit</span> that applies to
            your final total.
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
          {submitted ? (
            <div className="text-center border border-acid p-12">
              <p className="font-mono text-xs text-acid tracking-[0.3em] uppercase mb-4">REQUEST_SENT</p>
              <h2 className="font-display text-4xl uppercase leading-none text-acid">Got It</h2>
              <p className="mt-6 text-muted-foreground max-w-lg mx-auto">
                I'll review your request and follow up within 48 hours. If it's a go, you'll get an
                email with a link to lock in your session.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              <p className="font-mono text-xs text-cyan tracking-[0.3em] uppercase">
                STEP_01 / DETAILS
              </p>
              <Field name="client_name" label="Full name" required />
              <div className="grid md:grid-cols-2 gap-6">
                <Field
                  name="client_email"
                  label="Email"
                  type="email"
                  required
                  defaultValue={user?.email ?? ""}
                />
                <Field name="phone" label="Phone (optional)" type="tel" />
              </div>
              <TextareaField
                name="concept"
                label="Concept / description"
                required
                rows={5}
                placeholder="Describe what you want, references, style..."
              />
              <div className="grid md:grid-cols-3 gap-6">
                <Field name="size_estimate" label="Size estimate" placeholder='e.g. "8x10 inches"' />
                <Field name="body_location" label="Body location" placeholder='e.g. "Right forearm"' />
                <SelectField name="booking_type" label="Booking type" required options={BOOKING_TYPE_OPTIONS} />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Field name="placement" label="Placement notes" placeholder="Wrap, sleeve, standalone..." />
                <Field name="preferred_date" label="Preferred date" type="date" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-magenta text-white py-4 font-display text-xl uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors shadow-neon-magenta disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Submit Request →"}
              </button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  );
}

function Field({
  name,
  label,
  required,
  ...rest
}: { name: string; label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
        {required && <span className="text-magenta"> *</span>}
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

function SelectField({
  name,
  label,
  required,
  options,
}: {
  name: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
        {required && <span className="text-magenta"> *</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="mt-2 w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-magenta transition-colors"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  name,
  label,
  required,
  rows = 4,
  placeholder,
}: {
  name: string;
  label: string;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
        {required && <span className="text-magenta"> *</span>}
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
