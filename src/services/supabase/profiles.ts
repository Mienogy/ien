import { supabase, isSupabaseConfigured } from './client'
import type { Profile } from '@/types/models'

/** Profile service — reads/writes the `profiles` table (Workflow §17). */

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  return (data as Profile | null) ?? null
}

export interface ProfileUpdate {
  first_name?: string | null
  last_name?: string | null
  display_name?: string | null
  avatar_url?: string | null
}

export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<string | null> {
  const { error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', userId)
  return error?.message ?? null
}
