import { supabase, isSupabaseConfigured } from './client'
import type { Page, PageSummary } from '@/types/models'

/**
 * Page service — the heart of Ien (Workflow §10).
 * Every query is scoped by user_id; RLS enforces this server-side too.
 */

const SUMMARY_COLUMNS =
  'id, space_id, category_id, parent_id, title, icon, type, is_favorite, is_archived, position, updated_at'

export async function listRootPages(
  userId: string,
  opts: { spaceId?: string | null; archived?: boolean } = {},
): Promise<PageSummary[]> {
  if (!isSupabaseConfigured) return []
  let query = supabase
    .from('pages')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .is('parent_id', null)
    .eq('is_archived', opts.archived ?? false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (opts.spaceId !== undefined) {
    query = opts.spaceId === null ? query.is('space_id', null) : query.eq('space_id', opts.spaceId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as PageSummary[]
}

export async function listChildPages(userId: string, parentId: string): Promise<PageSummary[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('pages')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .eq('parent_id', parentId)
    .eq('is_archived', false)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as PageSummary[]
}

export async function getPage(pageId: string, userId: string): Promise<Page | null> {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as Page | null) ?? null
}

export async function listFavorites(userId: string): Promise<PageSummary[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('pages')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PageSummary[]
}

export async function listRecent(userId: string, limit = 30): Promise<PageSummary[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('pages')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []) as PageSummary[]
}

export async function listArchived(userId: string): Promise<PageSummary[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('pages')
    .select(SUMMARY_COLUMNS)
    .eq('user_id', userId)
    .eq('is_archived', true)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as PageSummary[]
}

export interface CreatePageInput {
  userId: string
  title?: string
  spaceId?: string | null
  categoryId?: string | null
  parentId?: string | null
  type?: 'page' | 'checklist'
}

export async function createPage(input: CreatePageInput): Promise<Page> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
  const { data, error } = await supabase
    .from('pages')
    .insert({
      user_id: input.userId,
      title: input.title ?? 'Untitled',
      space_id: input.spaceId ?? null,
      category_id: input.categoryId ?? null,
      parent_id: input.parentId ?? null,
      type: input.type ?? 'page',
      position: 0,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data as Page
}

export interface PageUpdate {
  title?: string
  content?: Record<string, unknown> | null
  icon?: string | null
  cover_url?: string | null
  space_id?: string | null
  category_id?: string | null
  parent_id?: string | null
  is_favorite?: boolean
  is_archived?: boolean
  position?: number
  /** Plain-text projection of content, maintained for search. */
  search_text?: string
}

export async function updatePage(pageId: string, userId: string, patch: PageUpdate) {
  const { error } = await supabase
    .from('pages')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('user_id', userId)
  return error?.message ?? null
}

export async function touchPage(pageId: string, userId: string) {
  await supabase
    .from('pages')
    .update({ last_viewed_at: new Date().toISOString() })
    .eq('id', pageId)
    .eq('user_id', userId)
}

export async function permanentlyDeletePage(pageId: string, userId: string): Promise<string | null> {
  const { error } = await supabase
    .from('pages')
    .delete()
    .eq('id', pageId)
    .eq('user_id', userId)
  return error?.message ?? null
}
