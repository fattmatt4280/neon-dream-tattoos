import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { CONTENT_GROUPS, CONTENT_DEFAULTS } from "@/lib/site-content";
import { uploadImage } from "@/lib/upload-image";

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
