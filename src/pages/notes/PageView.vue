<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Archive,
  Bell,
  CheckSquare,
  ChevronRight,
  Download,
  FileText,
  FolderOpen,
  History,
  LayoutTemplate,
  MoreHorizontal,
  Plus,
  Share2,
  Star,
  Trash2,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import Editor from '@/components/editor/Editor.vue'
import ChecklistEditor from '@/components/notes/ChecklistEditor.vue'
import CategoryMenu from '@/components/notes/CategoryMenu.vue'
import ReminderDialog from '@/components/notes/ReminderDialog.vue'
import ShareDialog from '@/components/notes/ShareDialog.vue'
import VersionHistoryDialog from '@/components/notes/VersionHistoryDialog.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import SubPageList from '@/components/sidebar/SubPageList.vue'
import type { Page, Reminder } from '@/types/models'
import * as pagesService from '@/services/supabase/pages'
import * as checklistsService from '@/services/supabase/checklists'
import * as templatesService from '@/services/supabase/templates'
import * as revisionsService from '@/services/supabase/revisions'
import * as remindersService from '@/services/supabase/reminders'
import { formatDue, isOverdue } from '@/lib/datetime'
import { tiptapToMarkdown } from '@/lib/tiptapMarkdown'
import { downloadText, slugify } from '@/lib/download'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const content = useContentStore()
const toasts = useToasts()

const page = ref<Page | null>(null)
const loading = ref(true)
const notFound = ref(false)
const saveState = ref<'idle' | 'saving' | 'saved'>('idle')
const menuOpen = ref(false)
const historyOpen = ref(false)
const shareOpen = ref(false)
const reminderOpen = ref(false)
const reminder = ref<Reminder | null>(null)
const deleteOpen = ref(false)
const deleting = ref(false)
const titleDraft = ref('')
const subPageVersion = ref(0)

const pageId = computed(() => route.params.pageId as string)

const space = computed(() => (page.value?.space_id ? content.spaceMap[page.value.space_id] : null))

/** Breadcrumb trail: walk up parent_id chain. */
const breadcrumbs = ref<{ id: string; title: string }[]>([])

async function loadBreadcrumbs() {
  const trail: { id: string; title: string }[] = []
  let current = page.value
  let guard = 0
  while (current?.parent_id && guard < 10) {
    const parent = await pagesService.getPage(current.parent_id, auth.userId ?? '')
    if (!parent) break
    trail.unshift({ id: parent.id, title: parent.title || 'Untitled' })
    current = parent
    guard++
  }
  breadcrumbs.value = trail
}

