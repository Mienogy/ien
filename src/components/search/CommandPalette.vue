<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, FolderOpen, Hash, Search, FileText } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { search, type SearchResult } from '@/services/supabase/search'

const router = useRouter()
const auth = useAuthStore()

const open = ref(false)
const query = ref('')
const results = ref<SearchResult[]>([])
const loading = ref(false)
const activeIndex = ref(0)
const recentSearches = ref<string[]>(loadRecentSearches())
const inputEl = ref<HTMLInputElement | null>(null)
let debounceTimer: number | undefined
let searchGeneration = 0

function loadRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem('ien-recent-searches') ?? '[]') as string[]
  } catch {
    return []
  }
}

function saveRecentSearch(term: string) {
  const next = [term, ...recentSearches.value.filter((t) => t !== term)].slice(0, 5)
  recentSearches.value = next
  localStorage.setItem('ien-recent-searches', JSON.stringify(next))
}

function onOpen() {
  open.value = true
  query.value = ''
  results.value = []
  activeIndex.value = 0
  requestAnimationFrame(() => inputEl.value?.focus())
}

function onClose() {
  open.value = false
}

watch(query, (term) => {
  window.clearTimeout(debounceTimer)
  if (term.trim().length < 2) {
    results.value = []
    return
  }
  // Debounced search (Workflow §42) with generation guard against races.
  debounceTimer = window.setTimeout(async () => {
    const gen = ++searchGeneration
    loading.value = true
    try {
      const found = await search(auth.userId ?? '', term)
      if (gen === searchGeneration) {
        results.value = found
        activeIndex.value = 0
      }
    } catch {
      if (gen === searchGeneration) results.value = []
    } finally {
      if (gen === searchGeneration) loading.value = false
    }
  }, 250)
})

function choose(result: SearchResult) {
  saveRecentSearch(query.value.trim())
  open.value = false
  if (result.type === 'page') {
    router.push({ name: 'page', params: { pageId: result.id } })
  } else if (result.type === 'space') {
    router.push({ name: 'space', params: { spaceId: result.id } })
  }
  // Category results: no dedicated view yet — reserved for future use.
}

function useRecent(term: string) {
  query.value = term
}

function onKeydown(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.preventDefault()
    onClose()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[activeIndex.value]) {
    e.preventDefault()
    choose(results.value[activeIndex.value])
  }
}

onMounted(() => {
  document.addEventListener('ien:open-search', onOpen)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('ien:open-search', onOpen)
  document.removeEventListener('keydown', onKeydown)
  window.clearTimeout(debounceTimer)
})

const showRecents = computed(() => query.value.trim().length < 2 && recentSearches.value.length > 0)
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="open"
        class="palette-overlay"
        @mousedown.self="onClose"
      >
        <div
          class="palette"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div class="palette__input-row">
            <Search
              :size="17"
              class="palette__search-icon"
            />
            <input
              ref="inputEl"
              v-model="query"
              class="palette__input"
              type="search"
              placeholder="Search pages, spaces, categories…"
              aria-label="Search"
              autocomplete="off"
            >
            <kbd class="palette__kbd">Esc</kbd>
          </div>

          <div class="palette__results">
            <div
              v-if="showRecents"
              class="palette__section"
            >
              <div class="palette__section-title">
                Recent searches
              </div>
              <button
                v-for="term in recentSearches"
                :key="term"
                class="palette__item"
                @click="useRecent(term)"
              >
                <Clock
                  :size="15"
                  class="palette__item-icon"
                />
                <span>{{ term }}</span>
              </button>
            </div>

            <div
              v-else-if="loading"
              class="palette__state"
            >
              Searching…
            </div>

            <div
              v-else-if="query.trim().length >= 2 && results.length === 0"
              class="palette__state"
            >
              No results for “{{ query.trim() }}”
            </div>

            <div
              v-else-if="results.length > 0"
              class="palette__section"
            >
              <div class="palette__section-title">
                Results
              </div>
              <button
                v-for="(result, i) in results"
                :key="`${result.type}-${result.id}`"
                class="palette__item"
                :class="{ 'palette__item--active': i === activeIndex }"
                @mouseenter="activeIndex = i"
                @click="choose(result)"
              >
                <FileText
                  v-if="result.type === 'page'"
                  :size="15"
                  class="palette__item-icon"
                />
                <FolderOpen
                  v-else-if="result.type === 'space'"
                  :size="15"
                  class="palette__item-icon"
                />
                <Hash
                  v-else
                  :size="15"
                  class="palette__item-icon"
                />
                <span class="palette__item-title truncate">{{ result.title }}</span>
                <span class="palette__item-type">{{ result.type }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--overlay);
  display: flex;
  justify-content: center;
  padding-top: 14vh;
}

.palette {
  width: min(560px, calc(100vw - var(--space-8)));
  max-height: 440px;
  display: flex;
  flex-direction: column;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.palette__input-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border);
}

.palette__search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.palette__input {
  flex: 1;
  border: none;
  background: none;
  font-size: var(--text-md);
  color: var(--text-primary);
  outline: none;
}

.palette__input::placeholder {
  color: var(--text-muted);
}

.palette__kbd {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
}

.palette__results {
  overflow-y: auto;
  padding: var(--space-2);
}

.palette__section-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: var(--space-2) var(--space-2) var(--space-1);
}

.palette__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--text-primary);
  text-align: left;
}

.palette__item--active {
  background: var(--accent-soft);
}

.palette__item-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.palette__item-title {
  flex: 1;
  min-width: 0;
}

.palette__item-type {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.palette__state {
  padding: var(--space-8) var(--space-4);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.15s ease;
}
.palette-enter-active .palette,
.palette-leave-active .palette {
  transition: transform 0.15s ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from .palette,
.palette-leave-to .palette {
  transform: scale(0.98) translateY(-8px);
}
</style>
