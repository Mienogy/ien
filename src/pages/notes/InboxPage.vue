<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import PageList from '@/components/notes/PageList.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import type { PageSummary } from '@/types/models'
import * as pagesService from '@/services/supabase/pages'

const auth = useAuthStore()
const toasts = useToasts()

const pages = ref<PageSummary[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    // Inbox = pages not yet filed into a space.
    pages.value = await pagesService.listRootPages(auth.userId ?? '', { spaceId: null })
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load inbox.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <h1 class="view__title">
        Inbox
      </h1>
      <p class="view__subtitle">
        Pages that don't belong to a space yet.
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
      v-else
      :pages="pages"
      title="Inbox is empty"
      description="New pages land here until you file them into a space."
      :empty-icon="Inbox"
    />
  </div>
</template>

<style scoped>
.view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--space-8) var(--space-6) var(--space-12);
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
