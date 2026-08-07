import { getAdminSupabase } from './admin';

export type StorageBucket = 'products' | 'quality-reports' | 'return-claims';

/**
 * Upload a file buffer or Blob to Supabase Storage
 */
export async function uploadToStorage(
  bucket: StorageBucket,
  path: string,
  fileData: Buffer | Blob | Uint8Array,
  contentType?: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const supabase = getAdminSupabase();

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, fileData, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: new Error(uploadError.message) };
    }

    // If it's a public bucket, return the public URL
    if (bucket === 'products' || bucket === 'quality-reports') {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data.publicUrl, error: null };
    }

    // For private buckets (return-claims), generate a signed URL (valid for 1 year)
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365);

    if (signError) {
      return { url: null, error: new Error(signError.message) };
    }

    return { url: signedData.signedUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err };
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFromStorage(
  bucket: StorageBucket,
  paths: string[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = getAdminSupabase();
    const { error } = await supabase.storage.from(bucket).remove(paths);
    if (error) return { success: false, error: new Error(error.message) };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
}