async function load() {
  loading.value = true
  notFound.value = false
  reminder.value = null
  try {
    await content.loadAll()
    const found = await pagesService.getPage(pageId.value, auth.userId ?? '')
    if (!found || found.is_archived) {
      notFound.value = true
      return
    }
    page.value = found
    titleDraft.value = found.title
    const [currentReminder] = await Promise.all([
      remindersService.getForPage(found.id, auth.userId ?? ''),
      loadBreadcrumbs(),
      pagesService.touchPage(found.id, auth.userId ?? ''),
    ])
    reminder.value = currentReminder
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load page.')
    notFound.value = true
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(pageId, load)

// --- Persistence ---

async function persist(patch: Parameters<typeof pagesService.updatePage>[2], showState = true) {
  if (!page.value) return
  if (showState) saveState.value = 'saving'
  const err = await pagesService.updatePage(page.value.id, auth.userId ?? '', patch)
  if (err) {
    saveState.value = 'idle'
    toasts.error('Failed to save changes')
    return
  }
  Object.assign(page.value, patch)
  // Version history: snapshot title/content edits (throttled internally).
  if (patch.title !== undefined || patch.content !== undefined) {
    void revisionsService.snapshotIfDue(page.value, auth.userId ?? '')
  }
  if (showState) {
    saveState.value = 'saved'
    window.setTimeout(() => {
      if (saveState.value === 'saved') saveState.value = 'idle'
    }, 2000)
  }
}

function saveTitle() {
  const title = titleDraft.value.trim() || 'Untitled'
  if (page.value && title !== page.value.title) {
    void persist({ title })
  }
}

function onAssignCategory(categoryId: string | null) {
  void persist({ category_id: categoryId })
}

async function exportMarkdown() {
  if (!page.value) return
  try {
    let body: string
    if (page.value.type === 'checklist') {
      const items = await checklistsService.listItems(page.value.id, auth.userId ?? '')
      body = items.map((item) => `- [${item.is_done ? 'x' : ' '}] ${item.text}`).join('\n')
    } else {
      body = tiptapToMarkdown(page.value.content)
    }
    const markdown = `# ${page.value.title || 'Untitled'}\n\n${body}\n`
    downloadText(`${slugify(page.value.title)}.md`, markdown, 'text/markdown')
    toasts.success('Exported as Markdown.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Export failed.')
  }
}

async function saveAsTemplate() {
  if (!page.value) return
  try {
    await templatesService.saveAsTemplate(page.value, auth.userId ?? '')
    toasts.success('Saved as template — find it under “From template” on Home.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to save template.')
  }
}

function onShareChanged(slug: string | null) {
  if (page.value) page.value.public_slug = slug
}

function onReminderChanged(next: Reminder | null) {
  reminder.value = next
}

function onEditorSave(value: Record<string, unknown>) {
  // Plain-text projection maintained for search (see search service).
  const searchText = extractText(value)
  void persist({ content: value, search_text: searchText }, false)
  saveState.value = 'saving'
  window.setTimeout(() => {
    saveState.value = 'saved'
    window.setTimeout(() => {
      if (saveState.value === 'saved') saveState.value = 'idle'
    }, 2000)
  }, 400)
}

/** Recursively flatten Tiptap JSON into plain text for search indexing. */
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; content?: unknown[] }
  if (typeof n.text === 'string') return n.text
  if (Array.isArray(n.content)) return n.content.map(extractText).join(' ')
  return ''
}

async function toggleFavorite() {
  if (!page.value) return
  await persist({ is_favorite: !page.value.is_favorite }, false)
  toasts.success(page.value.is_favorite ? 'Added to favorites' : 'Removed from favorites')
}

async function toggleArchive() {
  if (!page.value) return
  const next = !page.value.is_archived
  await persist({ is_archived: next }, false)
  if (next) {
    toasts.success('Page archived')
    router.push({ name: 'home' })
  } else {
    toasts.success('Page restored')
  }
}

async function confirmDelete() {
  if (!page.value) return
  deleting.value = true
  const err = await pagesService.permanentlyDeletePage(page.value.id, auth.userId ?? '')
  deleting.value = false
  if (err) {
    toasts.error(err)
    return
  }
  toasts.success('Page deleted')
  router.push(space.value ? { name: 'space', params: { spaceId: space.value.id } } : { name: 'home' })
}

async function addSubPage() {
  if (!page.value) return
  try {
    const child = await content.createPage({
      parentId: page.value.id,
      spaceId: page.value.space_id,
      title: 'Untitled',
    })
    subPageVersion.value++
    router.push({ name: 'page', params: { pageId: child.id } })
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create sub-page.')
  }
}

const saveLabel = computed(() => {
  if (saveState.value === 'saving') return 'Saving…'
  if (saveState.value === 'saved') return 'Saved just now'
  return ''
})
</script>

