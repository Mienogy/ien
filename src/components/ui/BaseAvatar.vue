<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name?: string | null
    src?: string | null
    size?: number
  }>(),
  {
    name: null,
    src: null,
    size: 32,
  },
)

const initials = computed(() => {
  if (!props.name) return '?'
  const parts = props.name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase() || '?'
})
</script>

<template>
  <img
    v-if="src"
    class="avatar"
    :src="src"
    :alt="name ? `${name}'s avatar` : 'Avatar'"
    :width="size"
    :height="size"
  >
  <span
    v-else
    class="avatar avatar--fallback"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.38}px` }"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<style scoped>
.avatar {
  border-radius: var(--radius-full);
  object-fit: cover;
  flex-shrink: 0;
  background: var(--bg-sunken);
}

.avatar--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--weight-medium);
  color: var(--accent-text);
  background: var(--accent-soft);
  user-select: none;
}
</style>
