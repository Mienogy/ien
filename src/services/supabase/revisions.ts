import { supabase, isSupabaseConfigured } from './client'
import { updatePage } from './pages'
import type { Page, Revision } from '@/types/models'

/**
 * Version history service (Workflow §47 — version history).
 *
 * Snapshots are taken from the editor save path, throttled to one per
 * SNAPSHOT_INTERVAL per page and pruned to KEEP_PER_PAGE rows, so a
 * busy editing session never floods the table. Restoring snapshots the
 * current state first — making every restore itself undoable.
 */

const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000 // one snapshot per 5 minutes
const KEEP_PER_PAGE = 50

/**
 * Store a snapshot of the page — but only if the newest one is older
 * than SNAPSHOT_INTERVAL (or none exists yet). Fire-and-forget safe.
 * Pass `force` to bypass the throttle (used before a restore).
 */
export async function snapshotIfDue(page: Page, userId: string, force = false): Promise<void> {
  if (!isSupabaseConfigured || !userId || !page.id) return
  try {
    const { data: latest } = await supabase
      .from('page_revisions')
      .select('created_at')
      .eq('page_id', page.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!force && latest && Date.now() - Date.parse(latest.created_at) < SNAPSHOT_INTERVAL_MS) {
      return
    }

    const { error } = await supabase.from('page_revisions').insert({
      user_id: userId,
      page_id: page.id,
      title: page.title,
      content: page.content,
      search_text: page.search_text,
    })
    if (error) return // snapshots are best-effort — never break saving

    // Prune: keep only the newest KEEP_PER_PAGE rows for this page.
    const { data: excess } = await supabase
      .from('page_revisions')
      .select('id')
      .eq('page_id', page.id)
      .order('created_at', { ascending: false })
      .range(KEEP_PER_PAGE, KEEP_PER_PAGE + 499)
    if (excess?.length) {
      await supabase
        .from('page_revisions')
        .delete()
        .in(
          'id',
          excess.map((row) => row.id),
        )
    }
  } catch {
    // Best-effort — history must never interfere with autosave.
  }
}

export async function listRevisions(pageId: string, userId: string): Promise<Revision[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('page_revisions')
    .select('id, page_id, title, content, search_text, created_at')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw new Error(error.message)
  return (data ?? []) as Revision[]
}

/** Snapshot the page's CURRENT state, then overwrite it with an old one. */
export async function restoreRevision(
  revision: Revision,
  page: Page,
  userId: string,
): Promise<string | null> {
  if (!isSupabaseConfigured) return 'Supabase is not configured yet.'

  // Safety net: capture the present before replacing it.
  await snapshotIfDue(page, userId, true)

  return updatePage(page.id, userId, {
    title: revision.title,
    content: revision.content,
    search_text: revision.search_text ?? undefined,
  })
}
