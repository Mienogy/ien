<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Check, ChevronRight, FileText, Plus } from 'lucide-vue-next'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import SubPageList from './SubPageList.vue'

const props = defineProps<{ spaceId: string }>()

const content = useContentStore()
const toasts = useToasts()
const route = useRoute()

const expanded = ref<Record<string, boolean>>({})
const pages = ref(content.rootPagesBySpace[props.spaceId] ?? [])

async function load() {
  try {
    await content.loadRootPages(props.spaceId)
    pages.value = content.rootPagesBySpace[props.spaceId] ?? []
  } catch {
    // Sidebar tree failing silently is fine — the space page shows errors.
  }
}

onMounted(load)
watch(
  () => props.spaceId,
  load,
)
watch(
  () => content.rootPagesBySpace[props.spaceId],
  (next) => {
    pages.value = next ?? []
  },
  { deep: true },
)

async function quickAddPage() {
  try {
    await content.createPage({ spaceId: props.spaceId, title: 'Untitled' })
    await load()
    toasts.success('Page created')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to create page.')
  }
}

function toggle(id: string) {
  expanded.value = { ...expanded.value, [id]: !expanded.value[id] }
}
</script>

<template>
  <div class="tree">
    <div
      v-for="page in pages"
      :key="page.id"
      class="tree__node"
    >
      <div
        class="tree__row"
        :class="{ 'tree__row--active': route.params.pageId === page.id }"
      >
        <button
          class="tree__toggle"
          :class="{ 'tree__toggle--hidden': !expanded[page.id] }"
          :aria-label="expanded[page.id] ? 'Collapse' : 'Expand'"
          @click="toggle(page.id)"
        >
          <ChevronRight :size="12" />
        </button>
        <RouterLink
          :to="{ name: 'page', params: { pageId: page.id } }"
          class="tree__link"
        >
          <span
            v-if="page.icon"
            class="tree__icon"
          >{{ page.icon }}</span>
          <FileText
            v-else
            :size="14"
            class="tree__file-icon"
          />
          <span class="tree__title truncate">{{ page.title || 'Untitled' }}</span>
          <span
            v-if="page.type === 'checklist'"
            class="tree__badge"
            title="Checklist"
          >
            <Check :size="10" />
          </span>
        </RouterLink>
      </div>
      <div
        v-if="expanded[page.id]"
        class="tree__children"
      >
        <SubPageList
          :parent-id="page.id"
          :depth="1"
        />
      </div>
    </div>

    <button
      class="tree__add"
      @click="quickAddPage"
    >
      <Plus :size="13" />
      <span>Add page</span>
    </button>
  </div>
</template>

<style scoped>
.tree {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-left: var(--space-4);
}

.tree__node {
  display: flex;
  flex-direction: column;
}

.tree__row {
  display: flex;
  align-items: center;
  border-radius: var(--radius-md);
}

.tree__row:hover {
  background: var(--surface-hover);
}

.tree__row--active {
  background: var(--accent-soft);
}

.tree__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 24px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.tree__toggle svg {
  transition: transform 0.15s ease;
}
.tree__toggle:not(.tree__toggle--hidden) svg {
  transform: rotate(90deg);
}

.tree__toggle--hidden {
  visibility: hidden;
}

.tree__link {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-1) var(--space-2) var(--space-1) 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.tree__link:hover {
  color: var(--text-primary);
}

.tree__file-icon {
  flex-shrink: 0;
  color: var(--text-muted);
}

.tree__icon {
  font-size: var(--text-sm);
  line-height: 1;
}

.tree__title {
  flex: 1;
  min-width: 0;
}

.tree__badge {
  display: inline-flex;
  align-items: center;
  color: var(--accent-text);
  background: var(--accent-soft);
  border-radius: var(--radius-full);
  padding: 1px 5px;
}

.tree__children {
  padding-left: var(--space-3);
}

.tree__add {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  margin-top: 2px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.tree__add:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}
</style>
