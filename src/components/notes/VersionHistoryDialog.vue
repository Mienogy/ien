<script setup lang="ts">
import { ref, watch } from 'vue'
import { History, RotateCcw } from 'lucide-vue-next'
import type { Page, Revision } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as revisionsService from '@/services/supabase/revisions'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

/**
 * Version history viewer (Workflow §47 — version history).
 * Lists snapshots of the current page; restoring snapshots the present
 * first, so every restore can itself be undone.
 */
const props = defineProps<{
  open: boolean
  page: Page | null
}>()

const emit = defineEmits<{
  close: []
  /** Fired after a successful restore so the parent can reload the page. */
  restored: []
}>()

const auth = useAuthStore()
const toasts = useToasts()

const revisions = ref<Revision[]>([])
const loading = ref(false)
const restoreTarget = ref<Revision | null>(null)
const restoring = ref(false)

async function load() {
  if (!props.page || !auth.userId) return
  loading.value = true
  try {
    revisions.value = await revisionsService.listRevisions(props.page.id, auth.userId)
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load history.')
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

async function confirmRestore() {
  if (!restoreTarget.value || !props.page || restoring.value) return
  restoring.value = true
  try {
    const err = await revisionsService.restoreRevision(
      restoreTarget.value,
      props.page,
      auth.userId ?? '',
    )
    if (err) throw new Error(err)
    restoreTarget.value = null
    emit('restored')
    toasts.success('Version restored.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to restore version.')
  } finally {
    restoring.value = false
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  return sameDay
    ? `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Version history"
    width="480px"
    @close="emit('close')"
  >
    <p class="hist__hint">
      Snapshots are taken automatically while you edit (up to 50 kept per page).
      Restoring saves your current version first.
    </p>

    <div
      v-if="loading"
      class="hist__list"
    >
      <BaseSkeleton
        v-for="n in 3"
        :key="n"
        width="100%"
        height="44px"
      />
    </div>

    <div
      v-else-if="revisions.length"
      class="hist__list"
    >
      <div
        v-for="revision in revisions"
        :key="revision.id"
        class="hist__row"
      >
        <span class="hist__icon">
          <History :size="14" />
        </span>
        <span class="hist__body">
          <span class="hist__title truncate">{{ revision.title || 'Untitled' }}</span>
          <span class="hist__when">{{ formatWhen(revision.created_at) }}</span>
        </span>
        <button
          class="hist__restore"
          :aria-label="`Restore version from ${formatWhen(revision.created_at)}`"
          @click="restoreTarget = revision"
        >
          <RotateCcw :size="13" />
          Restore
        </button>
      </div>
    </div>

    <p
      v-else
      class="hist__empty"
    >
      No versions yet — snapshots appear automatically as you edit.
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
      :open="Boolean(restoreTarget)"
      :title="restoreTarget ? `Restore “${restoreTarget.title}” from ${formatWhen(restoreTarget.created_at)}?` : ''"
      message="Your current content will be replaced. A snapshot of the current state is saved first, so this can be undone."
      confirm-label="Restore"
      :loading="restoring"
      @close="restoreTarget = null"
      @confirm="confirmRestore"
    />
  </BaseModal>
</template>

<style scoped>
.hist__hint {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  line-height: var(--leading-relaxed);
}

.hist__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  max-height: 320px;
  overflow-y: auto;
}

.hist__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
}

.hist__row:hover {
  background: var(--surface-hover);
}

.hist__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: var(--bg-sunken);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}

.hist__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hist__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.hist__when {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.hist__restore {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  height: 26px;
  padding: 0 var(--space-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  transition:
    border-color 0.12s ease,
    color 0.12s ease;
}

.hist__restore:hover {
  border-color: var(--accent);
  color: var(--accent-text);
}

.hist__empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
  padding: var(--space-4) 0;
}
</style>
