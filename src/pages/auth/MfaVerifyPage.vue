<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShieldCheck } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { listFactors, verifyTotp } from '@/services/supabase/mfa'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const content = useContentStore()

const code = ref('')
const error = ref('')
const loading = ref(false)
const factorId = ref<string | null>(null)

const email = computed(() => (route.query.email as string) || auth.email || '')

onMounted(async () => {
  // Find the account's verified TOTP factor so we can challenge it.
  const { active } = await listFactors()
  factorId.value = active.find((f) => f.factor_type === 'totp')?.id ?? null
  if (!factorId.value) {
    error.value = 'Two-factor setup not found for this account.'
  }
})

async function submit() {
  error.value = ''
  const trimmed = code.value.replace(/\s/g, '')
  if (!/^\d{6}$/.test(trimmed)) {
    error.value = 'Enter the 6-digit code from your authenticator app.'
    return
  }
  if (!factorId.value) return

  loading.value = true
  // challengeAndVerify (inside verifyTotp) creates a fresh challenge and
  // verifies the code against it in one step.
  const verifyError = await verifyTotp(factorId.value, trimmed)
  loading.value = false

  if (verifyError) {
    error.value = verifyError.includes('expired') || verifyError.includes('Invalid')
      ? 'That code was not accepted. It may have expired — try the next code.'
      : verifyError
    return
  }

  await auth.init()
  await content.loadAll()
  const redirect = (route.query.redirect as string) || '/'
  router.replace(redirect)
}
</script>

<template>
  <AuthCard
    title="Two-factor verification"
    subtitle="Enter the 6-digit code from your authenticator app to finish signing in."
  >
    <form
      class="form"
      @submit.prevent="submit"
    >
      <div
        class="mfa-icon"
        aria-hidden="true"
      >
        <ShieldCheck :size="22" />
      </div>

      <BaseInput
        v-model="code"
        label="Verification code"
        type="text"
        placeholder="123456"
        autocomplete="one-time-code"
        inputmode="numeric"
        hint="Open Google Authenticator, Authy, 1Password, or Microsoft Authenticator."
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
        Verify and continue
      </BaseButton>
    </form>

    <p
      v-if="email"
      class="mfa-email"
    >
      Signing in as {{ email }}
    </p>

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

.mfa-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  margin: 0 auto var(--space-2);
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent-text);
}

.form__error {
  font-size: var(--text-sm);
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
}

.mfa-email {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-3);
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
