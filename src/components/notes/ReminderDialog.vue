<script setup lang="ts">
import { ref, watch } from 'vue'
import { Bell, Trash2 } from 'lucide-vue-next'
import type { Page, Reminder } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as remindersService from '@/services/supabase/reminders'
import { defaultDueValue, formatDue, toLocalInputValue } from '@/lib/datetime'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

/**
 * Set/change/remove the reminder for one page (Workflow §47 — reminders).
 */
const props = defineProps<{
  open: boolean
  page: Page | null
}>()

const emit = defineEmits<{
  close: []
  /** The active reminder after a change (null when removed). */
  changed: [reminder: Reminder | null]
}>()

const auth = useAuthStore()
const toasts = useToasts()

const existing = ref<Reminder | null>(null)
const dueValue = ref(defaultDueValue())
const loading = ref(false)
const busy = ref(false)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen || !props.page) return
    loading.value = true
    try {
      existing.value = await remindersService.getForPage(props.page.id, auth.userId ?? '')
      dueValue.value = existing.value
        ? toLocalInputValue(new Date(existing.value.due_at))
        : defaultDueValue()
    } catch (e) {
      toasts.error(e instanceof Error ? e.message : 'Failed to load reminder.')
    } finally {
      loading.value = false
    }
  },
)

async function save() {
  if (!props.page || busy.value) return
  const dueAt = new Date(dueValue.value)
  if (Number.isNaN(dueAt.getTime())) {
    toasts.error('Pick a valid date and time.')
    return
  }
  busy.value = true
  try {
    let reminder: Reminder
    if (existing.value) {
      const err = await remindersService.setDueAt(
        existing.value.id,
        auth.userId ?? '',
        dueAt.toISOString(),
      )
      if (err) throw new Error(err)
      reminder = { ...existing.value, due_at: dueAt.toISOString() }
    } else {
      reminder = await remindersService.createReminder(
        props.page.id,
        auth.userId ?? '',
        dueAt.toISOString(),
      )
    }
    existing.value = reminder
    emit('changed', reminder)
    emit('close')
    toasts.success(`Reminder set — ${formatDue(reminder.due_at)}.`)
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to save reminder.')
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!existing.value || busy.value) return
  busy.value = true
  try {
    const err = await remindersService.deleteReminder(existing.value.id, auth.userId ?? '')
    if (err) throw new Error(err)
    existing.value = null
    emit('changed', null)
    emit('close')
    toasts.success('Reminder removed.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to remove reminder.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Set reminder"
    width="420px"
    @close="emit('close')"
  >
    <div class="rem">
      <p class="rem__hint">
        <Bell
          :size="14"
          class="rem__hint-icon"
        />
        Get a due date on this page — find it any time under Reminders in the
        sidebar.
      </p>

      <label
        class="rem__label"
        for="reminder-due"
      >
        Remind me at
      </label>
      <input
        id="reminder-due"
        v-model="dueValue"
        class="rem__input"
        type="datetime-local"
        :disabled="loading || busy"
      >

      <p
        v-if="existing"
        class="rem__current"
      >
        Current: {{ formatDue(existing.due_at) }}
      </p>
    </div>

    <template #footer>
      <BaseButton
        v-if="existing"
        variant="ghost"
        :loading="busy"
        @click="remove"
      >
        <Trash2 :size="14" /> Remove
      </BaseButton>
      <BaseButton
        variant="ghost"
        @click="emit('close')"
      >
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        :loading="busy"
        @click="save"
      >
        Save reminder
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.rem {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.rem__hint {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
  margin-bottom: var(--space-2);
}

.rem__hint-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--accent-text);
}

.rem__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.rem__input {
  height: 38px;
  padding: 0 var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
}

.rem__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.rem__current {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
