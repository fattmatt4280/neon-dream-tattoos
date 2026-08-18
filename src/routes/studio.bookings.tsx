import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  session_length: string | null;
  size_estimate: string | null;
  reference_urls: string[] | null;
  status: Status;
  admin_notes: string | null;
  preferred_date: string | null;
  deposit_paid: boolean;
  deposit_amount_cents: number | null;
  created_at: string;
}

const STATUSES: Status[] = ["pending", "confirmed", "declined", "completed"];
const FILTERS = ["all", ...STATUSES] as const;

function BookingsAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");

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

  async function updateStatus(id: string, status: Status) {
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
        visible.map((b) => <BookingCard key={b.id} booking={b} onStatus={updateStatus} onSaved={invalidate} />)
      )}
    </div>
  );
}

function BookingCard({ booking: b, onStatus, onSaved }: { booking: Booking; onStatus: (id: string, s: Status) => void; onSaved: () => void }) {
  const [notes, setNotes] = useState(b.admin_notes ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = notes !== (b.admin_notes ?? "");

  async function saveNotes() {
    setSaving(true);
    const { error } = await supabase.from("bookings").update({ admin_notes: notes || null }).eq("id", b.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notes saved");
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
            {(b.body_location || b.placement) && ` · ${b.body_location || b.placement}`}
            {(b.session_length || b.size_estimate) && ` · ${b.session_length || b.size_estimate}`}
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
          <span
            className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 border ${
              b.deposit_paid ? "border-acid text-acid" : "border-border text-muted-foreground"
            }`}
          >
            {b.deposit_paid ? `✓ Deposit $${((b.deposit_amount_cents ?? 0) / 100).toFixed(0)}` : "No deposit"}
          </span>
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

      <div className="mt-4 flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatus(b.id, s)}
            className={`font-mono text-[10px] uppercase border px-3 py-1 ${
              b.status === s ? "border-magenta text-magenta" : "border-border hover:border-magenta hover:text-magenta"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Internal notes</span>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Not shown to the client…"
          className="mt-1 w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-magenta"
        />
        {dirty && (
          <button
            onClick={saveNotes}
            disabled={saving}
            className="mt-2 font-mono text-[10px] uppercase border border-magenta text-magenta px-3 py-1.5 hover:bg-magenta hover:text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        )}
      </div>
    </article>
  );
}
