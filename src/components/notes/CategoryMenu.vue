<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, ChevronDown, Hash, Plus, Trash2 } from 'lucide-vue-next'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

/**
 * Category picker for a page (Workflow §13): assign/unassign, create,
 * and delete — all from the page's meta chip row.
 */
const props = defineProps<{
  categoryId: string | null
}>()

const emit = defineEmits<{
  /** Emitted when the user picks, clears, or creates a category. */
  assign: [categoryId: string | null]
}>()

const content = useContentStore()
const toasts = useToasts()

const open = ref(false)
const newName = ref('')
const creating = ref(false)
const deleteTarget = ref<{ id: string; name: string } | null>(null)
const deleting = ref(false)

// Stored category colors are data (like emoji), not UI chrome — a small
// fixed palette keeps new labels calm and on-brand.
const PALETTE = ['#e8b84a', '#5c9e52', '#4a8fd4', '#a06bc4', '#d46a6a', '#3fa8a0']

const current = computed(() =>
  props.categoryId ? content.categoryMap[props.categoryId] : undefined,
)
const label = computed(() => current.value?.name ?? 'Category')

function toggle(categoryId: string) {
  emit('assign', props.categoryId === categoryId ? null : categoryId)
  open.value = false
}

async function create() {
  const name = newName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  try {
    const color = PALETTE[content.categories.length % PALETTE.length]
    const category = await content.createCategory(name, color)
    newName.value = ''
    // Creating from a page immediately labels that page.
    emit('assign', category.id)
    open.value = false
    toasts.success('Category created')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create category.')
  } finally {
    creating.value = false
  }
}

async function confirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  try {
    const id = deleteTarget.value.id
    await content.deleteCategory(id)
    if (props.categoryId === id) emit('assign', null)
    deleteTarget.value = null
    toasts.success('Category deleted')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to delete category.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div
    class="catmenu"
    @click.stop
  >
    <button
      class="catmenu__trigger"
      :class="{ 'catmenu__trigger--set': Boolean(current) }"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="open = !open"
    >
      <Hash :size="12" />
      <span class="catmenu__label truncate">{{ label }}</span>
      <ChevronDown
        :size="11"
        class="catmenu__caret"
        :class="{ 'catmenu__caret--open': open }"
      />
    </button>

    <div
      v-if="open"
      class="catmenu__backdrop"
      @click="open = false"
    />
    <div
      v-if="open"
      class="catmenu__menu"
      role="menu"
      aria-label="Categories"
    >
      <div class="catmenu__list">
        <div
          v-for="c in content.categories"
          :key="c.id"
          class="catmenu__row"
          role="menuitem"
        >
          <button
            class="catmenu__item"
            :title="c.name"
            @click="toggle(c.id)"
          >
            <span
              class="catmenu__dot"
              :style="{ background: c.color || 'var(--text-muted)' }"
              aria-hidden="true"
            />
            <span class="catmenu__name truncate">{{ c.name }}</span>
            <Check
              v-if="c.id === categoryId"
              :size="14"
              class="catmenu__check"
            />
          </button>
          <button
            class="catmenu__delete"
            :aria-label="`Delete category ${c.name}`"
            @click.stop="deleteTarget = { id: c.id, name: c.name }"
          >
            <Trash2 :size="13" />
          </button>
        </div>
        <p
          v-if="!content.categories.length"
          class="catmenu__empty"
        >
          No categories yet — create one below.
        </p>
      </div>

      <form
        class="catmenu__create"
        @submit.prevent="create"
      >
        <input
          v-model="newName"
          class="catmenu__input"
          type="text"
          maxlength="60"
          placeholder="New category…"
          aria-label="New category name"
        >
        <button
          type="submit"
          class="catmenu__add"
          :disabled="creating || !newName.trim()"
          aria-label="Create category"
        >
          <Plus :size="14" />
        </button>
      </form>
    </div>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      :title="deleteTarget ? `Delete “${deleteTarget.name}”?` : ''"
      message="Pages keep their content — they'll just lose this category label."
      confirm-label="Delete"
      :loading="deleting"
      @close="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped>
.catmenu {
  position: relative;
  display: inline-flex;
}

.catmenu__trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 24px;
  max-width: 180px;
  padding: 0 var(--space-2);
  background: var(--accent-soft);
  border: 1px solid transparent;
  border-radius: var(--radius-full);
  color: var(--accent-text);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}

.catmenu__trigger:hover {
  border-color: var(--accent);
}

.catmenu__trigger--set {
  background: var(--accent-soft);
}

.catmenu__trigger:not(.catmenu__trigger--set) {
  background: transparent;
  border-color: var(--border);
  color: var(--text-muted);
}

.catmenu__trigger:not(.catmenu__trigger--set):hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}

.catmenu__label {
  min-width: 0;
}

.catmenu__caret {
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.catmenu__caret--open {
  transform: rotate(180deg);
}

.catmenu__backdrop {
  position: fixed;
  inset: 0;
  z-index: calc(var(--z-dropdown) - 1);
}

.catmenu__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: var(--z-dropdown);
  width: 240px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  animation: fade-in 0.12s ease-out;
}

.catmenu__list {
  max-height: 220px;
  overflow-y: auto;
  padding: var(--space-1);
}

.catmenu__row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: var(--radius-sm);
}

.catmenu__row:hover {
  background: var(--surface-hover);
}

.catmenu__row:hover .catmenu__delete {
  opacity: 1;
}

.catmenu__item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-1) var(--space-2);
  text-align: left;
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.catmenu__dot {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  border-radius: var(--radius-full);
}

.catmenu__name {
  flex: 1;
  min-width: 0;
}

.catmenu__check {
  flex-shrink: 0;
  color: var(--accent-text);
}

.catmenu__delete {
  display: flex;
  padding: var(--space-1);
  margin-right: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  opacity: 0;
  transition:
    opacity 0.12s ease,
    color 0.12s ease;
}

.catmenu__delete:hover {
  color: var(--danger);
}

.catmenu__empty {
  padding: var(--space-3) var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.catmenu__create {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2);
  border-top: 1px solid var(--border);
}

.catmenu__input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 var(--space-2);
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-sm);
}

.catmenu__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--accent-soft);
}

.catmenu__add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  color: #202124;
}

.catmenu__add:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
