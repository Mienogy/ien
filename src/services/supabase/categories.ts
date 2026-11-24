import { supabase, isSupabaseConfigured } from './client'
import type { Category } from '@/types/models'

/** Category service — categories label pages across spaces (Workflow §13). */

export async function listCategories(userId: string): Promise<Category[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Category[]
}

export async function createCategory(userId: string, name: string, color?: string | null) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name: name.trim(), color: color ?? null })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Category
}

export async function renameCategory(id: string, name: string, color?: string | null) {
  const patch: { name: string; color?: string | null } = { name: name.trim() }
  if (color !== undefined) patch.color = color
  const { error } = await supabase.from('categories').update(patch).eq('id', id)
  return error?.message ?? null
}

export async function deleteCategory(id: string): Promise<string | null> {
  // Pages keep existing; their category_id is set to NULL by the FK constraint.
  const { error } = await supabase.from('categories').delete().eq('id', id)
  return error?.message ?? null
}
