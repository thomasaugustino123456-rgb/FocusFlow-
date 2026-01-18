
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rphrmnyqsvruucxzizte.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwaHJtbnlxc3ZydXVjeHppenRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDc2OTQsImV4cCI6MjA4NDE4MzY5NH0.zihyuYb-dQ2qPjv19w6Sk6aef91C2pTl4-_LpY2iEYU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file to a Supabase storage bucket and returns the public URL.
 * Falls back to returning the local preview if the upload fails (e.g. bucket doesn't exist).
 */
export const uploadMedia = async (file: File, bucket: string = 'user-content'): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.warn("Storage upload error (ignoring for demo):", error);
      // If the bucket doesn't exist, we fallback to a data URL for the current session
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    return "";
  }
};
