<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { FolderOpen, Hash, Search, FileText } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { search, type SearchResult } from '@/services/supabase/search'
import EmptyState from '@/components/ui/EmptyState.vue'

const router = useRouter()
const auth = useAuthStore()

const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const searched = ref(false)
let timer: number | undefined
let generation = 0

watch(query, (term) => {
  window.clearTimeout(timer)
  if (term.trim().length < 2) {
    results.value = []
    searched.value = false
    return
  }
  timer = window.setTimeout(async () => {
    const gen = ++generation
    loading.value = true
    try {
      const found = await search(auth.userId ?? '', term)
      if (gen === generation) {
        results.value = found
        searched.value = true
      }
    } catch {
      if (gen === generation) results.value = []
    } finally {
      if (gen === generation) loading.value = false
    }
  }, 300)
})

function choose(result: SearchResult) {
  if (result.type === 'page') {
    router.push({ name: 'page', params: { pageId: result.id } })
  } else if (result.type === 'space') {
    router.push({ name: 'space', params: { spaceId: result.id } })
  }
}
</script>

<template>
  <div class="view fade-in">
    <header class="view__header">
      <h1 class="view__title">
        Search
      </h1>
      <p class="view__subtitle">
        Find pages, spaces, and categories. Press Ctrl+K anywhere.
      </p>
    </header>

    <div class="search-box">
      <Search
        :size="17"
        class="search-box__icon"
      />
      <input
        v-model="query"
        class="search-box__input"
        type="search"
        placeholder="Type at least 2 characters…"
        aria-label="Search"
        autofocus
      >
    </div>

    <div
      v-if="loading"
      class="search-state"
    >
      Searching…
    </div>

    <div
      v-else-if="searched && results.length === 0"
      class="search-state"
    >
      No results for “{{ query.trim() }}”
    </div>

    <div
      v-else-if="results.length"
      class="results"
    >
      <button
        v-for="result in results"
        :key="`${result.type}-${result.id}`"
        class="result"
        @click="choose(result)"
      >
        <FileText
          v-if="result.type === 'page'"
          :size="16"
          class="result__icon"
        />
        <FolderOpen
          v-else-if="result.type === 'space'"
          :size="16"
          class="result__icon"
        />
        <Hash
          v-else
          :size="16"
          class="result__icon"
        />
        <span class="result__body">
          <span class="result__title">{{ result.title }}</span>
          <span
            v-if="result.subtitle"
            class="result__subtitle truncate"
          >{{ result.subtitle }}</span>
        </span>
        <span class="result__type">{{ result.type }}</span>
      </button>
    </div>

    <EmptyState
      v-else
      :icon="Search"
      title="Search your knowledge base"
      description="Results appear as you type — titles, page content, spaces, and categories."
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

.search-box {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-4);
  height: 46px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
}

.search-box:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.search-box__icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.search-box__input {
  flex: 1;
  border: none;
  background: none;
  outline: none;
  font-size: var(--text-md);
  color: var(--text-primary);
}

.search-box__input::placeholder {
  color: var(--text-muted);
}

.search-state {
  padding: var(--space-10);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

.results {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: var(--space-5);
}

.result {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  text-align: left;
}

.result:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}

.result__icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.result__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.result__subtitle {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.result__type {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
