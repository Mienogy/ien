<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Archive, RotateCcw, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { PageSummary } from '@/types/models'
import * as pagesService from '@/services/supabase/pages'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
const toasts = useToasts()

const pages = ref<PageSummary[]>([])
const loading = ref(true)
const deleteTarget = ref<PageSummary | null>(null)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    pages.value = await pagesService.listArchived(auth.userId ?? '')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load archive.')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function restore(page: PageSummary) {
  const err = await pagesService.updatePage(page.id, auth.userId ?? '', { is_archived: false })
  if (err) {
    toasts.error(err)
    return
  }
  toasts.success('Page restored')
  await load()
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  const err = await pagesService.permanentlyDeletePage(deleteTarget.value.id, auth.userId ?? '')
  deleting.value = false
  if (err) {
    toasts.error(err)
    return
  }
  toasts.success('Page permanently deleted')
  deleteTarget.value = null
  await load()
}
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <h1 class="view__title">
        Archive
      </h1>
      <p class="view__subtitle">
        Archived pages are hidden from normal listings.
      </p>
    </header>

    <div
      v-if="loading"
      class="loading"
    >
      <BaseSkeleton height="58px" />
      <BaseSkeleton height="58px" />
    </div>

    <EmptyState
      v-else-if="pages.length === 0"
      :icon="Archive"
      title="Archive is empty"
      description="Pages you archive are kept here until you restore or delete them."
    />

    <div
      v-else
      class="archive-list"
    >
      <div
        v-for="page in pages"
        :key="page.id"
        class="archive-item"
      >
        <div
          class="archive-item__main"
          @click="router.push({ name: 'page', params: { pageId: page.id } })"
        >
          <span
            v-if="page.icon"
            class="archive-item__icon"
          >{{ page.icon }}</span>
          <Archive
            v-else
            :size="16"
            class="archive-item__glyph"
          />
          <div class="archive-item__body">
            <span class="archive-item__title truncate">{{ page.title || 'Untitled' }}</span>
            <span class="archive-item__meta">
              Archived · {{ new Date(page.updated_at).toLocaleDateString() }}
            </span>
          </div>
        </div>
        <div class="archive-item__actions">
          <button
            class="icon-btn"
            title="Restore"
            aria-label="Restore page"
            @click="restore(page)"
          >
            <RotateCcw :size="15" />
          </button>
          <button
            class="icon-btn icon-btn--danger"
            title="Delete permanently"
            aria-label="Delete permanently"
            @click="deleteTarget = page"
          >
            <Trash2 :size="15" />
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="deleteTarget !== null"
      :title="`Delete \u201C${deleteTarget?.title || 'Untitled'}\u201D?`"
      message="This permanently removes the page and all of its content. This action cannot be undone."
      confirm-label="Delete forever"
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
}

.view__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.view__subtitle {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.archive-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.archive-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.archive-item:hover {
  border-color: var(--border-strong);
}

.archive-item__main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  cursor: pointer;
}

.archive-item__icon {
  font-size: var(--text-md);
  line-height: 1;
}

.archive-item__glyph {
  color: var(--text-muted);
  flex-shrink: 0;
}

.archive-item__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.archive-item__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.archive-item__meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.archive-item__actions {
  display: flex;
  gap: var(--space-1);
}

.icon-btn {
  display: flex;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.icon-btn:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.icon-btn--danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
</style>
