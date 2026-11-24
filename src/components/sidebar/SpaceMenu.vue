<script setup lang="ts">
import { ref } from 'vue'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-vue-next'
import type { Space } from '@/types/models'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const props = defineProps<{ space: Space }>()

const content = useContentStore()
const toasts = useToasts()

const menuOpen = ref(false)
const renameOpen = ref(false)
const deleteOpen = ref(false)
const draftName = ref('')
const busy = ref(false)
const error = ref('')

async function submitRename() {
  if (!draftName.value.trim()) {
    error.value = 'Name cannot be empty.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await content.renameSpace(props.space.id, draftName.value)
    renameOpen.value = false
    toasts.success('Space renamed')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to rename space.'
  } finally {
    busy.value = false
  }
}

async function confirmDelete() {
  busy.value = true
  try {
    await content.deleteSpace(props.space.id)
    deleteOpen.value = false
    toasts.success('Space deleted')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to delete space.')
  } finally {
    busy.value = false
  }
}

function openRename() {
  menuOpen.value = false
  draftName.value = props.space.name
  error.value = ''
  renameOpen.value = true
}

function openDelete() {
  menuOpen.value = false
  deleteOpen.value = true
}
</script>

<template>
  <div
    class="menu-wrap"
    @click.stop
  >
    <button
      class="menu-trigger"
      :aria-expanded="menuOpen"
      aria-label="Space actions"
      @click="menuOpen = !menuOpen"
    >
      <MoreHorizontal :size="14" />
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
        @click="openRename"
      >
        <Pencil :size="14" /> Rename
      </button>
      <button
        class="menu__item menu__item--danger"
        role="menuitem"
        @click="openDelete"
      >
        <Trash2 :size="14" /> Delete
      </button>
    </div>

    <BaseModal
      :open="renameOpen"
      title="Rename space"
      @close="renameOpen = false"
    >
      <BaseInput
        v-model="draftName"
        label="Space name"
        placeholder="e.g. Work"
        :error="error"
        data-autofocus
        @keyup.enter="submitRename"
      />
      <template #footer>
        <BaseButton
          variant="ghost"
          @click="renameOpen = false"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="busy"
          @click="submitRename"
        >
          Save
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="deleteOpen"
      :title="`Delete \u201C${space.name}\u201D?`"
      message="Pages inside this space will be kept but will no longer belong to a space. This cannot be undone."
      confirm-label="Delete"
      :loading="busy"
      @close="deleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.menu-trigger {
  display: flex;
  padding: 3px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  opacity: 0;
  transition: opacity 0.12s ease;
}

.menu-wrap:hover .menu-trigger,
.menu-trigger[aria-expanded='true'] {
  opacity: 1;
}

.menu-trigger:hover {
  background: var(--surface-active);
  color: var(--text-primary);
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
  min-width: 150px;
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
</style>
