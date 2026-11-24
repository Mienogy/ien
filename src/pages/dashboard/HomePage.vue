<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { FileText, FolderPlus, ListChecks, Plus, Star } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import PageLink from '@/components/ui/PageLink.vue'
import CreateChecklistDialog from '@/components/notes/CreateChecklistDialog.vue'
import CreateSpaceDialog from '@/components/spaces/CreateSpaceDialog.vue'
import type { DashboardStats, PageSummary } from '@/types/models'
import { getDashboardStats } from '@/services/supabase/stats'

const router = useRouter()
const auth = useAuthStore()
const content = useContentStore()
const toasts = useToasts()

const loading = ref(true)
const recents = ref<PageSummary[]>([])
const favorites = ref<PageSummary[]>([])
const stats = ref<DashboardStats>({ spaces: 0, pages: 0, favorites: 0, checklists: 0 })
const checklistDialogOpen = ref(false)

const firstName = computed(() => {
  const p = content.profile
  if (p?.display_name) return p.display_name.split(' ')[0]
  if (p?.first_name) return p.first_name
  return (auth.email?.split('@')[0] ?? 'there')
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})

const hasData = computed(() => recents.value.length > 0 || favorites.value.length > 0)

async function loadStats() {
  stats.value = await getDashboardStats(auth.userId ?? '')
}

async function newPage() {
  try {
    const page = await content.createPage({ title: 'Untitled' })
    router.push({ name: 'page', params: { pageId: page.id } })
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create page.')
  }
}

onMounted(async () => {
  try {
    await content.loadAll()
    await Promise.all([
      content.loadFavorites(),
      content.loadRecents(),
      loadStats(),
    ])
    favorites.value = content.favoritePages
    recents.value = content.recentPages.slice(0, 6)
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load dashboard.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="home fade-in">
    <!-- Greeting -->
    <header class="greeting">
      <h1 class="greeting__hello">
        {{ greeting }}, {{ firstName }}.
      </h1>
      <p class="greeting__sub">
        What would you like to work on?
      </p>
    </header>

    <!-- Quick actions -->
    <section
      class="actions"
      aria-label="Quick actions"
    >
      <BaseButton
        variant="secondary"
        @click="newPage"
      >
        <Plus :size="15" /> New Page
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="content.openCreateSpace()"
      >
        <FolderPlus :size="15" /> New Space
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="checklistDialogOpen = true"
      >
        <ListChecks :size="15" /> New Checklist
      </BaseButton>
    </section>

    <!-- Stats -->
    <section
      class="stats"
      aria-label="Overview"
    >
      <div class="stat">
        <span class="stat__value">{{ stats.spaces }}</span>
        <span class="stat__label">Spaces</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.pages }}</span>
        <span class="stat__label">Pages</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.favorites }}</span>
        <span class="stat__label">Favorites</span>
      </div>
      <div class="stat">
        <span class="stat__value">{{ stats.checklists }}</span>
        <span class="stat__label">Checklists</span>
      </div>
    </section>

    <!-- Loading -->
    <div
      v-if="loading"
      class="columns"
    >
      <section class="panel">
        <BaseSkeleton
          width="140px"
          height="14px"
        />
        <BaseSkeleton
          width="100%"
          height="15px"
        />
        <BaseSkeleton
          width="80%"
          height="15px"
        />
        <BaseSkeleton
          width="90%"
          height="15px"
        />
      </section>
      <section class="panel">
        <BaseSkeleton
          width="100px"
          height="14px"
        />
        <BaseSkeleton
          width="85%"
          height="15px"
        />
        <BaseSkeleton
          width="70%"
          height="15px"
        />
      </section>
    </div>

    <!-- Empty -->
    <EmptyState
      v-else-if="!hasData"
      :icon="FileText"
      title="Your workspace is empty"
      description="Create your first page or space to start building your knowledge base."
    >
      <template #action>
        <BaseButton
          variant="primary"
          @click="newPage"
        >
          <Plus :size="15" /> Create your first page
        </BaseButton>
      </template>
    </EmptyState>

    <!-- Panels -->
    <div
      v-else
      class="columns"
    >
      <section class="panel">
        <h2 class="panel__title">
          Recent pages
        </h2>
        <div
          v-if="recents.length"
          class="panel__list"
        >
          <PageLink
            v-for="page in recents"
            :key="page.id"
            :page="page"
          />
        </div>
        <p
          v-else
          class="panel__empty"
        >
          No pages yet.
        </p>
      </section>

      <section class="panel">
        <h2 class="panel__title">
          <Star
            :size="14"
            class="panel__title-icon"
          /> Favorites
        </h2>
        <div
          v-if="favorites.length"
          class="panel__list"
        >
          <PageLink
            v-for="page in favorites"
            :key="page.id"
            :page="page"
          />
        </div>
        <p
          v-else
          class="panel__empty"
        >
          Star a page to see it here.
        </p>
      </section>
    </div>

    <CreateSpaceDialog />
    <CreateChecklistDialog v-model:open="checklistDialogOpen" />
  </div>
</template>

<style scoped>
.home {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-10) var(--space-6) var(--space-12);
}

.greeting__hello {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  line-height: var(--leading-tight);
}

.greeting__sub {
  margin-top: var(--space-2);
  font-size: var(--text-md);
  color: var(--text-secondary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-6);
}

.stats {
  display: flex;
  gap: var(--space-8);
  margin-top: var(--space-8);
  padding: var(--space-5) 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat__value {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.stat__label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.panel__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}

.panel__title-icon {
  color: var(--accent);
}

.panel__list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.panel__empty {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

@media (max-width: 720px) {
  .home {
    padding: var(--space-6) var(--space-4) var(--space-10);
  }
  .columns {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  .stats {
    gap: var(--space-5);
    flex-wrap: wrap;
  }
  .greeting__hello {
    font-size: var(--text-2xl);
  }
}
</style>
