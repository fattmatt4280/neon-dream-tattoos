import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/upload-image";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder: string;
  className?: string;
}

// Drag-and-drop wrapper around uploadImage() (signed URL, private "portfolio" bucket).
export function ImageUpload({ value, onChange, folder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [showUrlField, setShowUrlField] = useState(false);

  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Images only");
      return;
    }
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

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div className={className}>
      {value && (
        <div className="relative mb-2 group">
          <img src={value} alt="" className="w-full h-40 object-cover border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-background/80 text-destructive text-[10px] uppercase font-mono px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity border border-destructive/50"
          >
            Remove
          </button>
        </div>
      )}

      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`cursor-pointer border-2 border-dashed p-6 text-center font-mono text-xs uppercase tracking-widest transition-colors ${
          drag ? "border-magenta bg-magenta/5 text-magenta" : "border-border text-muted-foreground hover:border-foreground/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        {uploading ? "Uploading…" : value ? "Click or drag to replace" : "Click or drag to upload"}
      </div>

      <button
        type="button"
        onClick={() => setShowUrlField((s) => !s)}
        className="mt-1.5 font-mono text-[10px] text-muted-foreground underline hover:text-foreground"
      >
        {showUrlField ? "Hide URL field" : "or paste an image URL"}
      </button>
      {showUrlField && (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-1.5 w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-magenta"
        />
      )}
    </div>
  );
}
