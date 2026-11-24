<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const auth = useAuthStore()

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }
  loading.value = true
  const result = await auth.requestPasswordReset(email.value)
  loading.value = false
  if (result.error) {
    error.value = result.error
    return
  }
  // Same response whether or not the account exists (no enumeration).
  sent.value = true
}
</script>

<template>
  <AuthCard
    v-if="!sent"
    title="Reset your password"
    subtitle="Enter your email and we'll send you a recovery link."
  >
    <form
      class="form"
      @submit.prevent="submit"
    >
      <BaseInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
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