<template>
  <div class="page-view fade-in">
    <!-- Loading -->
    <div
      v-if="loading"
      class="page-loading"
    >
      <BaseSkeleton
        width="200px"
        height="14px"
      />
      <BaseSkeleton
        width="60%"
        height="30px"
      />
      <BaseSkeleton
        width="100%"
        height="16px"
      />
      <BaseSkeleton
        width="90%"
        height="16px"
      />
      <BaseSkeleton
        width="80%"
        height="16px"
      />
    </div>

    <!-- Not found -->
    <EmptyState
      v-else-if="notFound || !page"
      :icon="FolderOpen"
      title="Page not found"
      description="This page doesn't exist, or it has been archived."
    >
      <template #action>
        <BaseButton
          variant="secondary"
          @click="router.push({ name: 'home' })"
        >
          Back home
        </BaseButton>
      </template>
    </EmptyState>

    <!-- Page -->
    <article
      v-else
      class="page"
    >
      <!-- Breadcrumbs -->
      <nav
        class="breadcrumbs"
        aria-label="Breadcrumb"
      >
        <RouterLink
          :to="{ name: 'home' }"
          class="breadcrumbs__link"
        >Home</RouterLink>
        <template v-if="space">
          <ChevronRight
            :size="12"
            class="breadcrumbs__sep"
          />
          <RouterLink
            :to="{ name: 'space', params: { spaceId: space.id } }"
            class="breadcrumbs__link"
          >
            {{ space.name }}
          </RouterLink>
        </template>
        <template
          v-for="crumb in breadcrumbs"
          :key="crumb.id"
        >
          <ChevronRight
            :size="12"
            class="breadcrumbs__sep"
          />
          <RouterLink
            :to="{ name: 'page', params: { pageId: crumb.id } }"
            class="breadcrumbs__link"
          >
            {{ crumb.title }}
          </RouterLink>
        </template>
        <ChevronRight
          :size="12"
          class="breadcrumbs__sep"
        />
        <span class="breadcrumbs__current">{{ page.title || 'Untitled' }}</span>
      </nav>

      <!-- Toolbar row -->
      <div class="page__toolbar">
        <span
          class="page__save"
          :class="`page__save--${saveState}`"
          role="status"
        >
          {{ saveLabel }}
        </span>

        <div class="page__tools">
          <button
            class="icon-btn"
            :class="{ 'icon-btn--favorite': page.is_favorite }"
            :aria-label="page.is_favorite ? 'Remove from favorites' : 'Add to favorites'"
            :title="page.is_favorite ? 'Remove from favorites' : 'Add to favorites'"
            @click="toggleFavorite"
          >
            <Star
              :size="16"
              :fill="page.is_favorite ? 'currentColor' : 'none'"
            />
          </button>

          <div class="menu-wrap">
            <button
              class="icon-btn"
              aria-label="Page actions"
              :aria-expanded="menuOpen"
              @click="menuOpen = !menuOpen"
            >
              <MoreHorizontal :size="16" />
            </button>
            <div
              v-if="menuOpen"
              class="menu-backdrop"
              @click="menuOpen = false"
            />
            <div
              v-if="menuOpen"
              class="menu"
              role="menu"
            >
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; shareOpen = true"
              >
                <Share2 :size="14" /> Share…
              </button>
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; reminderOpen = true"
              >
                <Bell :size="14" /> Set reminder…
              </button>
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; historyOpen = true"
              >
                <History :size="14" /> Version history
              </button>
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; saveAsTemplate()"
              >
                <LayoutTemplate :size="14" /> Save as template
              </button>
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; exportMarkdown()"
              >
                <Download :size="14" /> Export as Markdown
              </button>
              <button
                class="menu__item"
                role="menuitem"
                @click="menuOpen = false; toggleArchive()"
              >
                <Archive :size="14" /> Archive page
              </button>
              <button
                class="menu__item menu__item--danger"
                role="menuitem"
                @click="menuOpen = false; deleteOpen = true"
              >
                <Trash2 :size="14" /> Delete permanently
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Icon -->
      <div class="page__icon-row">
        <span
          class="page__icon"
          aria-hidden="true"
        >
          <template v-if="page.icon">{{ page.icon }}</template>
          <CheckSquare
            v-else-if="page.type === 'checklist'"
            :size="38"
          />
          <FileText
            v-else
            :size="38"
          />
        </span>
      </div>

      <!-- Title -->
      <input
        v-model="titleDraft"
        class="page__title"
        placeholder="Untitled"
        aria-label="Page title"
        @blur="saveTitle"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
      >

      <!-- Meta chips -->
      <div class="page__meta">
        <CategoryMenu
          v-if="page"
          :category-id="page.category_id"
          @assign="onAssignCategory"
        />
        <button
          v-if="reminder"
          class="chip chip--due"
          :class="{ 'chip--overdue': isOverdue(reminder.due_at) }"
          title="Edit reminder"
          @click="reminderOpen = true"
        >
          <Bell :size="12" /> {{ formatDue(reminder.due_at) }}
        </button>
        <span class="chip chip--muted">
          Created {{ new Date(page.created_at).toLocaleDateString() }}
        </span>
        <span class="chip chip--muted">
          Edited {{ new Date(page.updated_at).toLocaleDateString() }}
        </span>
      </div>

      <!-- Body -->
      <div class="page__body">
        <ChecklistEditor
          v-if="page.type === 'checklist'"
          :page-id="page.id"
        />
        <Editor
          v-else
          :model-value="page.content"
          @update:model-value="page.content = $event"
          @save="onEditorSave"
        />
      </div>

      <!-- Sub-pages -->
      <section class="subpages">
        <div class="subpages__header">
          <h2 class="subpages__title">
            Sub-pages
          </h2>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="addSubPage"
          >
            <Plus :size="13" /> Add sub-page
          </BaseButton>
        </div>
        <div
          :key="subPageVersion"
          class="subpages__list"
        >
          <SubPageList
            :parent-id="page.id"
            :depth="0"
          />
        </div>
      </section>

      <ConfirmDialog
        :open="deleteOpen"
        :title="`Delete \u201C${page.title || 'Untitled'}\u201D?`"
        message="This permanently removes the page, its content, and all sub-pages. This action cannot be undone."
        confirm-label="Delete forever"
        :loading="deleting"
        @close="deleteOpen = false"
        @confirm="confirmDelete"
      />

      <VersionHistoryDialog
        :open="historyOpen"
        :page="page"
        @close="historyOpen = false"
        @restored="load"
      />

      <ShareDialog
        :open="shareOpen"
        :page="page"
        @close="shareOpen = false"
        @changed="onShareChanged"
      />

      <ReminderDialog
        :open="reminderOpen"
        :page="page"
        @close="reminderOpen = false"
        @changed="onReminderChanged"
      />
    </article>
  </div>
