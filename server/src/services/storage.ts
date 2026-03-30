import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = 'attachments';

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ path: string; publicUrl: string }> {
  const ext = originalName.split('.').pop();
  const path = `${uuidv4()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export async function getFileAsBase64(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);

  if (error) throw new Error(`Storage download failed: ${error.message}`);

  const buffer = Buffer.from(await data.arrayBuffer());
  return buffer.toString('base64');
}
