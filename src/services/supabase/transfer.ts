import { supabase, isSupabaseConfigured } from './client'
import { createPage, updatePage } from './pages'
import { createSpace } from './spaces'
import * as categoriesService from './categories'
import * as checklistsService from './checklists'

/**
 * Workspace export/import (Workflow §47 — import/export; §30 — export data).
 *
 * Export snapshots every space, category, page (with Tiptap content), and
 * checklist item into one JSON document. Import recreates it all under new
 * ids, remapping space/parent/category references as it goes.
 */

export interface WorkspaceExport {
  app: 'ien'
  version: 1
  exportedAt: string
  spaces: { id: string; name: string; position: number }[]
  categories: { id: string; name: string; color: string | null }[]
  pages: {
    id: string
    space_id: string | null
    category_id: string | null
    parent_id: string | null
    title: string
    content: Record<string, unknown> | null
    icon: string | null
    cover_url: string | null
    type: 'page' | 'checklist'
    is_favorite: boolean
    position: number
    search_text: string | null
  }[]
  checklistItems: {
    page_id: string
    text: string
    is_done: boolean
    position: number
  }[]
}

export interface ImportSummary {
  spaces: number
  categories: number
  pages: number
  checklistItems: number
}

export async function exportWorkspace(userId: string): Promise<WorkspaceExport> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')

  const [spaces, categories, pages, items] = await Promise.all([
    supabase.from('spaces').select('id, name, position').eq('user_id', userId),
    supabase.from('categories').select('id, name, color').eq('user_id', userId),
    supabase
      .from('pages')
      .select(
        'id, space_id, category_id, parent_id, title, content, icon, cover_url, type, is_favorite, position, search_text',
      )
      .eq('user_id', userId),
    supabase
      .from('checklist_items')
      .select('page_id, text, is_done, position')
      .eq('user_id', userId),
  ])

  if (spaces.error) throw new Error(spaces.error.message)
  if (categories.error) throw new Error(categories.error.message)
  if (pages.error) throw new Error(pages.error.message)
  if (items.error) throw new Error(items.error.message)

  return {
    app: 'ien',
    version: 1,
    exportedAt: new Date().toISOString(),
    spaces: spaces.data ?? [],
    categories: categories.data ?? [],
    pages: (pages.data ?? []) as WorkspaceExport['pages'],
    checklistItems: (items.data ?? []) as WorkspaceExport['checklistItems'],
  }
}

function isWorkspaceExport(value: unknown): value is WorkspaceExport {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<WorkspaceExport>
  return (
    data.app === 'ien' &&
    data.version === 1 &&
    Array.isArray(data.spaces) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.pages) &&
    Array.isArray(data.checklistItems)
  )
}

export async function importWorkspace(
  userId: string,
  raw: unknown,
): Promise<ImportSummary> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured yet.')
  if (!isWorkspaceExport(raw)) {
    throw new Error('This file is not a valid Ien export.')
  }

  // --- Categories: reuse existing names (unique per user), create the rest.
  const existingCategories = await categoriesService.listCategories(userId)
  const categoryMap = new Map<string, string>()
  let categoriesCreated = 0
  for (const category of raw.categories) {
    const match = existingCategories.find(
      (c) => c.name.toLowerCase() === category.name.toLowerCase(),
    )
    if (match) {
      categoryMap.set(category.id, match.id)
      continue
    }
    const created = await categoriesService.createCategory(
      userId,
      category.name,
      category.color,
    )
    categoryMap.set(category.id, created.id)
    categoriesCreated += 1
  }

  // --- Spaces: always created fresh.
  const spaceMap = new Map<string, string>()
  let spacesCreated = 0
  for (const space of [...raw.spaces].sort((a, b) => a.position - b.position)) {
    const created = await createSpace(userId, space.name, space.position)
    spaceMap.set(space.id, created.id)
    spacesCreated += 1
  }

  // --- Pages: parents must exist before children — repeat passes until done.
  const pageMap = new Map<string, string>()
  const pending = [...raw.pages]
  let pagesCreated = 0
  while (pending.length) {
    const index = pending.findIndex(
      (page) => page.parent_id === null || pageMap.has(page.parent_id),
    )
    if (index === -1) {
      throw new Error('Import failed: some pages reference a missing parent.')
    }
    const [page] = pending.splice(index, 1)

    const created = await createPage({
      userId,
      title: page.title,
      spaceId: page.space_id ? (spaceMap.get(page.space_id) ?? null) : null,
      categoryId: page.category_id
        ? (categoryMap.get(page.category_id) ?? null)
        : null,
      parentId: page.parent_id ? (pageMap.get(page.parent_id) ?? null) : null,
      type: page.type,
    })
    pageMap.set(page.id, created.id)
    pagesCreated += 1

    // createPage only takes the basics — fill in the rest afterwards.
    const err = await updatePage(created.id, userId, {
      content: page.content,
      icon: page.icon,
      cover_url: page.cover_url,
      is_favorite: page.is_favorite,
      position: page.position,
      search_text: page.search_text ?? undefined,
    })
    if (err) throw new Error(`Import failed while saving “${page.title}”: ${err}`)
  }

  // --- Checklist items, mapped onto their new page ids.
  let itemsCreated = 0
  for (const item of raw.checklistItems) {
    const newPageId = pageMap.get(item.page_id)
    if (!newPageId) continue
    const created = await checklistsService.addItem(
      newPageId,
      userId,
      item.text,
      item.position,
    )
    if (item.is_done) {
      await checklistsService.updateItem(created.id, userId, { is_done: true })
    }
    itemsCreated += 1
  }

  return {
    spaces: spacesCreated,
    categories: categoriesCreated,
    pages: pagesCreated,
    checklistItems: itemsCreated,
  }
}
