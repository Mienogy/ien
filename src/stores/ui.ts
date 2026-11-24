import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ien-theme'

/**
 * UI store — theme, sidebar collapse, mobile navigation.
 * Only UI state lives here; all server data stays in Supabase.
 */
export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>(readInitialTheme())
  const sidebarCollapsed = ref(false)
  const mobileNavOpen = ref(false)

  function readInitialTheme(): Theme {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function applyTheme(next: Theme) {
    theme.value = next
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  function toggleTheme() {
    applyTheme(theme.value === 'light' ? 'dark' : 'light')
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setMobileNav(open: boolean) {
    mobileNavOpen.value = open
  }

  return {
    theme,
    sidebarCollapsed,
    mobileNavOpen,
    applyTheme,
    toggleTheme,
    toggleSidebar,
    setMobileNav,
  }
})
