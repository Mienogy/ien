import { supabase, isSupabaseConfigured } from './client'
import { createPage, getPage, updatePage } from './pages'
import * as checklistsService from './checklists'
import type { Page } from '@/types/models'

/**
 * Template service (Workflow §47 — templates).
 *
 * Templates are ordinary pages flagged `is_template = true`. They are
 * excluded from every normal listing; this service is the only reader.
 * "Save as template" copies a page, "instantiate" copies a template
 * into a brand-new working page (in the Inbox).
 */

export async function listTemplates(userId: string): Promise<Page[]> {
  if (!isSupabaseConfigured) return []
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('user_id', userId)
    .eq('is_template', true)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Page[]
}

async function copyChecklistItems(fromPageId: string, toPageId: string, userId: string) {
  const items = await checklistsService.listItems(fromPageId, userId)
  for (const item of items) {
    const created = await checklistsService.addItem(toPageId, userId, item.text, item.position)
    if (item.is_done) {
      await checklistsService.updateItem(created.id, userId, { is_done: true })
    }
  }
}

/** Copy an existing page into a new template (leaves the original intact). */
export async function saveAsTemplate(page: Page, userId: string): Promise<Page> {
  const created = await createPage({
    userId,
    title: page.title,
    spaceId: null,
    categoryId: page.category_id,
    type: page.type,
  })
  const err = await updatePage(created.id, userId, {
    content: page.content,
    icon: page.icon,
    cover_url: page.cover_url,
    search_text: page.search_text ?? undefined,
    is_template: true,
  })
  if (err) throw new Error(err)
  if (page.type === 'checklist') {
    await copyChecklistItems(page.id, created.id, userId)
  }
  const saved = await getPage(created.id, userId)
  return saved ?? created
}

/** Create a fresh working page from a template (lands in the Inbox). */
export async function instantiateTemplate(template: Page, userId: string): Promise<Page> {
  const created = await createPage({
    userId,
    title: template.title,
    spaceId: null,
    categoryId: template.category_id,
    type: template.type,
  })
  const err = await updatePage(created.id, userId, {
    content: template.content,
    icon: template.icon,
    cover_url: template.cover_url,
    search_text: template.search_text ?? undefined,
  })
  if (err) throw new Error(err)
  if (template.type === 'checklist') {
    await copyChecklistItems(template.id, created.id, userId)
  }
  const saved = await getPage(created.id, userId)
  return saved ?? created
}
