<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Check, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import type { ChecklistItem } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as checklistsService from '@/services/supabase/checklists'

const props = defineProps<{ pageId: string }>()

const auth = useAuthStore()
const toasts = useToasts()

const items = ref<ChecklistItem[]>([])
const loading = ref(true)
const draft = ref('')
const editingId = ref<string | null>(null)
const editText = ref('')

const doneCount = computed(() => items.value.filter((i) => i.is_done).length)

async function load() {
  loading.value = true
  try {
    items.value = await checklistsService.listItems(props.pageId, auth.userId ?? '')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load checklist.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.pageId, load)

async function addItem() {
  const text = draft.value.trim()
  if (!text) return
  try {
    const item = await checklistsService.addItem(
      props.pageId,
      auth.userId ?? '',
      text,
      items.value.length,
    )
    items.value.push(item)
    draft.value = ''
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to add item.')
  }
}

async function toggle(item: ChecklistItem) {
  const next = !item.is_done
  // Optimistic update for a snappy feel (Workflow §42).
  item.is_done = next
  const err = await checklistsService.updateItem(item.id, auth.userId ?? '', {
    is_done: next,
  })
  if (err) {
    item.is_done = !next
    toasts.error(err)
  }
}

function startEdit(item: ChecklistItem) {
  editingId.value = item.id
  editText.value = item.text
}

async function saveEdit(item: ChecklistItem) {
  const text = editText.value.trim()
  if (!text || text === item.text) {
    editingId.value = null
    return
  }
  const err = await checklistsService.updateItem(item.id, auth.userId ?? '', { text })
  if (err) {
    toasts.error(err)
    return
  }
  item.text = text
  editingId.value = null
}

async function remove(item: ChecklistItem) {
  const index = items.value.findIndex((i) => i.id === item.id)
  items.value.splice(index, 1)
  const err = await checklistsService.deleteItem(item.id, auth.userId ?? '')
  if (err) {
    items.value.splice(index, 0, item)
    toasts.error(err)
  }
}

function move(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.value.length) return
  const list = [...items.value]
  const [moved] = list.splice(index, 1)
  list.splice(target, 0, moved)
  items.value = list
  // Persist new positions.
  list.forEach((item, i) => {
    if (item.position !== i) {
      item.position = i
      void checklistsService.updateItem(item.id, auth.userId ?? '', { position: i })
    }
  })
}
</script>

<template>
  <div class="checklist">
    <div class="checklist__meta">
      <span class="checklist__count">{{ doneCount }} / {{ items.length }} done</span>
      <div
        class="checklist__progress"
        aria-hidden="true"
      >
        <div
          class="checklist__progress-bar"
          :style="{
            width: items.length ? `${(doneCount / items.length) * 100}%` : '0%',
          }"
        />
      </div>
    </div>

    <p
      v-if="loading"
      class="checklist__loading"
    >
      Loading checklist…
    </p>

    <ul
      v-else
      class="checklist__items"
    >
      <li
        v-for="(item, index) in items"
        :key="item.id"
        class="item"
        :class="{ 'item--done': item.is_done }"
      >
        <button
          class="item__check"
          :aria-label="item.is_done ? 'Mark as not done' : 'Mark as done'"
          :aria-pressed="item.is_done"
          @click="toggle(item)"
        >
          <Check
            v-if="item.is_done"
            :size="13"
          />
        </button>

        <template v-if="editingId === item.id">
          <input
            v-model="editText"
            class="item__edit-input"
            aria-label="Edit checklist item"
            autofocus
            @keyup.enter="saveEdit(item)"
            @keyup.escape="editingId = null"
            @blur="saveEdit(item)"
          >
        </template>
        <span
          v-else
          class="item__text"
          @dblclick="startEdit(item)"
        >
          {{ item.text }}
        </span>

        <span class="item__actions">
          <button
            class="item__action"
            aria-label="Move up"
            :disabled="index === 0"
            @click="move(index, -1)"
          >
            <ChevronUp :size="13" />
          </button>
          <button
            class="item__action"
            aria-label="Move down"
            :disabled="index === items.length - 1"
            @click="move(index, 1)"
          >
            <ChevronDown :size="13" />
          </button>
          <button
            class="item__action"
            aria-label="Edit item"
            @click="startEdit(item)"
          >
            <Pencil :size="13" />
          </button>
          <button
            class="item__action item__action--danger"
            aria-label="Delete item"
            @click="remove(item)"
          >
            <Trash2 :size="13" />
          </button>
        </span>
      </li>
    </ul>

    <form
      class="checklist__add"
      @submit.prevent="addItem"
    >
      <Plus
        :size="15"
        class="checklist__add-icon"
      />
      <input
        v-model="draft"
        class="checklist__add-input"
        placeholder="Add an item…"
        aria-label="Add checklist item"
      >
    </form>
  </div>
</template>

<style scoped>
.checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checklist__meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.checklist__count {
  font-size: var(--text-xs);
  color: var(--text-muted);
  white-space: nowrap;
}

.checklist__progress {
  flex: 1;
  height: 4px;
  background: var(--bg-sunken);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.checklist__progress-bar {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: width 0.25s ease;
}

.checklist__loading {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.checklist__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
}

.item:hover {
  background: var(--surface-hover);
  border-color: var(--border);
}

.item__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: transparent;
  flex-shrink: 0;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease;
}

.item__check:hover {
  border-color: var(--accent);
}

.item--done .item__check {
  background: var(--accent);
  border-color: var(--accent);
  color: #202124;
}

.item__text {
  flex: 1;
  min-width: 0;
  font-size: var(--text-base);
}

.item--done .item__text {
  color: var(--text-muted);
  text-decoration: line-through;
}

.item__edit-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: none;
  font-size: var(--text-base);
  color: var(--text-primary);
  outline: none;
  border-bottom: 1px solid var(--accent);
}

.item__actions {
  display: none;
  gap: 2px;
}

.item:hover .item__actions {
  display: flex;
}

.item__action {
  display: flex;
  padding: 3px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.item__action:hover:not(:disabled) {
  background: var(--surface-active);
  color: var(--text-primary);
}

.item__action:disabled {
  opacity: 0.3;
}

.item__action--danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}

.checklist__add {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
}

.checklist__add:focus-within {
  border-color: var(--accent);
  border-style: solid;
}

.checklist__add-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.checklist__add-input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: var(--text-base);
  color: var(--text-primary);
}

.checklist__add-input::placeholder {
  color: var(--text-muted);
}
</style>
