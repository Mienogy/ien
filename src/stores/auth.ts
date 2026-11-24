import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/services/supabase/client'
import * as authService from '@/services/supabase/auth'

/**
 * Auth store — the single source of truth for "who is signed in".
 * Route guards and the sidebar read from here instead of calling Supabase
 * directly, so session state stays consistent across the app.
 */
export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const initialized = ref(false)

  const user = computed<User | null>(() => session.value?.user ?? null)
  const isAuthenticated = computed(() => Boolean(session.value))
  const userId = computed(() => session.value?.user.id ?? null)
  const email = computed(() => session.value?.user.email ?? null)

  /** Called once at app start to restore the session and subscribe to changes. */
  async function init() {
    if (!isSupabaseConfigured) {
      initialized.value = true
      return
    }
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    initialized.value = true

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
  }

  async function register(email: string, password: string) {
    return authService.register(email, password)
  }

  async function login(email: string, password: string) {
    const result = await authService.login(email, password)
    // A challenge may be pending when MFA is enabled — the login page
    // checks store state and redirects to the MFA step in that case.
    return result
  }

  async function logout() {
    await authService.logout()
    session.value = null
  }

  async function requestPasswordReset(email: string) {
    return authService.requestPasswordReset(email)
  }

  async function resetPassword(newPassword: string) {
    return authService.resetPassword(newPassword)
  }

  return {
    session,
    initialized,
    user,
    isAuthenticated,
    userId,
    email,
    init,
    register,
    login,
    logout,
    requestPasswordReset,
    resetPassword,
  }
})
