<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CheckSquare, FileText } from 'lucide-vue-next'
import type { ChecklistItem, Page } from '@/types/models'
import { getPublicPage } from '@/services/supabase/publicPages'
import Editor from '@/components/editor/Editor.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'

/**
 * Public, read-only page view (Workflow §47 — public pages).
 * Renders outside AppShell: no sidebar, no auth required.
 */
const route = useRoute()

const loading = ref(true)
const page = ref<Page | null>(null)
const items = ref<ChecklistItem[]>([])

onMounted(async () => {
  try {
    const result = await getPublicPage(route.params.slug as string)
    if (result) {
      page.value = result.page
      items.value = result.items
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="public fade-in">
    <header class="public__bar">
      <RouterLink
        to="/login"
        class="public__brand"
      >
        <img
          src="@/assets/branding/tulip.svg"
          alt=""
          width="22"
          height="22"
        >
        <span class="public__brand-name">Ien</span>
      </RouterLink>
      <BaseButton
        variant="primary"
        size="sm"
        @click="$router.push({ name: 'login' })"
      >
        Open Ien
      </BaseButton>
    </header>

    <main class="public__main">
      <div
        v-if="loading"
        class="public__loading"
      >
        <BaseSkeleton
          width="48px"
          height="48px"
        />
        <BaseSkeleton
          width="60%"
          height="28px"
        />
        <BaseSkeleton
          width="100%"
          height="120px"
        />
      </div>

      <article
        v-else-if="page"
        class="public__page"
      >
        <span
          class="public__icon"
          aria-hidden="true"
        >
          <template v-if="page.icon">{{ page.icon }}</template>
          <CheckSquare
            v-else-if="page.type === 'checklist'"
            :size="34"
          />
          <FileText
            v-else
            :size="34"
          />
        </span>
        <h1 class="public__title">
          {{ page.title || 'Untitled' }}
        </h1>
        <p class="public__meta">
          Shared publicly · Updated
          {{ new Date(page.updated_at).toLocaleDateString() }}
        </p>

        <ul
          v-if="page.type === 'checklist'"
          class="public__checklist"
        >
          <li
            v-for="item in items"
            :key="item.id"
            class="public__check"
            :class="{ 'public__check--done': item.is_done }"
          >
            <span
              class="public__box"
              :class="{ 'public__box--on': item.is_done }"
              aria-hidden="true"
            >
              <CheckSquare
                v-if="item.is_done"
                :size="13"
              />
            </span>
            {{ item.text }}
          </li>
        </ul>
        <Editor
          v-else
          :model-value="page.content"
          :editable="false"
        />
      </article>

      <div
        v-else
        class="public__missing"
      >
        <h1 class="public__title">
          Page not found
        </h1>
        <p class="public__meta">
          This page doesn't exist, isn't shared, or the link has been revoked.
        </p>
        <BaseButton
          variant="secondary"
          @click="$router.push({ name: 'login' })"
        >
          Go to Ien
        </BaseButton>
      </div>
    </main>

    <footer class="public__footer">
      A personal knowledge management system — made with Ien
    </footer>
  </div>
</template>

<style scoped>
.public {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-base);
}

.public__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}

.public__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.public__brand-name {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.public__main {
  flex: 1;
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-5) var(--space-12);
}

.public__loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.public__page {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  padding: var(--space-7, 2rem) var(--space-8);
}

.public__icon {
  display: inline-flex;
  font-size: 34px;
  line-height: 1;
  color: var(--text-muted);
}

.public__title {
  font-size: var(--text-3xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.02em;
  line-height: var(--leading-tight);
  margin: var(--space-3) 0 var(--space-1);
}

.public__meta {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-5);
}

.public__checklist {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.public__check {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-base);
  color: var(--text-primary);
}

.public__check--done {
  color: var(--text-muted);
  text-decoration: line-through;
}

.public__box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  border: 1.5px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--surface);
}

.public__box--on {
  background: var(--accent);
  border-color: var(--accent);
  color: #202124;
}

.public__missing {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.public__footer {
  text-align: center;
  padding: var(--space-5);
  border-top: 1px solid var(--border);
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
