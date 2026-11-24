<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  Archive,
  ChevronDown,
  Clock,
  FileText,
  Home,
  Inbox,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Star,
  LogOut,
} from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import SpaceMenu from '@/components/sidebar/SpaceMenu.vue'
import PageTree from '@/components/sidebar/PageTree.vue'

const ui = useUiStore()
const auth = useAuthStore()
const content = useContentStore()
const route = useRoute()

const spacesExpanded = ref(true)

const navItems = [
  { to: { name: 'home' }, label: 'Home', icon: Home },
  { to: { name: 'inbox' }, label: 'Inbox', icon: Inbox },
  { to: { name: 'search' }, label: 'Search', icon: Search },
  { to: { name: 'favorites' }, label: 'Favorites', icon: Star },
  { to: { name: 'recent' }, label: 'Recent', icon: Clock },
  { to: { name: 'archive' }, label: 'Archive', icon: Archive },
]

const collapsed = computed(() => ui.sidebarCollapsed)
const displayName = computed(() => content.profile?.display_name || content.profile?.email || 'Account')

function isActive(name: string) {
  return route.name === name
}

async function onSignOut() {
  await auth.logout()
  // Router guard will redirect to /login once session clears.
}
</script>

<template>
  <!-- Mobile backdrop -->
  <Transition name="backdrop">
    <div
      v-if="ui.mobileNavOpen"
      class="sidebar__backdrop"
      aria-hidden="true"
      @click="ui.setMobileNav(false)"
    />
  </Transition>

  <aside
    class="sidebar"
    :class="{ 'sidebar--collapsed': collapsed, 'sidebar--mobile-open': ui.mobileNavOpen }"
    aria-label="Main navigation"
  >
    <!-- Brand -->
    <div class="sidebar__brand">
      <RouterLink
        :to="{ name: 'home' }"
        class="brand"
      >
        <img
          src="@/assets/branding/tulip.svg"
          alt=""
          class="brand__logo"
          width="22"
          height="22"
        >
        <span
          v-if="!collapsed"
          class="brand__name"
        >Ien</span>
      </RouterLink>
      <button
        v-if="!collapsed"
        class="sidebar__collapse"
        aria-label="Collapse sidebar"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftClose :size="17" />
      </button>
      <button
        v-else
        class="sidebar__collapse"
        aria-label="Expand sidebar"
        @click="ui.toggleSidebar()"
      >
        <PanelLeftOpen :size="17" />
      </button>
    </div>

    <div
      v-if="!collapsed"
      class="sidebar__scroll"
    >
      <!-- Navigation -->
      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="nav-item"
          :class="{ 'nav-item--active': isActive(item.to.name as string) }"
          @click="ui.setMobileNav(false)"
        >
          <component
            :is="item.icon"
            :size="17"
            class="nav-item__icon"
          />
          <span class="nav-item__label">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <!-- Spaces -->
      <section class="sidebar__section">
        <div class="section__header">
          <button
            class="section__toggle"
            @click="spacesExpanded = !spacesExpanded"
          >
            <ChevronDown
              :size="13"
              class="section__chevron"
              :class="{ 'section__chevron--collapsed': !spacesExpanded }"
            />
            <span>Spaces</span>
          </button>
          <button
            class="section__add"
            aria-label="Create space"
            title="Create space"
            @click="content.openCreateSpace()"
          >
            <Plus :size="14" />
          </button>
        </div>

        <div
          v-if="spacesExpanded"
          class="section__body"
        >
          <div
            v-if="content.spacesLoading"
            class="section__loading"
          >
            <span
              class="skeleton"
              style="height: 14px; width: 70%"
            />
            <span
              class="skeleton"
              style="height: 14px; width: 55%"
            />
          </div>

          <template v-else>
            <div
              v-for="space in content.spaces"
              :key="space.id"
              class="space"
            >
              <div
                class="space__row"
                :class="{ 'space__row--active': route.params.spaceId === space.id }"
              >
                <RouterLink
                  :to="{ name: 'space', params: { spaceId: space.id } }"
                  class="space__link"
                  @click="ui.setMobileNav(false)"
                >
                  <FileText
                    :size="15"
                    class="space__icon"
                  />
                  <span class="space__name truncate">{{ space.name }}</span>
                </RouterLink>
                <SpaceMenu :space="space" />
              </div>
              <PageTree :space-id="space.id" />
            </div>

            <p
              v-if="content.spaces.length === 0"
              class="section__empty"
            >
              No spaces yet. Create one with the + button.
            </p>
          </template>
        </div>
      </section>
    </div>

    <!-- Footer (expanded only) -->
    <div
      v-if="!collapsed"
      class="sidebar__footer"
    >
      <RouterLink
        :to="{ name: 'settings' }"
        class="nav-item"
        :class="{ 'nav-item--active': isActive('settings') || route.path.startsWith('/settings') }"
        @click="ui.setMobileNav(false)"
      >
        <Settings
          :size="17"
          class="nav-item__icon"
        />
        <span class="nav-item__label">Settings</span>
      </RouterLink>

      <div class="sidebar__user">
        <BaseAvatar
          :name="displayName"
          :src="content.profile?.avatar_url"
          :size="26"
        />
        <span class="sidebar__user-name truncate">{{ displayName }}</span>
        <button
          class="sidebar__signout"
          aria-label="Sign out"
          title="Sign out"
          @click="onSignOut"
        >
          <LogOut :size="15" />
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-subtle);
  border-right: 1px solid var(--border);
  transition:
    width 0.2s ease,
    transform 0.2s ease;
  overflow: hidden;
}

