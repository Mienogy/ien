import { supabase, isSupabaseConfigured } from './client'
import type { ChecklistItem } from '@/types/models'

/** Checklist service — persisted checklist items (Workflow §12). */

export async function listItems(pageId: string, userId: string): Promise<ChecklistItem[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as ChecklistItem[]
}

export async function addItem(
  pageId: string,
  userId: string,
  text: string,
  position: number,
): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({ page_id: pageId, user_id: userId, text: text.trim(), position })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as ChecklistItem
}

export async function updateItem(
  id: string,
  userId: string,
  patch: { text?: string; is_done?: boolean; position?: number },
): Promise<string | null> {
  const { error } = await supabase
    .from('checklist_items')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId)
  return error?.message ?? null
}

export async function deleteItem(id: string, userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('checklist_items')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  return error?.message ?? null
}
