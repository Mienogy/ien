<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { CheckSquare, ChevronRight, FileText, Star } from 'lucide-vue-next'
import type { PageSummary } from '@/types/models'
import EmptyState from '@/components/ui/EmptyState.vue'
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    pages: PageSummary[]
    title: string
    description?: string
    emptyIcon?: Component
    emptyAction?: boolean
  }>(),
  {
    description: '',
    emptyIcon: undefined,
    emptyAction: false,
  },
)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="page-list">
    <div
      v-if="pages.length"
      class="page-list__items"
    >
      <RouterLink
        v-for="page in pages"
        :key="page.id"
        :to="{ name: 'page', params: { pageId: page.id } }"
        class="item"
      >
        <span
          v-if="page.icon"
          class="item__icon"
        >{{ page.icon }}</span>
        <CheckSquare
          v-else-if="page.type === 'checklist'"
          :size="16"
          class="item__glyph"
        />
        <FileText
          v-else
          :size="16"
          class="item__glyph"
        />
        <span class="item__body">
          <span class="item__title truncate">{{ page.title || 'Untitled' }}</span>
          <span class="item__meta">
            <template v-if="page.is_favorite">
              <Star
                :size="11"
                class="item__fav"
              /> Favorited ·
            </template>
            Updated {{ formatDate(page.updated_at) }}
          </span>
        </span>
        <ChevronRight
          :size="15"
          class="item__chevron"
        />
      </RouterLink>
    </div>

    <EmptyState
      v-else
      :icon="emptyIcon"
      :title="title"
      :description="description"
    >
      <template
        v-if="emptyAction"
        #action
      >
        <slot name="empty-action" />
      </template>
    </EmptyState>
  </div>
</template>

<style scoped>
.page-list__items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition:
    border-color 0.12s ease,
    background-color 0.12s ease;
}

.item:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.item__icon {
  font-size: var(--text-md);
  line-height: 1;
}

.item__glyph {
  color: var(--text-muted);
  flex-shrink: 0;
}

.item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.item__meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.item__chevron {
  color: var(--text-muted);
  flex-shrink: 0;
}

.item__fav {
  vertical-align: -1.5px;
  color: var(--accent-text);
}
</style>
