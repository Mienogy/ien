import { supabase, isSupabaseConfigured } from './client'

/**
 * Search service — global search across pages, spaces, categories (Workflow §14).
 * Uses ILIKE with a prepared pattern; search_text holds the plain-text
 * projection of each page's editor content for fast matching.
 */

export interface SearchResult {
  type: 'page' | 'space' | 'category'
  id: string
  title: string
  subtitle?: string
  space_id?: string | null
}

function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (m) => `\\${m}`)
}

export async function search(userId: string, term: string, limit = 12): Promise<SearchResult[]> {
  if (!isSupabaseConfigured || term.trim().length < 2) return []
  const pattern = `%${escapeLike(term.trim())}%`

  const [pages, spaces, categories] = await Promise.all([
    supabase
      .from('pages')
      .select('id, title, space_id, search_text, is_archived')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .or(`title.ilike.${pattern},search_text.ilike.${pattern}`)
      .limit(limit),
    supabase
      .from('spaces')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', pattern)
      .limit(4),
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .ilike('name', pattern)
      .limit(4),
  ])

  const results: SearchResult[] = []

  for (const p of pages.data ?? []) {
    results.push({
      type: 'page',
      id: p.id as string,
      title: (p.title as string) || 'Untitled',
      space_id: p.space_id as string | null,
      subtitle: (p.search_text as string | null)?.slice(0, 80) ?? undefined,
    })
  }
  for (const s of spaces.data ?? []) {
    results.push({ type: 'space', id: s.id as string, title: s.name as string })
  }
  for (const c of categories.data ?? []) {
    results.push({ type: 'category', id: c.id as string, title: c.name as string })
  }

  return results.slice(0, limit)
}
