<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { QrCode, ShieldCheck, ShieldOff } from 'lucide-vue-next'
import { useToasts } from '@/composables/useToasts'
import { changePassword } from '@/services/supabase/auth'
import { enrollTotp, listFactors, unenroll, verifyTotp, type MfaFactor } from '@/services/supabase/mfa'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'

const toasts = useToasts()

// --- Password ---
const newPassword = ref('')
const confirmNew = ref('')
const passwordError = ref('')
const passwordBusy = ref(false)

async function savePassword() {
  passwordError.value = ''
  if (newPassword.value.length < 8) {
    passwordError.value = 'New password must be at least 8 characters.'
    return
  }
  if (newPassword.value !== confirmNew.value) {
    passwordError.value = 'Passwords do not match.'
    return
  }
  passwordBusy.value = true
  const result = await changePassword(newPassword.value)
  passwordBusy.value = false
  if (result.error) {
    passwordError.value = result.error
    return
  }
  newPassword.value = ''
  confirmNew.value = ''
  toasts.success('Password changed')
}

// --- Two-factor (TOTP) ---
const factors = ref<MfaFactor[]>([])
const mfaLoading = ref(true)

const setupOpen = ref(false)
const qrSvg = ref('')
const pendingEnrollId = ref('')
const code = ref('')
const verifyError = ref('')
const verifying = ref(false)

const disableTarget = ref<MfaFactor | null>(null)
const disabling = ref(false)

async function loadFactors() {
  mfaLoading.value = true
  try {
    const { active } = await listFactors()
    factors.value = active
  } finally {
    mfaLoading.value = false
  }
}

onMounted(loadFactors)

/**
 * Enroll flow: Supabase generates a shared secret (shown as a QR code),
 * we verify one code to prove the app is set up, then the factor becomes
 * active. All crypto happens server-side — we never handle secrets.
 */
async function beginSetup() {
  verifyError.value = ''
  code.value = ''
  const result = await enrollTotp()
  if (result.error) {
    toasts.error(result.error)
    return
  }
  pendingEnrollId.value = result.id
  qrSvg.value = result.qrCodeSvg
  setupOpen.value = true
}

async function confirmSetup() {
  const trimmed = code.value.replace(/\s/g, '')
  if (!/^\d{6}$/.test(trimmed)) {
    verifyError.value = 'Enter the 6-digit code from your authenticator app.'
    return
  }
  verifying.value = true
  verifyError.value = ''
  const err = await verifyTotp(pendingEnrollId.value, trimmed)
  verifying.value = false
  if (err) {
    verifyError.value =
      err.includes('Invalid') || err.includes('expired')
        ? 'That code was not accepted. Try the next code in your app.'
        : err
    return
  }
  setupOpen.value = false
  toasts.success('Two-factor authentication enabled')
  await loadFactors()
}

async function disableFactor() {
  if (!disableTarget.value) return
  disabling.value = true
  const err = await unenroll(disableTarget.value.id)
  disabling.value = false
  if (err) {
    toasts.error(err)
    return
  }
  disableTarget.value = null
  toasts.success('Two-factor authentication disabled')
  await loadFactors()
}
</script>

<template>
  <div>
    <!-- Password -->
    <section class="section">
      <h2 class="section__title">
        Change password
      </h2>
      <p class="section__description">
        Use at least 8 characters. Passwords are hashed by Supabase — never stored in plain text.
      </p>

      <form
        class="form"
        @submit.prevent="savePassword"
      >
        <BaseInput
          v-model="newPassword"
          label="New password"
          type="password"
          placeholder="At least 8 characters"
          autocomplete="new-password"
          required
        />
        <BaseInput
          v-model="confirmNew"
          label="Confirm new password"
          type="password"
          placeholder="Repeat the password"
          autocomplete="new-password"
          required
        />
        <p
          v-if="passwordError"
          class="form__error"
          role="alert"
        >
          {{ passwordError }}
        </p>
        <div class="form__actions">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="passwordBusy"
          >
            Update password
          </BaseButton>
        </div>
      </form>
    </section>

    <!-- Two-factor -->
    <section class="section">
      <h2 class="section__title">
        Two-factor authentication
      </h2>
      <p class="section__description">
        Protect your account with a TOTP authenticator app such as Google Authenticator,
        Microsoft Authenticator, Authy, or 1Password.
      </p>

      <p
        v-if="mfaLoading"
        class="muted"
      >
        Checking your security settings…
      </p>

      <div
        v-else-if="factors.length"
        class="mfa-status"
      >
        <div class="mfa-status__badge mfa-status__badge--on">
          <ShieldCheck :size="16" />
          Enabled
        </div>
        <p class="muted">
          You'll be asked for a 6-digit code from your authenticator app when signing in.
        </p>
        <BaseButton
          variant="secondary"
          size="sm"
          @click="disableTarget = factors[0]"
        >
          <ShieldOff :size="14" /> Disable 2FA
        </BaseButton>
      </div>

      <div
        v-else
        class="mfa-status"
      >
        <div class="mfa-status__badge">
          <ShieldOff :size="16" />
          Not enabled
        </div>
        <p class="muted">
          Recommended for accounts with sensitive notes.
        </p>
        <BaseButton
          variant="primary"
          size="sm"
          @click="beginSetup"
        >
          <QrCode :size="14" /> Enable two-factor authentication
        </BaseButton>
      </div>
    </section>

    <!-- Setup dialog -->
    <BaseModal
      :open="setupOpen"
      title="Set up authenticator"
      description="Scan the QR code with your authenticator app, then enter the 6-digit code it shows."
      width="420px"
      @close="setupOpen = false"
    >
      <div class="setup">
        <!-- QR markup is generated by Supabase (otplib SVG), not user input -->
        <div
          class="setup__qr"
          aria-label="QR code for authenticator setup"
          v-html="qrSvg"
        />
        <BaseInput
          v-model="code"
          label="Verification code"
          placeholder="123456"
          inputmode="numeric"
          autocomplete="one-time-code"
          :error="verifyError"
          @keyup.enter="confirmSetup"
        />
      </div>
      <template #footer>
        <BaseButton
          variant="ghost"
          :disabled="verifying"
          @click="setupOpen = false"
        >
          Cancel
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="verifying"
          data-autofocus
          @click="confirmSetup"
        >
          Confirm and enable
        </BaseButton>
      </template>
    </BaseModal>

    <ConfirmDialog
      :open="disableTarget !== null"
      title="Disable two-factor authentication?"
      message="Your account will only require your password to sign in. You can enable it again at any time."
      confirm-label="Disable"
      :loading="disabling"
      @close="disableTarget = null"
      @confirm="disableFactor"
    />
  </div>
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

.form__actions {
  display: flex;
  justify-content: flex-end;
}

.muted {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.mfa-status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
}

.mfa-status__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--bg-sunken);
  color: var(--text-secondary);
}

.mfa-status__badge--on {
  background: var(--success-soft);
  color: var(--success);
}

.setup {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  align-items: center;
}

.setup__qr {
  background: #ffffff;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
}

.setup__qr :deep(svg) {
  width: 180px;
  height: 180px;
}
</style>
