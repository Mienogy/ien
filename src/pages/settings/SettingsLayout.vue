<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { Palette, Shield, UserCog, User } from 'lucide-vue-next'

const route = useRoute()

const sections = [
  { to: { name: 'settings' }, label: 'Profile', icon: User, exact: true },
  { to: { name: 'settings-security' }, label: 'Security', icon: Shield },
  { to: { name: 'settings-appearance' }, label: 'Appearance', icon: Palette },
  { to: { name: 'settings-account' }, label: 'Account', icon: UserCog },
]

function isActive(section: (typeof sections)[number]) {
  if (section.exact) return route.name === 'settings'
  return route.name === section.to.name
}
</script>

<template>
  <div class="settings fade-in">
    <header class="settings__header">
      <h1 class="settings__title">
        Settings
      </h1>
    </header>

    <div class="settings__layout">
      <nav
        class="settings__nav"
        aria-label="Settings sections"
      >
        <RouterLink
          v-for="section in sections"
          :key="section.label"
          :to="section.to"
          class="settings__nav-item"
          :class="{ 'settings__nav-item--active': isActive(section) }"
        >
          <component
            :is="section.icon"
            :size="16"
          />
          {{ section.label }}
        </RouterLink>
      </nav>

      <div class="settings__content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
}

.settings__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  margin-bottom: var(--space-6);
}

.settings__layout {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: var(--space-8);
  align-items: start;
}

.settings__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  position: sticky;
  top: var(--space-4);
}

.settings__nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.settings__nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.settings__nav-item--active {
  background: var(--accent-soft);
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.settings__content {
  min-width: 0;
}

.section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-5);
}

.section__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  margin-bottom: var(--space-1);
}

.section__description {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-5);
  line-height: var(--leading-relaxed);
}

@media (max-width: 720px) {
  .settings__layout {
    grid-template-columns: 1fr;
    gap: var(--space-5);
  }
  .settings__nav {
    flex-direction: row;
    flex-wrap: wrap;
    position: static;
  }
}
</style>
