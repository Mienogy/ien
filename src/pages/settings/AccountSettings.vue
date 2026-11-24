<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import { changeEmail, deleteAccount as deleteAccountService } from '@/services/supabase/auth'
import { exportWorkspace, importWorkspace } from '@/services/supabase/transfer'
import { downloadJson } from '@/lib/download'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const content = useContentStore()
const toasts = useToasts()

const email = ref(auth.email ?? '')
const emailError = ref('')
const emailBusy = ref(false)

const deleteOpen = ref(false)
const deleting = ref(false)

const exporting = ref(false)
const importing = ref(false)
const importInput = ref<HTMLInputElement | null>(null)

// Account creation information (Workflow §17).
const memberSince = computed(() => {
  const created = content.profile?.created_at
  if (!created) return ''
  return new Date(created).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function saveEmail() {
  emailError.value = ''
  if (!email.value.trim()) {
    emailError.value = 'Email cannot be empty.'
    return
  }
  emailBusy.value = true
  const result = await changeEmail(email.value)
  emailBusy.value = false
  if (result.error) {
    emailError.value = result.error
    return
  }
  toasts.success('Confirmation email sent — check your inbox to confirm the change.')
}

async function deleteAccount() {
  if (deleting.value) return
  deleting.value = true
  try {
    const err = await deleteAccountService(auth.userId ?? '')
    if (err) throw new Error(err)
    deleteOpen.value = false
    // Session died with the user row — clear local state and leave.
    await auth.logout()
    router.push({ name: 'login' })
    toasts.success('Your account has been deleted.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to delete account.')
  } finally {
    deleting.value = false
  }
}

async function signOut() {
  await auth.logout()
  router.push({ name: 'login' })
}

async function exportData() {
  exporting.value = true
  try {
    const data = await exportWorkspace(auth.userId ?? '')
    const date = new Date().toISOString().slice(0, 10)
    downloadJson(`ien-export-${date}.json`, data)
    toasts.success('Workspace exported.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Export failed.')
  } finally {
    exporting.value = false
  }
}

function openImport() {
  importInput.value?.click()
}

async function importData(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  importing.value = true
  try {
    const raw: unknown = JSON.parse(await file.text())
    const summary = await importWorkspace(auth.userId ?? '', raw)
    // Refresh shared workspace data so the sidebar shows the import.
    await Promise.all([
      content.loadSpaces(),
      content.loadCategories(),
      content.loadFavorites(),
      content.loadRecents(),
    ])
    toasts.success(
      `Imported ${summary.pages} page${summary.pages === 1 ? '' : 's'}, ` +
        `${summary.spaces} space${summary.spaces === 1 ? '' : 's'}, ` +
        `${summary.checklistItems} checklist item${summary.checklistItems === 1 ? '' : 's'}.`,
    )
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Import failed.')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div>
    <!-- Account info -->
    <p
      v-if="memberSince"
      class="member-since"
    >
      Member since {{ memberSince }}
    </p>

    <!-- Email -->
    <section class="section">
      <h2 class="section__title">
        Email address
      </h2>
      <p class="section__description">
        Your email is the unique identifier for your account. Supabase sends a confirmation
        link when it changes.
      </p>

      <form
        class="form"
        @submit.prevent="saveEmail"
      >
        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          :error="emailError"
          required
        />
        <div class="form__actions">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="emailBusy"
          >
            Update email
          </BaseButton>
        </div>
      </form>
    </section>

    <!-- Session -->
    <section class="section">
      <h2 class="section__title">
        Session
      </h2>
      <p class="section__description">
        Sign out of Ien on this device.
      </p>
      <BaseButton
        variant="secondary"
        @click="signOut"
      >
        Sign out
      </BaseButton>
    </section>

    <!-- Your data -->
    <section class="section">
      <h2 class="section__title">
        Your data
      </h2>
      <p class="section__description">
        Export every space, page, checklist, and category as a JSON file — or restore
        your workspace from a previous export. Imports are added alongside your
        existing data.
      </p>
      <div class="data-actions">
        <BaseButton
          variant="secondary"
          :loading="exporting"
          @click="exportData"
        >
          Export JSON
        </BaseButton>
        <BaseButton
          variant="secondary"
          :loading="importing"
          @click="openImport"
        >
          Import JSON
        </BaseButton>
        <input
          ref="importInput"
          class="data-actions__file"
          type="file"
          accept="application/json,.json"
          tabindex="-1"
          aria-hidden="true"
          @change="importData"
        >
      </div>
    </section>

    <!-- Danger zone -->
    <section class="section section--danger">
      <h2 class="section__title">
        Delete account
      </h2>
      <p class="section__description">
        Permanently remove your account and all data (spaces, pages, checklists). This cannot
        be undone.
      </p>
      <BaseButton
        variant="danger"
        @click="deleteOpen = true"
      >
        Delete account
      </BaseButton>
    </section>

    <ConfirmDialog
      :open="deleteOpen"
      title="Delete your account?"
      message="All of your spaces, pages, and checklists will be permanently removed. This action cannot be undone."
      confirm-label="Delete account"
      :loading="deleting"
      @close="deleteOpen = false"
      @confirm="deleteAccount"
    />
  </div>
</template>

<style scoped>
.member-since {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-5);
}

.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.data-actions__file {
  display: none;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form__actions {
  display: flex;
  justify-content: flex-end;
}

.section--danger {
  border-color: var(--danger);
}

.section--danger .section__title {
  color: var(--danger);
}
</style>
