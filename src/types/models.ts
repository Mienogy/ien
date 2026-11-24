/**
 * Domain model types for Ien.
 * These mirror the database rows (see supabase/migrations) with camelCase
 * applied at the service layer where useful.
 */

export type PageType = 'page' | 'checklist'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Space {
  id: string
  user_id: string
  name: string
  position: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
  updated_at: string
}

export interface Page {
  id: string
  user_id: string
  space_id: string | null
  category_id: string | null
  parent_id: string | null
  title: string
  content: Record<string, unknown> | null
  icon: string | null
  cover_url: string | null
  type: PageType
  is_favorite: boolean
  is_archived: boolean
  position: number
  created_at: string
  updated_at: string
  last_viewed_at: string | null
}

/** Lightweight page shape used in lists, sidebars, and search results. */
export type PageSummary = Pick<
  Page,
  | 'id'
  | 'space_id'
  | 'category_id'
  | 'parent_id'
  | 'title'
  | 'icon'
  | 'type'
  | 'is_favorite'
  | 'is_archived'
  | 'position'
  | 'updated_at'
>

export interface ChecklistItem {
  id: string
  user_id: string
  page_id: string
  text: string
  is_done: boolean
  position: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  spaces: number
  pages: number
  favorites: number
  checklists: number
}
