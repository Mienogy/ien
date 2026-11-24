<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Star } from 'lucide-vue-next'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import PageList from '@/components/notes/PageList.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

const content = useContentStore()
const toasts = useToasts()
const loading = ref(true)

onMounted(async () => {
  try {
    await content.loadFavorites()
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to load favorites.')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <h1 class="view__title">
        Favorites
      </h1>
      <p class="view__subtitle">
        Pages you've starred for quick access.
      </p>
    </header>

    <div
      v-if="loading"
      class="loading"
    >
      <BaseSkeleton height="58px" />
      <BaseSkeleton height="58px" />
    </div>

    <PageList
      v-else
      :pages="content.favoritePages"
      title="No favorites yet"
      description="Open a page and tap the star to add it here."
      :empty-icon="Star"
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
