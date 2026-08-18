import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { approveBooking, BOOKING_TYPE_LABELS, type BookingType } from "@/lib/booking.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/studio/bookings")({
  component: BookingsAdmin,
});

type Status = "pending" | "confirmed" | "declined" | "completed";

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  phone: string | null;
  concept: string;
  placement: string | null;
  body_location: string | null;
  size_estimate: string | null;
  reference_urls: string[] | null;
  status: Status;
  admin_notes: string | null;
  preferred_date: string | null;
  booking_type: BookingType | null;
  deposit_paid: boolean;
  deposit_amount_cents: number | null;
  payment_link_url: string | null;
  created_at: string;
}

const FILTERS = ["all", "pending", "confirmed", "declined", "completed"] as const;

function fmtDeposit(cents: number | null): string {
  if (cents === null) return "Custom — not set";
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}

function BookingsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["studio", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Booking[];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["studio", "bookings"] });
  }

  async function setStatus(id: string, status: Status) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    invalidate();
  }

  const visible = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase">Bookings</h1>
          <p className="font-mono text-xs text-muted-foreground">{bookings.length} total</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[10px] uppercase tracking-widest px-3 py-1.5 border ${
                filter === f ? "border-magenta text-magenta" : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">LOADING…</p>
      ) : visible.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No bookings here.</p>
      ) : (
        visible.map((b) => <BookingCard key={b.id} booking={b} onSetStatus={setStatus} onSaved={invalidate} />)
      )}
    </div>
  );
}

function BookingCard({
  booking: b,
  onSetStatus,
  onSaved,
}: {
  booking: Booking;
  onSetStatus: (id: string, s: Status) => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(b.admin_notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [savingAmount, setSavingAmount] = useState(false);
  const [approving, setApproving] = useState(false);
  const notesDirty = notes !== (b.admin_notes ?? "");

  const needsCustomAmount = b.booking_type === "multiple_days" && b.deposit_amount_cents === null;

  async function saveNotes() {
    setSavingNotes(true);
    const { error } = await supabase.from("bookings").update({ admin_notes: notes || null }).eq("id", b.id);
    setSavingNotes(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notes saved");
    onSaved();
  }

  async function saveCustomAmount() {
    const dollars = Number(customAmount);
    if (!customAmount || Number.isNaN(dollars) || dollars <= 0) {
      toast.error("Enter a valid deposit amount");
      return;
    }
    setSavingAmount(true);
    const { error } = await supabase
      .from("bookings")
      .update({ deposit_amount_cents: Math.round(dollars * 100) })
      .eq("id", b.id);
    setSavingAmount(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Deposit amount set");
    onSaved();
  }

  async function handleApprove() {
    setApproving(true);
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      setApproving(false);
      toast.error("Your session expired — sign out and back in, then try again.");
      return;
    }
    const result = await approveBooking({
      data: { bookingId: b.id, accessToken, environment: getStripeEnvironment() },
    });
    setApproving(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(result.paymentLinkUrl ? "Approved — deposit link emailed to the client" : "Approved — client notified, no payment needed");
    onSaved();
  }

  return (
    <article className="border border-border p-5 bg-card">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="font-display text-xl uppercase">{b.client_name}</p>
          <p className="font-mono text-xs text-muted-foreground">
            {b.client_email} {b.phone && `· ${b.phone}`}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground mt-1">
            Submitted {new Date(b.created_at).toLocaleDateString()}
            {b.preferred_date && ` · prefers ${b.preferred_date}`}
            {b.body_location && ` · ${b.body_location}`}
            {b.size_estimate && ` · ${b.size_estimate}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${
              b.status === "confirmed"
                ? "border-acid text-acid"
                : b.status === "declined"
                  ? "border-destructive text-destructive"
                  : b.status === "completed"
                    ? "border-cyan text-cyan"
                    : "border-magenta text-magenta"
            }`}
          >
            {b.status}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-border text-muted-foreground">
            {b.booking_type ? BOOKING_TYPE_LABELS[b.booking_type] : "—"} · {fmtDeposit(b.deposit_amount_cents)}
          </span>
          {b.deposit_paid && (
            <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-1 border border-acid text-acid">
              ✓ Deposit paid
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm whitespace-pre-wrap">{b.concept}</p>

      {b.reference_urls && b.reference_urls.length > 0 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {b.reference_urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="Reference" className="size-16 object-cover border border-border" />
            </a>
          ))}
        </div>
      )}

      {b.payment_link_url && (
        <p className="mt-3 font-mono text-[10px] text-muted-foreground break-all">
          Deposit link:{" "}
          <a href={b.payment_link_url} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline">
            {b.payment_link_url}
          </a>
        </p>
      )}

      {b.status === "pending" && (
        <div className="mt-4 border-t border-border pt-4 space-y-3">
          {needsCustomAmount && (
            <div className="flex items-end gap-2">
              <label className="block">
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Set deposit (USD)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="e.g. 350"
                  className="mt-1 w-32 bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-magenta"
                />
              </label>
              <button
                onClick={saveCustomAmount}
                disabled={savingAmount}
                className="font-mono text-[10px] uppercase border border-border px-3 py-2 hover:border-magenta hover:text-magenta disabled:opacity-50"
              >
                {savingAmount ? "Saving…" : "Save amount"}
              </button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleApprove}
              disabled={approving || needsCustomAmount}
              className="font-mono text-[10px] uppercase bg-acid text-background px-4 py-2 hover:opacity-80 disabled:opacity-40"
              title={needsCustomAmount ? "Set a deposit amount first" : undefined}
            >
              {approving ? "Approving…" : "Approve & send invoice"}
            </button>
            <button
              onClick={() => onSetStatus(b.id, "declined")}
              className="font-mono text-[10px] uppercase border border-destructive text-destructive px-4 py-2 hover:bg-destructive hover:text-white"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {b.status === "confirmed" && (
        <div className="mt-4 border-t border-border pt-4">
          <button
            onClick={() => onSetStatus(b.id, "completed")}
            className="font-mono text-[10px] uppercase border border-border px-4 py-2 hover:border-cyan hover:text-cyan"
          >
            Mark completed
          </button>
        </div>
      )}

      <div className="mt-4">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Internal notes</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Not shown to the client…"
          className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-magenta"
        />
        {notesDirty && (
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="mt-2 font-mono text-[10px] uppercase border border-magenta text-magenta px-3 py-1.5 hover:bg-magenta hover:text-white disabled:opacity-50"
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </button>
        )}
      </div>
    </article>
  );
}
