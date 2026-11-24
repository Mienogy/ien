<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Clock } from 'lucide-vue-next'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import PageList from '@/components/notes/PageList.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const content = useContentStore()
const toasts = useToasts()
const loading = ref(true)

onMounted(async () => {
  try {
    await content.loadRecents()
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load recent pages.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <h1 class="view__title">
        Recent
      </h1>
      <p class="view__subtitle">
        Pages you've worked on lately.
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
      :pages="content.recentPages"
      title="No recent pages"
      description="Pages you open and edit will show up here."
      :empty-icon="Clock"
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
