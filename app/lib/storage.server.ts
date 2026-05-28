import { createClient } from "@supabase/supabase-js";

// We use a separate client for storage because it doesn't need SSR cookies.
// We can just use the anon key or service role key if needed.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const storageClient = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFileToSupabase(
  file: File,
  bucketName: "thumbnails" | "ads"
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { data, error } = await storageClient.storage
    .from(bucketName)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    return null;
  }

  const { data: publicUrlData } = storageClient.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
