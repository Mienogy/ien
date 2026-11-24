<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { KeyRound } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import { mapAuthError, useFormField } from '@/lib/validation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const router = useRouter()
const auth = useAuthStore()
const toasts = useToasts()

const { handleSubmit } = useForm()

const {
  value: password,
  errorMessage: passwordError,
  onBlur: passwordBlur,
  setErrors: setPasswordError,
} = useFormField('password', 'required|min:8', 'New password')
const {
  value: confirm,
  errorMessage: confirmError,
  onBlur: confirmBlur,
} = useFormField('confirm', 'required|confirmed:@password', 'Password confirmation')

const formError = ref('')
const loading = ref(false)
const checking = ref(true)

onMounted(async () => {
  // The recovery link lands here with a code in the URL; Supabase's
  // detectSessionInUrl exchanges it for a session automatically.
  await auth.init()
  checking.value = false
  if (!auth.isAuthenticated) {
    formError.value = 'This recovery link is invalid or has expired. Please request a new one.'
  }
})

const submit = handleSubmit(async () => {
  formError.value = ''
  loading.value = true
  const result = await auth.resetPassword(password.value)
  loading.value = false

  if (result.error) {
    const mapped = mapAuthError(result)
    if (mapped?.field === 'password') setPasswordError(mapped.message)
    else formError.value = mapped?.message ?? result.error
    return
  }
  toasts.success('Password changed — you are signed in')
  router.push({ name: 'home' })
})
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
      novalidate
      @submit.prevent="submit"
    >
      <BaseInput
        v-model="password"
        label="New password"
        type="password"
        autocomplete="new-password"
        floating
        :icon="KeyRound"
        toggleable
        hint="Use at least 8 characters."
        :error="passwordError"
        required
        @blur="passwordBlur"
      />
      <BaseInput
        v-model="confirm"
        label="Confirm new password"
        type="password"
        autocomplete="new-password"
        floating
        :icon="KeyRound"
        toggleable
        :error="confirmError"
        required
        @blur="confirmBlur"
      />
      <p
        v-if="formError"
        class="form__error"
        role="alert"
      >
        {{ formError }}
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
  animation: fade-in 0.15s ease-out;
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
