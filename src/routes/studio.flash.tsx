import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/studio/ImageUpload";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/studio/flash")({
  component: FlashAdmin,
});

interface Item {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  price_cents: number;
  claimed: boolean;
}

type Draft = { title: string; description: string; image_url: string; price: string; claimed: boolean };

const emptyDraft: Draft = { title: "", description: "", image_url: "", price: "", claimed: false };

function toDraft(item: Item): Draft {
  return {
    title: item.title,
    description: item.description ?? "",
    image_url: item.image_url,
    price: (item.price_cents / 100).toFixed(2),
    claimed: item.claimed,
  };
}

function FlashAdmin() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["studio", "flash_designs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("flash_designs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Item[];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["studio", "flash_designs"] });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this design?")) return;
    const { error } = await supabase.from("flash_designs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    invalidate();
  }

  async function toggleClaimed(item: Item) {
    const { error } = await supabase.from("flash_designs").update({ claimed: !item.claimed }).eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    invalidate();
  }

  function rowFromDraft(draft: Draft) {
    return {
      title: draft.title,
      description: draft.description || null,
      image_url: draft.image_url,
      price_cents: Math.round(Number(draft.price || 0) * 100),
      claimed: draft.claimed,
    };
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl uppercase">Flash</h1>
          <p className="font-mono text-xs text-muted-foreground">{items.length} designs</p>
        </div>
        <button
          onClick={() => { setCreating((c) => !c); setEditingId(null); }}
          className="flex items-center gap-2 bg-magenta text-white px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background"
        >
          <Plus className="size-3" /> {creating ? "Cancel" : "New"}
        </button>
      </div>

      {creating && (
        <ItemForm
          initial={emptyDraft}
          onCancel={() => setCreating(false)}
          onSubmit={async (draft) => {
            const { error } = await supabase.from("flash_designs").insert(rowFromDraft(draft));
            if (error) { toast.error(error.message); return; }
            toast.success("Added");
            setCreating(false);
            invalidate();
          }}
        />
      )}

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">LOADING…</p>
      ) : items.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No designs yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) =>
            editingId === item.id ? (
              <div key={item.id} className="sm:col-span-2 lg:col-span-3">
                <ItemForm
                  initial={toDraft(item)}
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (draft) => {
                    const { error } = await supabase.from("flash_designs").update(rowFromDraft(draft)).eq("id", item.id);
                    if (error) { toast.error(error.message); return; }
                    toast.success("Saved");
                    setEditingId(null);
                    invalidate();
                  }}
                />
              </div>
            ) : (
              <div key={item.id} className="border border-border bg-card">
                <img src={item.image_url} alt="" className="w-full aspect-square object-cover" />
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-mono text-sm truncate">{item.title}</p>
                    <span className="font-mono text-xs text-acid shrink-0">${(item.price_cents / 100).toFixed(0)}</span>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button
                      onClick={() => toggleClaimed(item)}
                      className={`font-mono text-[10px] uppercase border px-2 py-1 ${
                        item.claimed ? "border-destructive text-destructive" : "border-border hover:border-magenta hover:text-magenta"
                      }`}
                    >
                      {item.claimed ? "Claimed" : "Available"}
                    </button>
                    <button onClick={() => { setEditingId(item.id); setCreating(false); }} className="font-mono text-[10px] uppercase border border-border px-2 py-1 hover:border-magenta hover:text-magenta">
                      Edit
                    </button>
                    <button onClick={() => onDelete(item.id)} className="font-mono text-[10px] uppercase border border-border px-2 py-1 text-destructive hover:border-destructive">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

function ItemForm({ initial, onSubmit, onCancel }: { initial: Draft; onSubmit: (draft: Draft) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(draft);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="border border-magenta p-6 space-y-4 bg-card">
      <label className="block">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Title *</span>
        <input
          required
          value={draft.title}
          onChange={(e) => set("title", e.target.value)}
          className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Description</span>
        <textarea
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
          className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Image *</span>
        <ImageUpload value={draft.image_url} onChange={(url) => set("image_url", url)} folder="flash_designs" className="mt-1" />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Price (USD) *</span>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={draft.price}
          onChange={(e) => set("price", e.target.value)}
          className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={draft.claimed} onChange={(e) => set("claimed", e.target.checked)} />
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Claimed</span>
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !draft.image_url}
          className="flex-1 bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 border border-border font-mono text-xs uppercase tracking-widest hover:border-foreground/40">
          Cancel
        </button>
      </div>
    </form>
  );
}