.sidebar--collapsed {
  width: 0;
  border-right: none;
}

.sidebar__brand {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-4) var(--space-3) var(--space-3) var(--space-4);
  min-height: var(--topbar-height);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
}

.brand__logo {
  flex-shrink: 0;
}

.brand__name {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.sidebar__collapse {
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
.sidebar__collapse:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.sidebar__scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-2);
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-base);
  transition:
    background-color 0.12s ease,
    color 0.12s ease;
}

.nav-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.nav-item--active {
  background: var(--accent-soft);
  color: var(--text-primary);
  font-weight: var(--weight-medium);
}

.nav-item__icon {
  flex-shrink: 0;
}

.nav-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Sections */
.sidebar__section {
  margin-top: var(--space-5);
}

.section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2) var(--space-1);
}

.section__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: var(--space-1) 0;
}

.section__toggle:hover {
  color: var(--text-secondary);
}

.section__chevron {
  transition: transform 0.15s ease;
}
.section__chevron--collapsed {
  transform: rotate(-90deg);
}

.section__add {
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
.section__add:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.section__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.section__loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-2);
}

.section__empty {
  padding: var(--space-2);
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: var(--leading-relaxed);
}

/* Spaces */
.space {
  display: flex;
  flex-direction: column;
}

.space__row {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  border-radius: var(--radius-md);
}

.space__row:hover {
  background: var(--surface-hover);
}

.space__row--active {
  background: var(--surface-active);
}

.space__link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-2);
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

.space__icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.space__name {
  font-size: var(--text-sm);
}

/* Footer */
.sidebar__footer {
  border-top: 1px solid var(--border);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.sidebar__user-name {
  flex: 1;
  min-width: 0;
}

.sidebar__signout {
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
}
.sidebar__signout:hover {
  background: var(--surface-hover);
  color: var(--danger);
}

/* Mobile */
.sidebar__backdrop {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: var(--z-sidebar);
    width: min(var(--sidebar-width), 85vw);
    transform: translateX(-100%);
    box-shadow: var(--shadow-lg);
  }

  .sidebar--mobile-open {
    transform: translateX(0);
  }

  .sidebar--collapsed {
    width: min(var(--sidebar-width), 85vw);
    transform: translateX(-100%);
  }

  .sidebar__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-sidebar) - 1);
    background: var(--overlay);
  }

  .backdrop-enter-active,
  .backdrop-leave-active {
    transition: opacity 0.2s ease;
  }
  .backdrop-enter-from,
  .backdrop-leave-to {
    opacity: 0;
  }
}
</style>
