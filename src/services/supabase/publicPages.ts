import { supabase, isSupabaseConfigured } from './client'
import { updatePage } from './pages'
import type { ChecklistItem, Page } from '@/types/models'

/**
 * Public page sharing (Workflow §47 — public pages).
 *
 * A page becomes readable by anyone when it has a public_slug; the
 * RLS policies added in migration 000007 enforce this server-side.
 * Reads here deliberately do NOT filter by user_id — they run as the
 * visitor (possibly anonymous) and rely on those policies.
 */

export function publicUrl(slug: string): string {
  return `${window.location.origin}/p/${slug}`
}

/** Turn sharing on and return the fresh slug. */
export async function enableSharing(pageId: string, userId: string): Promise<string> {
  const slug = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
  const err = await updatePage(pageId, userId, { public_slug: slug })
  if (err) throw new Error(err)
  return slug
}

/** Turn sharing off (slug becomes unreadable immediately). */
export async function disableSharing(pageId: string, userId: string): Promise<void> {
  const err = await updatePage(pageId, userId, { public_slug: null })
  if (err) throw new Error(err)
}

export interface PublicPageResult {
  page: Page
  items: ChecklistItem[]
}

/** Fetch a shared page by slug — returns null when missing/private. */
export async function getPublicPage(slug: string): Promise<PublicPageResult | null> {
  if (!isSupabaseConfigured || !slug) return null

  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('public_slug', slug)
    .eq('is_archived', false)
    .eq('is_template', false)
    .maybeSingle()
  if (!page) return null

  let items: ChecklistItem[] = []
  if ((page as Page).type === 'checklist') {
    const { data } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('page_id', (page as Page).id)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    items = (data ?? []) as ChecklistItem[]
  }

  return { page: page as Page, items }
}
