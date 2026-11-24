import { watch, type Ref } from 'vue'
import { configure, defineRule, useField } from 'vee-validate'
import { confirmed, digits, email, min, required } from '@vee-validate/rules'
import type { AuthResult } from '@/services/supabase/auth'

/**
 * Shared form validation (Workflow §32 — accessible form errors).
 *
 * Rules are registered once here; auth pages use `useFormField` so every
 * field gets consistent messages and blur/submit validation behaviour.
 */

defineRule('required', required)
defineRule('email', email)
defineRule('min', min)
defineRule('confirmed', confirmed)
defineRule('digits', digits)

configure({
  generateMessage: (ctx) => {
    const label = ctx.label || ctx.field
    const firstParam = Array.isArray(ctx.rule?.params) ? ctx.rule.params[0] : undefined
    switch (ctx.rule?.name) {
      case 'required':
        return `${label} is required.`
      case 'email':
        return 'Enter a valid email address, like name@example.com.'
      case 'min':
        return `${label} must be at least ${firstParam} characters.`
      case 'confirmed':
        return 'Passwords do not match.'
      case 'digits':
        return `Enter the ${firstParam}-digit code from your authenticator app.`
      default:
        return `${label} is invalid.`
    }
  },
})

export interface AuthFormField {
  value: Ref<string>
  errorMessage: Ref<string | undefined>
  /** Validate on blur — bind to BaseInput's blur event. */
  onBlur: (event: Event) => void
  /** Overwrite the field error (used for server-side errors). */
  setErrors: (message: string) => void
}

/**
 * A text field that validates on blur and on submit, and re-validates
 * while an error is showing so the message clears as soon as the input
 * becomes valid. Never shows errors mid-typing on a pristine field.
 */
export function useFormField(name: string, rules: string, label: string): AuthFormField {
  const { value, errorMessage, validate, handleBlur, setErrors } = useField<string>(name, rules, {
    label,
    initialValue: '',
    validateOnValueUpdate: false,
  })

  watch(value, () => {
    if (errorMessage.value) void validate()
  })

  return {
    value,
    errorMessage,
    setErrors: (message: string) => setErrors([message]),
    onBlur: (event: Event) => handleBlur(event, true),
  }
}

export interface MappedAuthError {
  /** Field to attach the message to; undefined → show the form-level banner. */
  field?: 'email' | 'password'
  message: string
  /** True when the email already belongs to an account. */
  duplicate?: boolean
}

/**
 * Turns raw Supabase auth errors into friendly, field-specific messages.
 * Anything unrecognised falls through to the form-level banner.
 */
export function mapAuthError(result: AuthResult): MappedAuthError | null {
  if (!result.error) return null
  const code = result.code ?? ''

  if (code === 'user_already_exists' || /already registered/i.test(result.error)) {
    return {
      field: 'email',
      message: 'An account with this email already exists.',
      duplicate: true,
    }
  }
  if (code === 'weak_password' || /at least \d+ characters/i.test(result.error)) {
    return { field: 'password', message: 'Password must be at least 8 characters.' }
  }
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(result.error)) {
    return { message: 'Invalid email or password.' }
  }
  return { message: result.error }
}
