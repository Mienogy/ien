<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    lines?: number
  }>(),
  {
    width: '100%',
    height: '16px',
    lines: 1,
  },
)
</script>

<template>
  <div
    class="skeleton-stack"
    :style="{ width }"
    aria-hidden="true"
  >
    <div
      v-for="i in lines"
      :key="i"
      class="skeleton"
      :style="{ height, width: i === lines && lines > 1 ? '60%' : '100%' }"
    />
  </div>
</template>

<style scoped>
.skeleton-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>
