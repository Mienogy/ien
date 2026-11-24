<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FolderOpen, Plus } from 'lucide-vue-next'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import PageList from '@/components/notes/PageList.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { PageSummary } from '@/types/models'
import CreateSpaceDialog from '@/components/spaces/CreateSpaceDialog.vue'

const route = useRoute()
const router = useRouter()
const content = useContentStore()
const toasts = useToasts()

const spaceId = computed(() => route.params.spaceId as string)
const space = computed(() => content.spaceMap[spaceId.value])
const pages = ref<PageSummary[]>([])
const loading = ref(true)
const creating = ref(false)

async function load() {
  loading.value = true
  try {
    await content.loadSpaces()
    await content.loadRootPages(spaceId.value)
    pages.value = content.rootPagesBySpace[spaceId.value] ?? []
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load space.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(spaceId, load)

async function newPage() {
  creating.value = true
  try {
    const page = await content.createPage({ spaceId: spaceId.value, title: 'Untitled' })
    router.push({ name: 'page', params: { pageId: page.id } })
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create page.')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <div class="breadcrumb">
        <RouterLink
          :to="{ name: 'home' }"
          class="breadcrumb__link"
        >Home</RouterLink>
        <span class="breadcrumb__sep">/</span>
        <span class="breadcrumb__current">{{ space?.name ?? 'Space' }}</span>
      </div>
      <div class="view__title-row">
        <h1 class="view__title">
          {{ space?.name ?? 'Space' }}
        </h1>
        <BaseButton
          variant="secondary"
          size="sm"
          :loading="creating"
          @click="newPage"
        >
          <Plus :size="14" /> New page
        </BaseButton>
      </div>
      <p class="view__subtitle">
        Pages filed under this space.
      </p>
    </header>

    <div
      v-if="loading"
      class="loading"
    >
      <BaseSkeleton height="58px" />
      <BaseSkeleton height="58px" />
      <BaseSkeleton height="58px" />
    </div>

    <PageList
      v-else-if="pages.length"
      :pages="pages"
      title=""
      description=""
    />

    <EmptyState
      v-else
      :icon="FolderOpen"
      title="No pages in this space"
      description="Create the first page to get started."
    >
      <template #action>
        <BaseButton
          variant="primary"
          :loading="creating"
          @click="newPage"
        >
          <Plus :size="15" /> New page
        </BaseButton>
      </template>
    </EmptyState>

    <CreateSpaceDialog />
  </div>
</template>

<style scoped>
.view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}

.breadcrumb__link:hover {
  color: var(--text-secondary);
  text-decoration: underline;
}

.view__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.view__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
}

.view__subtitle {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

.loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
