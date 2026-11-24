import { supabase, isSupabaseConfigured } from './client'

/**
 * Storage service — profile pictures in the `avatars` bucket (Workflow §25).
 * Layout: avatars/{user-id}/profile.{ext}
 * RLS policies ensure a user can only write inside their own folder.
 */

const BUCKET = 'avatars'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string | null
  error: string | null
}

function extensionFor(type: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[type] ?? 'jpg'
}

export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured) return { url: null, error: 'Supabase is not configured yet.' }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'Please choose a JPEG, PNG, WebP, or GIF image.' }
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Image must be smaller than 5 MB.' }
  }

  // Safe fixed filename — replaces the previous image automatically.
  const path = `${userId}/profile.${extensionFor(file.type)}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    cacheControl: '3600',
  })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

export async function removeAvatar(userId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase is not configured yet.'
  const files = [`profile.jpg`, `profile.png`, `profile.webp`, `profile.gif`].map(
    (f) => `${userId}/${f}`,
  )
  const { error } = await supabase.storage.from(BUCKET).remove(files)
  return error?.message ?? null
}

/**
 * Upload an image for embedding in a page (Workflow §11).
 * Layout: images/{user-id}/{uuid}.{ext} — unique name, never overwrites.
 */
export async function uploadPageImage(userId: string, file: File): Promise<UploadResult> {
  if (!isSupabaseConfigured) return { url: null, error: 'Supabase is not configured yet.' }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { url: null, error: 'Please choose a JPEG, PNG, WebP, or GIF image.' }
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: 'Image must be smaller than 5 MB.' }
  }

  const name = `${crypto.randomUUID()}.${extensionFor(file.type)}`
  const path = `${userId}/${name}`
  const { error } = await supabase.storage.from('images').upload(path, file, {
    cacheControl: '3600',
  })
  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
