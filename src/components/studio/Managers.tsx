import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Upload } from "lucide-react";
import { CONTENT_GROUPS, CONTENT_DEFAULTS } from "@/lib/site-content";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "url" | "textarea" | "checkbox" | "select";
  options?: string[];
  required?: boolean;
};

export const portfolioFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "featured", label: "Featured", type: "checkbox" },
  { name: "sort_order", label: "Sort order", type: "number" },
];
export const flashFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "price_cents", label: "Price (cents)", type: "number", required: true },
  { name: "claimed", label: "Claimed", type: "checkbox" },
];
export const merchFields: Field[] = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "image_url", label: "Image URL", type: "url", required: true },
  { name: "price_cents", label: "Price (cents)", type: "number", required: true },
  { name: "product_type", label: "Type", type: "select", options: ["print", "sticker", "apparel", "other"], required: true },
  { name: "stock", label: "Stock", type: "number", required: true },
  { name: "active", label: "Active", type: "checkbox" },
];

export type TableName = "portfolio_items" | "flash_designs" | "merch_products";

export async function uploadImage(folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage
    .from("portfolio")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}

export function ImageField({
  value,
  folder,
  required,
  onChange,
}: {
  value: string;
  folder: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handle(file: File) {
    setUploading(true);
    try {
      onChange(await uploadImage(folder, file));
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-1 space-y-2">
      <input
        type="url"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste URL or upload below"
        className="w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
      />
      <div className="flex items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-widest hover:border-magenta hover:text-magenta">
          <Upload className="size-3" />
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handle(file);
              e.target.value = "";
            }}
          />
        </label>
        {value && <img src={value} alt="" className="size-12 object-cover border border-border" />}
      </div>
    </div>
  );
}

