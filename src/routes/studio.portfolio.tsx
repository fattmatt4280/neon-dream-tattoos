import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/studio/ImageUpload";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/studio/portfolio")({
  component: PortfolioAdmin,
});

interface Item {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  featured: boolean;
  sort_order: number;
  tags: string[] | null;
}

type Draft = { title: string; description: string; image_url: string; featured: boolean; tags: string };

const emptyDraft: Draft = { title: "", description: "", image_url: "", featured: false, tags: "" };

function toDraft(item: Item): Draft {
  return {
    title: item.title,
    description: item.description ?? "",
    image_url: item.image_url,
    featured: item.featured,
    tags: (item.tags ?? []).join(", "),
  };
}

function PortfolioAdmin() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["studio", "portfolio_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("portfolio_items").select("*").order("sort_order");
      if (error) throw error;
      return data as Item[];
    },
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["studio", "portfolio_items"] });
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this piece?")) return;
    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    invalidate();
  }

  async function reorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    qc.setQueryData(["studio", "portfolio_items"], next);

    await Promise.all(
      next.map((item, i) => (item.sort_order === i ? null : supabase.from("portfolio_items").update({ sort_order: i }).eq("id", item.id)))
    );
    invalidate();
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl uppercase">Portfolio</h1>
          <p className="font-mono text-xs text-muted-foreground">{items.length} pieces</p>
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
            const { error } = await supabase.from("portfolio_items").insert({
              title: draft.title,
              description: draft.description || null,
              image_url: draft.image_url,
              featured: draft.featured,
              tags: draft.tags ? draft.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
              sort_order: items.length,
            });
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
        <p className="font-mono text-xs text-muted-foreground">No pieces yet.</p>
      ) : (
        <>
          {items.length > 1 && <p className="font-mono text-[10px] text-muted-foreground">Drag a piece to reorder.</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, index) =>
              editingId === item.id ? (
                <div key={item.id} className="sm:col-span-2 lg:col-span-3">
                  <ItemForm
                    initial={toDraft(item)}
                    onCancel={() => setEditingId(null)}
                    onSubmit={async (draft) => {
                      const { error } = await supabase
                        .from("portfolio_items")
                        .update({
                          title: draft.title,
                          description: draft.description || null,
                          image_url: draft.image_url,
                          featured: draft.featured,
                          tags: draft.tags ? draft.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
                        })
                        .eq("id", item.id);
                      if (error) { toast.error(error.message); return; }
                      toast.success("Saved");
                      setEditingId(null);
                      invalidate();
                    }}
                  />
                </div>
              ) : (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => { e.preventDefault(); setOverIndex(index); }}
                  onDragLeave={() => setOverIndex((cur) => (cur === index ? null : cur))}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null) reorder(dragIndex, index);
                    setDragIndex(null);
                    setOverIndex(null);
                  }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                  className={`border bg-card cursor-move transition-colors ${
                    overIndex === index && dragIndex !== null && dragIndex !== index ? "border-magenta" : "border-border"
                  } ${dragIndex === index ? "opacity-40" : ""}`}
                >
                  <img src={item.image_url} alt="" className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm truncate">{item.title}</p>
                      {item.featured && <span className="font-mono text-[9px] uppercase text-acid border border-acid px-1.5 py-0.5 shrink-0">Featured</span>}
                    </div>
                    <div className="mt-2 flex gap-2">
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
        </>
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
        <ImageUpload value={draft.image_url} onChange={(url) => set("image_url", url)} folder="portfolio_items" className="mt-1" />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Tags (comma separated)</span>
        <input
          value={draft.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="color realism, graffiti, pop culture"
          className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={draft.featured} onChange={(e) => set("featured", e.target.checked)} />
        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Featured</span>
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