</template>

<style scoped>
.page-view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-6) var(--space-6) var(--space-16);
}

.page-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-top: var(--space-6);
}

/* Breadcrumbs */
.breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.breadcrumbs__link:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}

.breadcrumbs__sep {
  flex-shrink: 0;
}

.breadcrumbs__current {
  color: var(--text-secondary);
}

/* Toolbar */
.page__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
}

.page__save {
  font-size: var(--text-xs);
  color: var(--text-muted);
  min-height: 16px;
}

.page__save--saving {
  color: var(--accent-text);
}

.page__save--saved {
  color: var(--success);
}

.page__tools {
  display: flex;
  gap: var(--space-1);
}

.icon-btn {
  display: flex;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.icon-btn--favorite {
  color: var(--accent);
}

/* Overflow menu */
.menu-wrap {
  position: relative;
}

.menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-dropdown) - 1);
}

.menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  z-index: var(--z-dropdown);
  min-width: 190px;
  padding: var(--space-1);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
}

.menu__item:hover {
  background: var(--surface-hover);
}

.menu__item--danger {
  color: var(--danger);
}
.menu__item--danger:hover {
  background: var(--danger-soft);
}

/* Title */
.page__icon-row {
  margin-top: var(--space-2);
}

.page__icon {
  display: inline-flex;
  align-items: center;
  font-size: 40px;
  line-height: 1;
  color: var(--text-muted);
}

.page__title {
  width: 100%;
  border: none;
  background: none;
  outline: none;
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  line-height: var(--leading-tight);
  color: var(--text-primary);
  padding: var(--space-2) 0;
  margin-top: var(--space-1);
}

.page__title::placeholder {
  color: var(--text-muted);
}

.page__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.chip--muted {
  background: var(--bg-sunken);
  color: var(--text-muted);
}

.chip--due {
  background: var(--accent-soft);
  color: var(--accent-text);
  border: none;
  cursor: pointer;
  transition: filter 0.12s ease;
}

.chip--due:hover {
  filter: brightness(0.95);
}

.chip--overdue {
  background: var(--danger-soft);
  color: var(--danger);
}

.page__body {
  min-height: 200px;
}

/* Sub-pages */
.subpages {
  margin-top: var(--space-10);
  padding-top: var(--space-5);
  border-top: 1px solid var(--border);
}

.subpages__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.subpages__title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.subpages__list {
  padding-left: var(--space-2);
}

@media (max-width: 640px) {
  .page-view {
    padding: var(--space-4) var(--space-4) var(--space-12);
  }
  .page__title {
    font-size: var(--text-2xl);
  }
}
</style>
