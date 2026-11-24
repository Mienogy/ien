<script setup lang="ts">
import { ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { Lock, Mail } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { mapAuthError, useFormField } from '@/lib/validation'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import GoogleButton from '@/components/auth/GoogleButton.vue'
import AuthCard from './AuthCard.vue'

const auth = useAuthStore()

const { handleSubmit } = useForm()

const {
  value: email,
  errorMessage: emailError,
  onBlur: emailBlur,
  setErrors: setEmailError,
} = useFormField('email', 'required|email', 'Email')
const {
  value: password,
  errorMessage: passwordError,
  onBlur: passwordBlur,
  setErrors: setPasswordError,
} = useFormField('password', 'required|min:8', 'Password')
const {
  value: confirm,
  errorMessage: confirmError,
  onBlur: confirmBlur,
} = useFormField('confirm', 'required|confirmed:@password', 'Password confirmation')

const formError = ref('')
const loading = ref(false)
const registered = ref(false)
const duplicate = ref(false)

// The "sign in instead" note belongs to the current email only.
watch(email, () => {
  duplicate.value = false
})

const submit = handleSubmit(async () => {
  formError.value = ''
  loading.value = true
  const result = await auth.register(email.value, password.value)
  loading.value = false

  if (result.error) {
    const mapped = mapAuthError(result)
    if (mapped?.field === 'email') {
      setEmailError(mapped.message)
      duplicate.value = Boolean(mapped.duplicate)
    } else if (mapped?.field === 'password') {
      setPasswordError(mapped.message)
    } else {
      formError.value = mapped?.message ?? result.error
    }
    return
  }
  registered.value = true
})
</script>

<template>
  <AuthCard
    v-if="!registered"
    title="Create your account"
    subtitle="Start organizing your knowledge with Ien."
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
        v-if="duplicate"
        class="field-note"
      >
        This address already has an account —
        <RouterLink
          :to="{ name: 'login' }"
          class="auth__link"
        >sign in instead</RouterLink>.
      </p>
      <BaseInput
        v-model="password"
        label="Password"
        type="password"
        autocomplete="new-password"
        floating
        :icon="Lock"
        toggleable
        hint="Use at least 8 characters."
        :error="passwordError"
        required
        @blur="passwordBlur"
      />
      <BaseInput
        v-model="confirm"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        floating
        :icon="Lock"
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

.field-note {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin: calc(-1 * var(--space-2)) 0 0;
  animation: fade-in 0.15s ease-out;
}

.form__error {
  font-size: var(--text-sm);
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  animation: fade-in 0.15s ease-out;
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
