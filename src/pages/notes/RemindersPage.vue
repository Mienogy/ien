<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Bell, Check, Clock, Trash2 } from 'lucide-vue-next'
import type { ReminderWithPage } from '@/services/supabase/reminders'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as remindersService from '@/services/supabase/reminders'
import { formatDue, isOverdue } from '@/lib/datetime'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

/**
 * Reminders view (Workflow §47 — reminders): every upcoming due date,
 * most urgent first, with one-tap completion.
 */
const auth = useAuthStore()
const toasts = useToasts()

const loading = ref(true)
const reminders = ref<ReminderWithPage[]>([])
const busyId = ref<string | null>(null)

const overdue = computed(() => reminders.value.filter((r) => isOverdue(r.due_at)))
const upcoming = computed(() => reminders.value.filter((r) => !isOverdue(r.due_at)))

function pageTitle(reminder: ReminderWithPage): string {
  // Defensive: tolerate the embed arriving as a single object or a 1-item array.
  const page = Array.isArray(reminder.page) ? reminder.page[0] : reminder.page
  return page?.title || 'Untitled'
}

async function load() {
  if (!auth.userId) return
  loading.value = true
  try {
    reminders.value = await remindersService.listUpcoming(auth.userId)
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load reminders.')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function complete(reminder: ReminderWithPage) {
  busyId.value = reminder.id
  try {
    const err = await remindersService.completeReminder(reminder.id, auth.userId ?? '')
    if (err) throw new Error(err)
    reminders.value = reminders.value.filter((r) => r.id !== reminder.id)
    toasts.success('Reminder done.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to update reminder.')
  } finally {
    busyId.value = null
  }
}

async function remove(reminder: ReminderWithPage) {
  busyId.value = reminder.id
  try {
    const err = await remindersService.deleteReminder(reminder.id, auth.userId ?? '')
    if (err) throw new Error(err)
    reminders.value = reminders.value.filter((r) => r.id !== reminder.id)
    toasts.success('Reminder deleted.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to delete reminder.')
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <div class="reminders fade-in">
    <header class="reminders__header">
      <h1 class="reminders__title">
        Reminders
      </h1>
      <p class="reminders__sub">
        Due dates you've set on pages — set one from any page's ⋯ menu.
      </p>
    </header>

    <div
      v-if="loading"
      class="reminders__list"
    >
      <BaseSkeleton
        v-for="n in 3"
        :key="n"
        width="100%"
        height="56px"
      />
    </div>

    <template v-else-if="reminders.length">
      <section
        v-if="overdue.length"
        class="reminders__group"
        aria-label="Overdue"
      >
        <h2 class="reminders__group-title reminders__group-title--overdue">
          Overdue
        </h2>
        <ul class="reminders__list">
          <li
            v-for="reminder in overdue"
            :key="reminder.id"
            class="reminder reminder--overdue"
          >
            <span class="reminder__icon reminder__icon--overdue">
              <Clock :size="15" />
            </span>
            <RouterLink
              :to="{ name: 'page', params: { pageId: reminder.page_id } }"
              class="reminder__body"
            >
              <span class="reminder__title truncate">{{ pageTitle(reminder) }}</span>
              <span class="reminder__due">{{ formatDue(reminder.due_at) }}</span>
            </RouterLink>
            <button
              class="reminder__action"
              :aria-label="'Mark reminder done'"
              :disabled="busyId === reminder.id"
              @click="complete(reminder)"
            >
              <Check :size="15" />
            </button>
            <button
              class="reminder__action reminder__action--danger"
              aria-label="Delete reminder"
              :disabled="busyId === reminder.id"
              @click="remove(reminder)"
            >
              <Trash2 :size="14" />
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="upcoming.length"
        class="reminders__group"
        aria-label="Upcoming"
      >
        <h2 class="reminders__group-title">
          Upcoming
        </h2>
        <ul class="reminders__list">
          <li
            v-for="reminder in upcoming"
            :key="reminder.id"
            class="reminder"
          >
            <span class="reminder__icon">
              <Bell :size="15" />
            </span>
            <RouterLink
              :to="{ name: 'page', params: { pageId: reminder.page_id } }"
              class="reminder__body"
            >
              <span class="reminder__title truncate">{{ pageTitle(reminder) }}</span>
              <span class="reminder__due">{{ formatDue(reminder.due_at) }}</span>
            </RouterLink>
            <button
              class="reminder__action"
              aria-label="Mark reminder done"
              :disabled="busyId === reminder.id"
              @click="complete(reminder)"
            >
              <Check :size="15" />
            </button>
            <button
              class="reminder__action reminder__action--danger"
              aria-label="Delete reminder"
              :disabled="busyId === reminder.id"
              @click="remove(reminder)"
            >
              <Trash2 :size="14" />
            </button>
          </li>
        </ul>
      </section>
    </template>

    <EmptyState
      v-else
      :icon="Bell"
      title="No reminders"
      description="Open a page, open its ⋯ menu, and choose “Set reminder…” to give it a due date."
    >
      <template #action>
        <BaseButton
          variant="secondary"
          @click="$router.push({ name: 'home' })"
        >
          Back to Home
        </BaseButton>
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.reminders {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
}

.reminders__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.reminders__sub {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
  margin-bottom: var(--space-6);
}

.reminders__group {
  margin-bottom: var(--space-6);
}

.reminders__group-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}

.reminders__group-title--overdue {
  color: var(--danger);
}

.reminders__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
}

.reminder {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: border-color 0.12s ease;
}

.reminder:hover {
  border-color: var(--border-strong);
}

.reminder--overdue {
  border-color: var(--danger-soft);
}

.reminder__icon {
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

.reminder__icon--overdue {
  background: var(--danger-soft);
  color: var(--danger);
}

.reminder__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.reminder__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.reminder__title:hover {
  color: var(--accent-text);
}

.reminder__due {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.reminder--overdue .reminder__due {
  color: var(--danger);
}

.reminder__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.reminder__action:hover:not(:disabled) {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.reminder__action:disabled {
  opacity: 0.5;
}

.reminder__action--danger:hover:not(:disabled) {
  color: var(--danger);
}
</style>
