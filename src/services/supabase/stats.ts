import { supabase, isSupabaseConfigured } from './client'
import type { DashboardStats } from '@/types/models'

/**
 * Dashboard counts for the home screen (Workflow §9).
 * Lives in the service layer — UI components never call Supabase directly.
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  if (!isSupabaseConfigured || !userId) {
    return { spaces: 0, pages: 0, favorites: 0, checklists: 0 }
  }

  const [spaces, pages, favorites, checklists] = await Promise.all([
    supabase.from('spaces').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('type', 'page'),
    supabase
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .eq('is_archived', false),
    supabase
      .from('pages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_archived', false)
      .eq('type', 'checklist'),
  ])

  return {
    spaces: spaces.count ?? 0,
    pages: pages.count ?? 0,
    favorites: favorites.count ?? 0,
    checklists: checklists.count ?? 0,
  }
}
