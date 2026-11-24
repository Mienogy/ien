import { supabase, isSupabaseConfigured } from './client'

/**
 * Auth service — all Supabase Auth calls live here (Workflow §18, §36).
 * Email is the unique account identifier (Supabase Auth default).
 * We never handle password storage ourselves — Supabase hashes passwords.
 */

export interface AuthResult {
  error: string | null
}

function message(error: { message?: string } | null): string | null {
  if (!error) return null
  return error.message || 'Something went wrong. Please try again.'
}

export async function register(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' }
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  })
  return { error: message(error) }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' }
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  return { error: message(error) }
}

export async function logout(): Promise<AuthResult> {
  const { error } = await supabase.auth.signOut()
  return { error: message(error) }
}

/**
 * Password recovery (Workflow §19).
 * Always returns success to the caller so we never reveal whether an
 * email exists (prevents account enumeration).
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return { error: 'Supabase is not configured yet.' }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  // Swallow "user not found" style errors — respond with the same success path.
  if (error && error.message.includes('For security purposes')) {
    return { error: null }
  }
  return { error: message(error) }
}

export async function resetPassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: message(error) }
}

export async function changePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: message(error) }
}

export async function changeEmail(newEmail: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
  return { error: message(error) }
}

export function signInWithGoogle(): Promise<AuthResult> {
  if (!isSupabaseConfigured) return Promise.resolve({ error: 'Supabase is not configured yet.' })
  return supabase.auth
    .signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    .then(({ error }) => ({ error: message(error) }))
}
