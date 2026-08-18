import { supabase } from "@/integrations/supabase/client";

// Bucket is private, so uploads get a long-lived (10yr) signed URL rather than a public one.
export async function uploadImage(folder: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("portfolio").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from("portfolio").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (error || !data) throw error ?? new Error("Failed to sign URL");
  return data.signedUrl;
}
