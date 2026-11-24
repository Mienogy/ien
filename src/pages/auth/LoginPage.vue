<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { needsMfaChallenge } from '@/services/supabase/mfa'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import AuthCard from './AuthCard.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const content = useContentStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  loading.value = true
  const result = await auth.login(email.value, password.value)
  loading.value = false

  if (result.error) {
    error.value = result.error
    return
  }

  // Password accepted — but accounts with TOTP enabled are only at
  // assurance level aal1 until the authenticator code is verified.
  if (auth.isAuthenticated && (await needsMfaChallenge())) {
    router.push({ name: 'mfa-verify', query: { email: email.value } })
    return
  }

  if (!auth.isAuthenticated) {
    router.push({ name: 'mfa-verify', query: { email: email.value } })
    return
  }

  await content.loadAll()
  const redirect = (route.query.redirect as string) || '/'
  router.push(redirect)
}
</script>

<template>
  <AuthCard
    title="Welcome back"
    subtitle="Sign in to continue to Ien."
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
        placeholder="••••••••"
        autocomplete="current-password"
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
        Sign in
      </BaseButton>
    </form>

    <div class="divider">
      <span>or</span>
    </div>
    <GoogleButton />

    <div class="auth__links">
      <RouterLink
        :to="{ name: 'forgot-password' }"
        class="auth__link"
      >
        Forgot password?
      </RouterLink>
      <span class="auth__sep">·</span>
      <RouterLink
        :to="{ name: 'register' }"
        class="auth__link"
      >
        Create account
      </RouterLink>
    </div>
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

.auth__links {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-5);
  font-size: var(--text-sm);
}

.auth__link {
  color: var(--text-secondary);
}

.auth__link:hover {
  color: var(--accent-text);
  text-decoration: underline;
}

.auth__sep {
  color: var(--text-muted);
}
</style>
