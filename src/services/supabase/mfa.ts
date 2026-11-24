import { supabase, isSupabaseConfigured } from './client'

/**
 * MFA service — TOTP two-factor authentication via Supabase MFA (Workflow §21).
 * We never implement custom crypto: Supabase generates the shared secret,
 * verifies one-time codes, and stores the factor server-side.
 */

export interface EnrollResult {
  id: string
  qrCodeSvg: string
  uri: string
  error: string | null
}

export async function enrollTotp(): Promise<EnrollResult> {
  if (!isSupabaseConfigured) {
    return { id: '', qrCodeSvg: '', uri: '', error: 'Supabase is not configured yet.' }
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  if (error || !data) {
    return { id: '', qrCodeSvg: '', uri: '', error: error?.message ?? 'Failed to start setup.' }
  }
  return {
    id: data.id,
    qrCodeSvg: data.totp?.qr_code ?? '',
    uri: data.totp?.uri ?? '',
    error: null,
  }
}

export async function verifyTotp(factorId: string, code: string): Promise<string | null> {
  // challengeAndVerify creates a fresh challenge and verifies the code
  // against it in a single round-trip.
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  return error?.message ?? null
}

export async function challengeTotp(factorId: string): Promise<string | null> {
  const { error } = await supabase.auth.mfa.challenge({ factorId })
  return error?.message ?? null
}

export interface MfaFactor {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
  created_at: string
}

export async function listFactors(): Promise<{ active: MfaFactor[]; all: MfaFactor[] }> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error || !data) return { active: [], all: [] }
  const all = data.all as unknown as MfaFactor[]
  return {
    active: all.filter((f) => f.status === 'verified'),
    all,
  }
}

export async function unenroll(factorId: string): Promise<string | null> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  return error?.message ?? null
}

/** Complete MFA verification during login when a challenge is pending. */
export async function completeLoginChallenge(
  factorId: string,
  code: string,
): Promise<{ error: string | null; needsMfa: boolean }> {
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) {
    // "MFA required" means password was accepted but a challenge is pending.
    return { error: error.message, needsMfa: error.message.toLowerCase().includes('mfa') }
  }
  // Session updates automatically on success.
  void data
  return { error: null, needsMfa: false }
}

/**
 * After a password sign-in, returns true when the account has verified MFA
 * factors and the session is still only at assurance level aal1 — i.e. the
 * user must complete a TOTP challenge before they are fully authenticated.
 */
export async function needsMfaChallenge(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error || !data) return false
  return data.currentLevel === 'aal1' && data.nextLevel === 'aal2'
}
