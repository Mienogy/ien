<script setup lang="ts">
import { ref } from 'vue'
import { useForm } from 'vee-validate'
import { Mail } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { mapAuthError, useFormField } from '@/lib/validation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const auth = useAuthStore()

const { handleSubmit } = useForm()

const {
  value: email,
  errorMessage: emailError,
  onBlur: emailBlur,
  setErrors: setEmailError,
} = useFormField('email', 'required|email', 'Email')

const formError = ref('')
const loading = ref(false)
const sent = ref(false)

const submit = handleSubmit(async () => {
  formError.value = ''
  loading.value = true
  const result = await auth.requestPasswordReset(email.value)
  loading.value = false

  if (result.error) {
    const mapped = mapAuthError(result)
    if (mapped?.field === 'email') setEmailError(mapped.message)
    else formError.value = mapped?.message ?? result.error
    return
  }
  // Same response whether or not the account exists (no enumeration).
  sent.value = true
})
</script>

<template>
  <AuthCard
    v-if="!sent"
    title="Reset your password"
    subtitle="Enter your email and we'll send you a recovery link."
  >
    <form
      class="form"
      novalidate
      @submit.prevent="submit"
    >
      <BaseInput
        v-model="email"
        label="Email"
        type="email"
        autocomplete="email"
        floating
        :icon="Mail"
        :error="emailError"
        required
        @blur="emailBlur"
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
        Send recovery link
      </BaseButton>
    </form>

    <p class="auth__link-line">
      Remembered it?
      <RouterLink
        :to="{ name: 'login' }"
        class="auth__link"
      >Back to sign in</RouterLink>
    </p>
  </AuthCard>

  <AuthCard
    v-else
    title="Check your email"
    subtitle="If an account exists for that address, a recovery link is on its way. The link expires after a short time."
  >
    <BaseButton
      variant="secondary"
      block
      @click="$router.push({ name: 'login' })"
    >
      Back to sign in
    </BaseButton>
  </AuthCard>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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
  color: var(--text-secondary);
}

.auth__link {
  color: var(--accent-text);
  font-weight: var(--weight-medium);
}
.auth__link:hover {
  text-decoration: underline;
}
</style>
