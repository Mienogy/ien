<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronRight, FileText } from 'lucide-vue-next'
import type { PageSummary } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import * as pagesService from '@/services/supabase/pages'

const props = withDefaults(
  defineProps<{
    parentId: string
    depth?: number
  }>(),
  { depth: 1 },
)

const auth = useAuthStore()
const route = useRoute()

const children = ref<PageSummary[]>([])
const expanded = ref<Record<string, boolean>>({})

async function load() {
  if (!auth.userId) return
  try {
    children.value = await pagesService.listChildPages(auth.userId, props.parentId)
  } catch {
    children.value = []
  }
}

onMounted(load)
watch(() => props.parentId, load)

function toggle(id: string) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}
</script>

<template>
  <div class="subtree">
    <div
      v-for="child in children"
      :key="child.id"
      class="subtree__node"
    >
      <div
        class="subtree__row"
        :class="{ 'subtree__row--active': route.params.pageId === child.id }"
      >
        <button
          class="subtree__toggle"
          :class="{ 'subtree__toggle--hidden': !expanded[child.id] }"
          :aria-label="expanded[child.id] ? 'Collapse' : 'Expand'"
          @click="toggle(child.id)"
        >
          <ChevronRight :size="11" />
        </button>
        <RouterLink
          :to="{ name: 'page', params: { pageId: child.id } }"
          class="subtree__link"
        >
          <span
            v-if="child.icon"
            class="subtree__icon"
          >{{ child.icon }}</span>
          <FileText
            v-else
            :size="13"
            class="subtree__file-icon"
          />
          <span class="subtree__title truncate">{{ child.title || 'Untitled' }}</span>
        </RouterLink>
      </div>
      <div
        v-if="expanded[child.id]"
        class="subtree__children"
      >
        <SubPageList
          :parent-id="child.id"
          :depth="depth + 1"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.subtree {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.subtree__node {
  display: flex;
  flex-direction: column;
}

.subtree__row {
  display: flex;
  align-items: center;
  border-radius: var(--radius-md);
}

.subtree__row:hover {
  background: var(--surface-hover);
}

.subtree__row--active {
  background: var(--accent-soft);
}

.subtree__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 22px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.subtree__toggle svg {
  transition: transform 0.15s ease;
}
.subtree__toggle:not(.subtree__toggle--hidden) svg {
  transform: rotate(90deg);
}
.subtree__toggle--hidden {
  visibility: hidden;
}

.subtree__link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-1) var(--space-2) var(--space-1) 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.subtree__link:hover {
  color: var(--text-primary);
}

.subtree__file-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.subtree__icon {
  font-size: var(--text-xs);
  line-height: 1;
}

.subtree__title {
  flex: 1;
  min-width: 0;
}

.subtree__children {
  padding-left: var(--space-3);
}
</style>
