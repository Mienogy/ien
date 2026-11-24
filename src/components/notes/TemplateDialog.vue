<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, LayoutTemplate, ListChecks, Trash2 } from 'lucide-vue-next'
import type { Page } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as templatesService from '@/services/supabase/templates'
import * as pagesService from '@/services/supabase/pages'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

/**
 * Template picker (Workflow §47 — templates): use a template to create a
 * page, open one to edit it, or delete it.
 */
const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{ close: [] }>()

const router = useRouter()
const auth = useAuthStore()
const toasts = useToasts()

const templates = ref<Page[]>([])
const loading = ref(false)
const busyId = ref<string | null>(null)
const deleteTarget = ref<Page | null>(null)
const deleting = ref(false)

async function load() {
  if (!auth.userId) return
  loading.value = true
  try {
    templates.value = await templatesService.listTemplates(auth.userId)
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load templates.')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) void load()
  },
)

async function useTemplate(template: Page) {
  if (!auth.userId || busyId.value) return
  busyId.value = template.id
  try {
    const page = await templatesService.instantiateTemplate(template, auth.userId)
    emit('close')
    router.push({ name: 'page', params: { pageId: page.id } })
    toasts.success('Page created from template — saved to your Inbox.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create page.')
  } finally {
    busyId.value = null
  }
}

function openTemplate(template: Page) {
  emit('close')
  router.push({ name: 'page', params: { pageId: template.id } })
}

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    const err = await pagesService.permanentlyDeletePage(deleteTarget.value.id, auth.userId ?? '')
    if (err) throw new Error(err)
    templates.value = templates.value.filter((t) => t.id !== deleteTarget.value?.id)
    deleteTarget.value = null
    toasts.success('Template deleted.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to delete template.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Templates"
    width="460px"
    @close="emit('close')"
  >
    <p class="tpl__hint">
      Pick a template to create a page from it — or open one to edit it.
    </p>

    <div
      v-if="loading"
      class="tpl__list"
    >
      <BaseSkeleton
        v-for="n in 3"
        :key="n"
        width="100%"
        height="44px"
      />
    </div>

    <div
      v-else-if="templates.length"
      class="tpl__list"
    >
      <div
        v-for="template in templates"
        :key="template.id"
        class="tpl__row"
      >
        <button
          class="tpl__main"
          :disabled="busyId === template.id"
          :title="`Use “${template.title}”`"
          @click="useTemplate(template)"
        >
          <span class="tpl__icon">
            <ListChecks
              v-if="template.type === 'checklist'"
              :size="15"
            />
            <FileText
              v-else
              :size="15"
            />
          </span>
          <span class="tpl__body">
            <span class="tpl__title truncate">{{ template.title || 'Untitled' }}</span>
            <span class="tpl__meta">
              {{ template.type === 'checklist' ? 'Checklist' : 'Page' }} ·
              {{ new Date(template.updated_at).toLocaleDateString() }}
            </span>
          </span>
          <span class="tpl__badge">Use</span>
        </button>
        <button
          class="tpl__action"
          :aria-label="`Open template ${template.title}`"
          title="Open to edit"
          @click="openTemplate(template)"
        >
          <LayoutTemplate :size="14" />
        </button>
        <button
          class="tpl__action tpl__action--danger"
          :aria-label="`Delete template ${template.title}`"
          title="Delete template"
          @click="deleteTarget = template"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <p
      v-else
      class="tpl__empty"
    >
      No templates yet. Open any page and choose
      <strong>Save as template</strong> from its ⋯ menu.
    </p>

    <template #footer>
      <BaseButton
        variant="ghost"
        @click="emit('close')"
      >
        Close
      </BaseButton>
    </template>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      :title="deleteTarget ? `Delete “${deleteTarget.title}”?` : ''"
      message="The template will be permanently removed. Pages created from it are not affected."
      confirm-label="Delete"
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </BaseModal>
</template>

<style scoped>
.tpl__hint {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
}

.tpl__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-height: 320px;
  overflow-y: auto;
}

.tpl__row {
  display: flex;
  align-items: stretch;
  gap: 2px;
  border-radius: var(--radius-md);
}

.tpl__row:hover {
  background: var(--surface-hover);
}

.tpl__main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
  padding: var(--space-2);
  text-align: left;
}

.tpl__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  background: var(--accent-soft);
  border-radius: var(--radius-sm);
  color: var(--accent-text);
}

.tpl__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.tpl__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.tpl__meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.tpl__badge {
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--accent-text);
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  padding: 2px var(--space-2);
}

.tpl__action {
  display: flex;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.tpl__action:hover {
  background: var(--surface-active);
  color: var(--text-primary);
}

.tpl__action--danger:hover {
  color: var(--danger);
}

.tpl__empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
  padding: var(--space-4) 0;
  line-height: var(--leading-relaxed);
}
</style>
