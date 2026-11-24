<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CheckSquare, FileText } from 'lucide-vue-next'
import type { PageSummary } from '@/types/models'

const props = defineProps<{ page: PageSummary }>()

const to = computed(() => ({ name: 'page', params: { pageId: props.page.id } }))
</script>

<template>
  <RouterLink
    :to="to"
    class="page-link"
  >
    <span
      v-if="page.icon"
      class="page-link__icon"
    >{{ page.icon }}</span>
    <CheckSquare
      v-else-if="page.type === 'checklist'"
      :size="15"
      class="page-link__glyph"
    />
    <FileText
      v-else
      :size="15"
      class="page-link__glyph"
    />
    <span class="page-link__title truncate">{{ page.title || 'Untitled' }}</span>
    <span class="page-link__date">{{ formatDate(page.updated_at) }}</span>
  </RouterLink>
</template>

<script lang="ts">
function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.page-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-primary);
  transition: background-color 0.12s ease;
}

.page-link:hover {
  background: var(--surface-hover);
}

.page-link__icon {
  font-size: var(--text-sm);
  line-height: 1;
}

.page-link__glyph {
  color: var(--text-muted);
  flex-shrink: 0;
}

.page-link__title {
  flex: 1;
  min-width: 0;
}

.page-link__date {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}
</style>
