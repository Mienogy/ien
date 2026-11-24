<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const router = useRouter()
const auth = useAuthStore()
const toasts = useToasts()

const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const checking = ref(true)

onMounted(async () => {
  // The recovery link lands here with a code in the URL; Supabase's
  // detectSessionInUrl exchanges it for a session automatically.
  await auth.init()
  checking.value = false
  if (!auth.isAuthenticated) {
    error.value = 'This recovery link is invalid or has expired. Please request a new one.'
  }
})

async function submit() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  const result = await auth.resetPassword(password.value)
  loading.value = false
  if (result.error) {
    error.value = result.error
    return
  }
  toasts.success('Password changed — you are signed in')
  router.push({ name: 'home' })
}
</script>

<template>
  <AuthCard
    title="Choose a new password"
    subtitle="Set a new password for your account."
  >
    <p
      v-if="checking"
      class="checking"
    >
      Checking your link…
    </p>

    <form
      v-else
      class="form"
      @submit.prevent="submit"
    >
      <BaseInput
        v-model="password"
        label="New password"
        type="password"
        placeholder="At least 8 characters"
        autocomplete="new-password"
        required
      />
      <BaseInput
        v-model="confirm"
        label="Confirm new password"
        type="password"
        placeholder="Repeat the password"
        autocomplete="new-password"
        required
      />
      <p
        v-if="error"
        class="form__error"
        role="alert"
      >
        {{ error }}
      </p>
      <BaseButton
        type="submit"
        variant="primary"
        block
        :loading="loading"
      >
        Set new password
      </BaseButton>
    </form>

    <p class="auth__link-line">
      <RouterLink
        :to="{ name: 'login' }"
        class="auth__link"
      >Back to sign in</RouterLink>
    </p>
  </AuthCard>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checking {
  font-size: var(--text-sm);
  color: var(--text-muted);
  padding: var(--space-4) 0;
}

.form__error {
  font-size: var(--text-sm);
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}

.auth__link-line {
  text-align: center;
  margin-top: var(--space-5);
  font-size: var(--text-sm);
}

.auth__link {
  color: var(--accent-text);
  font-weight: var(--weight-medium);
}
.auth__link:hover {
  text-decoration: underline;
}
</style>
