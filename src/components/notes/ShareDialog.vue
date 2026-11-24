<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy, Globe, Link2, Lock } from 'lucide-vue-next'
import type { Page } from '@/types/models'
import { useAuthStore } from '@/stores/auth'
import { useToasts } from '@/composables/useToasts'
import * as publicPages from '@/services/supabase/publicPages'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

/**
 * Share dialog (Workflow §47 — public pages): toggle an unlisted
 * read-only link for the current page, copy it, or revoke it.
 */
const props = defineProps<{
  open: boolean
  page: Page | null
}>()

const emit = defineEmits<{
  close: []
  /** Slug (null = private) so the parent can update its local page. */
  changed: [slug: string | null]
}>()

const auth = useAuthStore()
const toasts = useToasts()

const busy = ref(false)
const copied = ref(false)

const slug = computed(() => props.page?.public_slug ?? null)
const url = computed(() => (slug.value ? publicPages.publicUrl(slug.value) : ''))

async function enable() {
  if (!props.page || busy.value) return
  busy.value = true
  try {
    const fresh = await publicPages.enableSharing(props.page.id, auth.userId ?? '')
    emit('changed', fresh)
    toasts.success('Public link enabled.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to enable sharing.')
  } finally {
    busy.value = false
  }
}

async function disable() {
  if (!props.page || busy.value) return
  busy.value = true
  try {
    await publicPages.disableSharing(props.page.id, auth.userId ?? '')
    emit('changed', null)
    toasts.success('Public link turned off.')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to disable sharing.')
  } finally {
    busy.value = false
  }
}

async function copy() {
  if (!url.value) return
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    toasts.error('Could not copy — select the link and copy manually.')
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="Share page"
    width="460px"
    @close="emit('close')"
  >
    <div class="share">
      <div class="share__status">
        <span
          class="share__badge"
          :class="{ 'share__badge--public': Boolean(slug) }"
        >
          <Globe
            v-if="slug"
            :size="13"
          />
          <Lock
            v-else
            :size="13"
          />
          {{ slug ? 'Public link on' : 'Private' }}
        </span>
        <BaseButton
          v-if="!slug"
          variant="primary"
          size="sm"
          :loading="busy"
          @click="enable"
        >
          <Link2 :size="14" /> Create link
        </BaseButton>
        <BaseButton
          v-else
          variant="secondary"
          size="sm"
          :loading="busy"
          @click="disable"
        >
          Turn off
        </BaseButton>
      </div>

      <p class="share__hint">
        Anyone with the link can view this page — read-only, no sign-in needed.
        It won't appear in search engines or your public profile (you don't have one).
      </p>

      <div
        v-if="slug"
        class="share__link"
      >
        <input
          class="share__url"
          type="text"
          readonly
          :value="url"
          aria-label="Public link"
          @focus="($event.target as HTMLInputElement).select()"
        >
        <button
          class="share__copy"
          :aria-label="copied ? 'Copied' : 'Copy link'"
          @click="copy"
        >
          <Check
            v-if="copied"
            :size="15"
          />
          <Copy
            v-else
            :size="15"
          />
        </button>
      </div>
    </div>

    <template #footer>
      <BaseButton
        variant="ghost"
        @click="emit('close')"
      >
        Done
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.share {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.share__status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.share__badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 26px;
  padding: 0 var(--space-3);
  background: var(--bg-sunken);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-muted);
}

.share__badge--public {
  background: var(--success-soft);
  color: var(--success);
}

.share__hint {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}

.share__link {
  display: flex;
  gap: var(--space-2);
}

.share__url {
  flex: 1;
  min-width: 0;
  height: 34px;
  padding: 0 var(--space-3);
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.share__url:focus {
  outline: none;
  border-color: var(--accent);
}

.share__copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  background: var(--accent);
  border-radius: var(--radius-md);
  color: #202124;
  transition: background-color 0.12s ease;
}

.share__copy:hover {
  background: var(--accent-strong);
}
</style>
