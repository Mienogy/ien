import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

/**
 * Application routes.
 * - `/auth/*` pages are public.
 * - Everything else requires a session (enforced by the `requiresAuth` guard).
 * - Route components are lazy-loaded so the initial bundle stays small.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Authentication (public) ---
    { path: '/login', name: 'login', component: () => import('@/pages/auth/LoginPage.vue') },
    { path: '/register', name: 'register', component: () => import('@/pages/auth/RegisterPage.vue') },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/pages/auth/ForgotPasswordPage.vue'),
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/pages/auth/ResetPasswordPage.vue'),
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/pages/auth/AuthCallbackPage.vue'),
    },
    {
      path: '/mfa',
      name: 'mfa-verify',
      component: () => import('@/pages/auth/MfaVerifyPage.vue'),
    },

    // --- Main application (authenticated) ---
    {
      path: '/',
      component: () => import('@/components/layout/AppShell.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', name: 'home', component: () => import('@/pages/dashboard/HomePage.vue') },
        { path: 'inbox', name: 'inbox', component: () => import('@/pages/notes/InboxPage.vue') },
        { path: 'search', name: 'search', component: () => import('@/pages/notes/SearchPage.vue') },
        {
          path: 'favorites',
          name: 'favorites',
          component: () => import('@/pages/notes/FavoritesPage.vue'),
        },
        { path: 'recent', name: 'recent', component: () => import('@/pages/notes/RecentPage.vue') },
        {
          path: 'reminders',
          name: 'reminders',
          component: () => import('@/pages/notes/RemindersPage.vue'),
        },
        {
          path: 'archive',
          name: 'archive',
          component: () => import('@/pages/notes/ArchivePage.vue'),
        },
        {
          path: 'spaces/:spaceId',
          name: 'space',
          component: () => import('@/pages/spaces/SpacePage.vue'),
        },
        { path: 'page/:pageId', name: 'page', component: () => import('@/pages/notes/PageView.vue') },
        {
          path: 'settings',
          component: () => import('@/pages/settings/SettingsLayout.vue'),
          children: [
            { path: '', name: 'settings', component: () => import('@/pages/settings/ProfileSettings.vue') },
            {
              path: 'security',
              name: 'settings-security',
              component: () => import('@/pages/settings/SecuritySettings.vue'),
            },
            {
              path: 'appearance',
              name: 'settings-appearance',
              component: () => import('@/pages/settings/AppearanceSettings.vue'),
            },
            {
              path: 'account',
              name: 'settings-account',
              component: () => import('@/pages/settings/AccountSettings.vue'),
            },
          ],
        },
      ],
    },

    // --- Public, unlisted page sharing (Workflow §47) ---
    {
      path: '/p/:slug',
      name: 'public-page',
      component: () => import('@/pages/public/PublicPageView.vue'),
    },

    // --- Fallback ---
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Wait for the initial session restore on first navigation.
  if (!auth.initialized) await auth.init()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // A password sign-in on an MFA-enabled account only yields an aal1
  // session — force the verification step before entering the app.
  if (to.meta.requiresAuth && auth.isAuthenticated && to.name !== 'mfa-verify') {
    const { needsMfaChallenge } = await import('@/services/supabase/mfa')
    if (await needsMfaChallenge()) {
      return { name: 'mfa-verify', query: { redirect: to.fullPath } }
    }
  }

  // Authenticated users should not sit on the auth screens.
  if (auth.isAuthenticated && ['login', 'register'].includes(to.name as string)) {
    return { name: 'home' }
  }

  return true
})

export default router
