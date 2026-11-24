<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import AuthCard from './AuthCard.vue'

const auth = useAuthStore()

const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const registered = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  const result = await auth.register(email.value, password.value)
  loading.value = false
  if (result.error) {
    error.value = result.error
    return
  }
  registered.value = true
}
</script>

<template>
  <AuthCard
    v-if="!registered"
    title="Create your account"
    subtitle="Start organizing your knowledge with Ien."
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
      <BaseInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        autocomplete="new-password"
        hint="Use at least 8 characters."
        required
      />
      <BaseInput
        v-model="confirm"
        label="Confirm password"
        type="password"
        placeholder="Repeat your password"
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
        Create account
      </BaseButton>
    </form>

    <div class="divider">
      <span>or</span>
    </div>
    <GoogleButton />

    <p class="auth__link-line">
      Already have an account?
      <RouterLink
        :to="{ name: 'login' }"
        class="auth__link"
      >Sign in</RouterLink>
    </p>
  </AuthCard>

  <AuthCard
    v-else
    title="Check your email"
    subtitle="We sent you a confirmation link. Open it to activate your account, then sign in."
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

.divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) 0 var(--space-4);
  color: var(--text-muted);
  font-size: var(--text-xs);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
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
