import { supabase, isSupabaseConfigured } from './client'
import type { Space } from '@/types/models'

/** Space service — spaces group pages into areas like WORK or PERSONAL (Workflow §8). */

export async function listSpaces(userId: string): Promise<Space[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Space[]
}

export async function createSpace(
  userId: string,
  name: string,
  position: number,
): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .insert({ user_id: userId, name: name.trim(), position })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Space
}

export async function renameSpace(id: string, name: string): Promise<string | null> {
  const { error } = await supabase.from('spaces').update({ name: name.trim() }).eq('id', id)
  return error?.message ?? null
}

export async function deleteSpace(id: string): Promise<string | null> {
  // Pages in the space become space-less (set to null) rather than deleted —
  // handled by the ON DELETE SET NULL constraint in the migration.
  const { error } = await supabase.from('spaces').delete().eq('id', id)
  return error?.message ?? null
}
