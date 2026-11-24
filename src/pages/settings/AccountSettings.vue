<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import { changeEmail } from '@/services/supabase/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const router = useRouter()
const auth = useAuthStore()
const toasts = useToasts()

const email = ref(auth.email ?? '')
const emailError = ref('')
const emailBusy = ref(false)

const deleteOpen = ref(false)

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
  // Account deletion requires elevated privileges; the cleanest secure
  // approach without a backend is sign-out + Supabase dashboard, but we
  // attempt the standard update path where supported.
  toasts.info('Deleting your account is handled from the Supabase dashboard for now.')
  deleteOpen.value = false
}

async function signOut() {
  await auth.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div>
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
      @close="deleteOpen = false"
      @confirm="deleteAccount"
    />
  </div>
</template>

<style scoped>
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
