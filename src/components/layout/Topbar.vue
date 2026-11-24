<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Moon, Search, Sun } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const route = useRoute()

const pageTitle = computed(() => {
  const name = route.name as string | undefined
  const map: Record<string, string> = {
    home: 'Home',
    inbox: 'Inbox',
    search: 'Search',
    favorites: 'Favorites',
    recent: 'Recent',
    archive: 'Archive',
    settings: 'Settings',
    'settings-security': 'Security',
    'settings-appearance': 'Appearance',
    'settings-account': 'Account',
  }
  return map[name ?? ''] ?? ''
})

function openSearch() {
  document.dispatchEvent(new CustomEvent('ien:open-search'))
}
</script>

<template>
  <header class="topbar">
    <button
      class="topbar__menu"
      aria-label="Open navigation"
      @click="ui.setMobileNav(true)"
    >
      <Menu :size="19" />
    </button>

    <h1 class="topbar__title">
      {{ pageTitle }}
    </h1>

    <div class="topbar__actions">
      <button
        class="topbar__action"
        aria-label="Search (Ctrl+K)"
        title="Search (Ctrl+K)"
        @click="openSearch()"
      >
        <Search :size="17" />
      </button>
      <button
        class="topbar__action"
        :aria-label="ui.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
        :title="ui.theme === 'light' ? 'Dark mode' : 'Light mode'"
        @click="ui.toggleTheme()"
      >
        <Moon
          v-if="ui.theme === 'light'"
          :size="17"
        />
        <Sun
          v-else
          :size="17"
        />
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--border);
  background: var(--bg-base);
  flex-shrink: 0;
}

.topbar__menu {
  display: none;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}
.topbar__menu:hover {
  background: var(--surface-hover);
}

.topbar__title {
  flex: 1;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
  min-width: 0;
}

.topbar__actions {
  display: flex;
  gap: var(--space-1);
}

.topbar__action {
  display: flex;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: background-color 0.12s ease;
}
.topbar__action:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .topbar__menu {
    display: flex;
  }
}
</style>
