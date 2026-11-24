import { supabase, isSupabaseConfigured } from './client'
import type { Reminder } from '@/types/models'

/** Reminder service — page-level due dates (Workflow §47 — reminders). */

const SELECT_COLUMNS = 'id, page_id, due_at, is_done, created_at, updated_at'

/** Reminder with its page title embedded (single PostgREST join). */
export interface ReminderWithPage extends Reminder {
  page: { title: string }[] | { title: string } | null
}

/** Upcoming, not-yet-done reminders for the whole workspace. */
export async function listUpcoming(userId: string): Promise<ReminderWithPage[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('reminders')
    .select(`${SELECT_COLUMNS}, page:pages(title)`)
    .eq('user_id', userId)
    .eq('is_done', false)
    .order('due_at', { ascending: true })
    .limit(100)
  if (error) throw new Error(error.message)
  // PostgREST returns a many-to-one embed as an object; the loose client
  // types guess "array", hence the double cast. Callers fall back safely.
  return (data ?? []) as unknown as ReminderWithPage[]
}

/** The active reminder for one page, if any. */
export async function getForPage(pageId: string, userId: string): Promise<Reminder | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase
    .from('reminders')
    .select(SELECT_COLUMNS)
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .eq('is_done', false)
    .order('due_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return (data as Reminder | null) ?? null
}

export async function createReminder(
  pageId: string,
  userId: string,
  dueAt: string,
): Promise<Reminder> {
  const { data, error } = await supabase
    .from('reminders')
    .insert({ page_id: pageId, user_id: userId, due_at: dueAt })
    .select(SELECT_COLUMNS)
    .single()
  if (error) throw new Error(error.message)
  return data as Reminder
}

export async function setDueAt(reminderId: string, userId: string, dueAt: string): Promise<string | null> {
  const { error } = await supabase
    .from('reminders')
    .update({ due_at: dueAt })
    .eq('id', reminderId)
    .eq('user_id', userId)
  return error?.message ?? null
}

export async function completeReminder(reminderId: string, userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('reminders')
    .update({ is_done: true })
    .eq('id', reminderId)
    .eq('user_id', userId)
  return error?.message ?? null
}

export async function deleteReminder(reminderId: string, userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('reminders')
    .delete()
    .eq('id', reminderId)
    .eq('user_id', userId)
  return error?.message ?? null
}
