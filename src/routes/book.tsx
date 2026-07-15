import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/site/Layout";
import { DreamBookingWidget } from "@/components/site/DreamBookingWidget";
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
      {
        name: "description",
        content:
          "Submit a booking request for a custom tattoo with Shyftd Ink. Color realism, neon surrealism, and pop culture pieces.",
      },
      { property: "og:title", content: "Book a Session — Shyftd Ink" },
      {
        property: "og:description",
        content: "Submit a booking request for a custom tattoo with Shyftd Ink.",
      },
      { rel: "canonical", href: "/book" } as never,
    ],
  }),
  component: BookPage,
});

const BODY_LOCATIONS = [
  ["arm-upper-left", "ARM — Upper Left"],
  ["arm-upper-right", "ARM — Upper Right"],
  ["arm-lower-left", "ARM — Lower Left"],
  ["arm-lower-right", "ARM — Lower Right"],
  ["leg-upper-left", "LEG — Upper Left"],
  ["leg-upper-right", "LEG — Upper Right"],
  ["leg-lower-left", "LEG — Lower Left"],
  ["leg-lower-right", "LEG — Lower Right"],
  ["chest-left", "CHEST — Left"],
  ["chest-right", "CHEST — Right"],
  ["chest-ribs", "CHEST — Ribs"],
  ["rib-left", "RIB — Left"],
  ["rib-right", "RIB — Right"],
  ["back-left", "BACK — Left"],
  ["back-right", "BACK — Right"],
  ["back-whole", "BACK — Whole Back"],
  ["neck-left", "NECK — Left"],
  ["neck-right", "NECK — Right"],
  ["neck-throat", "NECK — Throat"],
  ["head-full", "HEAD — Full Head"],
  ["head-face", "HEAD — Face"],
] as const;

const schema = z.object({
  client_name: z.string().min(2, "Name is required").max(120),
  client_email: z.string().email("Valid email required").max(255),
  phone: z.string().max(40).optional().or(z.literal("")),
  concept: z.string().min(10, "Tell me a bit more").max(2000),
  body_location: z.string().min(1, "Pick a body location"),
  session_length: z.string().min(1),
});

type Tab = "ai" | "manual";

function BookPage() {
  const { flash, title } = Route.useSearch();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("manual");
  const [busy, setBusy] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  async function onSubmit(
    e: React.FormEvent<HTMLFormElement>,
    consultType: "AI Consult" | "Manual Consult",
  ) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          name: parsed.data.client_name,
          email: parsed.data.client_email,
          phone: parsed.data.phone || "",
          message: parsed.data.concept,
          bodyLocation: parsed.data.body_location,
          sessionLength: parsed.data.session_length,
          consultType,
          flashId: flash || "",
          flashTitle: title || "",
        },
      });

      if (error) throw error;

      if (data?.url) {
        const opened = window.open(data.url, "_blank");
        if (opened) {
          toast.success("Opening payment page…", {
            description: "If it doesn't open, click here",
            action: { label: "Open Payment", onClick: () => window.open(data.url, "_blank") },
          });
        } else {
          toast.error("Popup blocked", {
            description: "Click below to complete payment",
            action: { label: "Open Payment", onClick: () => window.open(data.url, "_blank") },
          });
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast.error("Could not start checkout. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs text-magenta tracking-[0.3em] uppercase mb-4">
            BOOKING_REQUEST
          </p>
          <h1 className="font-display text-6xl md:text-7xl uppercase leading-none">
            Book The Chair
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Tell me what you want. A deposit confirms your slot for review — I reply within 48
            hours.
          </p>
          {flash && (
            <div className="mt-6 p-4 border border-magenta bg-magenta/10 font-mono text-xs uppercase tracking-widest text-magenta">
              ● Claiming flash: {title ?? flash}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="flex justify-center">
            <DreamBookingWidget
              artistId="shyftd-ink"
              accentColor="#ff00ff"
              ctaLabel="Quick AI Consult"
            />
          </div>

          <div className="border border-border">
            <div className="flex border-b border-border">
              {(["manual", "ai"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-6 py-4 font-mono text-xs uppercase tracking-widest border-b-2 flex-1 ${
                    tab === t
                      ? "border-magenta text-magenta"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "manual" ? "Manual Consult" : "AI Consult"}
                </button>
              ))}
            </div>

            <div className="p-6 md:p-10">
              <form
                onSubmit={(e) => onSubmit(e, tab === "ai" ? "AI Consult" : "Manual Consult")}
                className="space-y-6"
              >
                <Field name="client_name" label="Full name" required defaultValue="" />
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
                <div className="grid md:grid-cols-2 gap-6">
                  <SelectField name="body_location" label="Body location" required>
                    <option value="">Select body placement</option>
                    {BODY_LOCATIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    name="session_length"
                    label="Session length"
                    required
                    defaultValue="half-day"
                  >
                    <option value="half-day">Half Day / Under 4hrs — $100 deposit</option>
                    <option value="full-day">Full Day — $200 deposit</option>
                  </SelectField>
                </div>
                <TextareaField
                  name="concept"
                  label="Concept / description"
                  required
                  rows={5}
                  placeholder="Describe what you want, references, style..."
                />
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Reference photos (optional)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="mt-2 w-full bg-card border border-border px-4 py-3 text-sm file:mr-4 file:border-0 file:bg-magenta file:text-white file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:uppercase"
                  />
                  {selectedFiles && selectedFiles.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-magenta text-white py-4 font-display text-xl uppercase tracking-widest hover:bg-cyan hover:text-background transition-colors shadow-neon-magenta disabled:opacity-50"
                >
                  {busy ? "Sending…" : "Pay Deposit & Book Consultation"}
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Secure deposit payment required to confirm your consultation
                </p>
              </form>
            </div>
          </div>
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
}: {
  name: string;
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
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

function SelectField({
  name,
  label,
  required,
  defaultValue,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  children: React.ReactNode;
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
        defaultValue={defaultValue}
        className="mt-2 w-full bg-card border border-border px-4 py-3 focus:outline-none focus:border-magenta transition-colors"
      >
        {children}
      </select>
    </label>
  );
}