export function SiteContentEditor() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["studio", "site_content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("key, value");
      if (error) throw error;
      return data ?? [];
    },
  });

  const saved: Record<string, string> = {};
  for (const r of rows) saved[r.key] = r.value ?? "";

  const values = draft ?? { ...CONTENT_DEFAULTS, ...saved };
  const set = (k: string, v: string) => setDraft({ ...values, [k]: v });

  async function saveAll() {
    setSaving(true);
    const payload = Object.entries(values).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("site_content").upsert(payload, { onConflict: "key" });
    setSaving(false);
    if (error) return toast.error(error.message);
    setDraft(null);
    toast.success("Content saved");
    qc.invalidateQueries({ queryKey: ["studio", "site_content"] });
    qc.invalidateQueries({ queryKey: ["site_content"] });
  }

  async function resetAll() {
    if (!confirm("Reset every text, link and image back to the original copy?")) return;
    const { error } = await supabase.from("site_content").delete().neq("key", "");
    if (error) return toast.error(error.message);
    setDraft(null);
    toast.success("Reset to defaults");
    qc.invalidateQueries({ queryKey: ["studio", "site_content"] });
    qc.invalidateQueries({ queryKey: ["site_content"] });
  }

  if (isLoading) return <p className="font-mono text-xs text-muted-foreground">LOADING…</p>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center gap-4 flex-wrap sticky top-0 bg-background py-4 z-10 border-b border-border">
        <h2 className="font-display text-3xl uppercase">Site content</h2>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:border-destructive hover:text-destructive"
          >
            Reset
          </button>
          <button
            onClick={saveAll}
            disabled={saving}
            className="bg-magenta text-white px-6 py-2 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      {CONTENT_GROUPS.map((group) => (
        <section key={group.id} className="border border-border bg-card p-6 space-y-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-magenta">{group.label}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {group.fields.map((f) => (
              <label key={f.key} className={f.type === "textarea" || f.type === "image" ? "md:col-span-2 block" : "block"}>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">{f.label}</span>
                {f.type === "textarea" ? (
                  <textarea
                    rows={3}
                    value={values[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
                  />
                ) : f.type === "image" ? (
                  <ImageField value={values[f.key] ?? ""} folder="site" onChange={(v) => set(f.key, v)} />
                ) : (
                  <input
                    type="text"
                    value={values[f.key] ?? ""}
                    onChange={(e) => set(f.key, e.target.value)}
                    placeholder={f.type === "link" ? "/book or https://…" : undefined}
                    className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ContentManager({ table, fields }: { table: TableName; fields: Field[] }) {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ["studio", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["studio", table] });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-3xl uppercase">{table.replace("_", " ")}</h2>
        <button
          onClick={() => setCreating((c) => !c)}
          className="flex items-center gap-2 bg-magenta text-white px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background"
        >
          <Plus className="size-3" /> {creating ? "Cancel" : "New"}
        </button>
      </div>

      {creating && (
        <CreateForm
          table={table}
          fields={fields}
          onDone={() => {
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["studio", table] });
          }}
        />
      )}

      {isLoading ? (
        <p className="font-mono text-xs text-muted-foreground">LOADING…</p>
      ) : data.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No items yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((row: { id: string; title?: string; image_url?: string }) => (
            <div key={row.id} className="border border-border p-4 bg-card flex gap-4">
              {row.image_url && <img src={row.image_url} alt="" className="size-20 object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm truncate">{row.title}</p>
                <p className="font-mono text-[10px] text-muted-foreground truncate">{row.id}</p>
              </div>
              <button onClick={() => onDelete(row.id)} className="text-destructive hover:text-magenta" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BookingsManager() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["studio", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function updateStatus(id: string, status: "pending" | "confirmed" | "declined" | "completed") {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["studio", "bookings"] });
  }

  if (isLoading) return <p className="font-mono text-xs text-muted-foreground">LOADING…</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl uppercase">Bookings</h2>
      {data.length === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">No bookings yet.</p>
      ) : (
        data.map((b: {
          id: string;
          client_name: string;
          client_email: string;
          phone: string | null;
          concept: string;
          status: string;
          preferred_date: string | null;
          created_at: string;
          body_location: string | null;
          session_length: string | null;
          deposit_paid: boolean;
          deposit_amount_cents: number | null;
        }) => (
          <article key={b.id} className="border border-border p-5 bg-card">
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
                  {b.session_length && ` · ${b.session_length}`}
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
            <div className="mt-4 flex gap-2 flex-wrap">
              {(["pending", "confirmed", "declined", "completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(b.id, s)}
                  className="font-mono text-[10px] uppercase border border-border px-3 py-1 hover:border-magenta hover:text-magenta"
                >
                  {s}
                </button>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}

export function CreateForm({ table, fields, onDone }: { table: TableName; fields: Field[]; onDone: () => void }) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);

  function setVal(name: string, v: unknown) {
    setValues((s) => ({ ...s, [name]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const row: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === "checkbox") row[f.name] = !!v;
      else if (f.type === "number") row[f.name] = v ? Number(v) : 0;
      else row[f.name] = v ?? null;
    }
    const { error } = await supabase.from(table).insert(row as never);
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Created");
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="border border-magenta p-6 space-y-4 bg-card">
      {fields.map((f) => {
        const isImage = f.name === "image_url";
        const val = values[f.name];
        return (
          <label key={f.name} className="block">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              {f.label}
              {f.required && <span className="text-magenta"> *</span>}
            </span>
            {f.type === "textarea" ? (
              <textarea
                required={f.required}
                rows={3}
                value={(val as string) ?? ""}
                onChange={(e) => setVal(f.name, e.target.value)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
              />
            ) : f.type === "checkbox" ? (
              <input type="checkbox" checked={!!val} onChange={(e) => setVal(f.name, e.target.checked)} className="ml-2 mt-1" />
            ) : f.type === "select" ? (
              <select
                required={f.required}
                value={(val as string) ?? ""}
                onChange={(e) => setVal(f.name, e.target.value)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
              >
                <option value="">—</option>
                {f.options!.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : isImage ? (
              <ImageField
                value={(val as string) ?? ""}
                folder={table}
                required={f.required}
                onChange={(v) => setVal(f.name, v)}
              />
            ) : (
              <input
                type={f.type ?? "text"}
                required={f.required}
                value={(val as string | number | undefined) ?? ""}
                onChange={(e) => setVal(f.name, e.target.value)}
                className="mt-1 w-full bg-background border border-border px-3 py-2 focus:outline-none focus:border-magenta"
              />
            )}
          </label>
        );
      })}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-magenta text-white py-3 font-mono text-xs uppercase tracking-widest hover:bg-cyan hover:text-background disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
