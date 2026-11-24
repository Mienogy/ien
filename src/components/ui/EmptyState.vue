<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    icon?: Component
    title: string
    description?: string
  }>(),
  {
    icon: undefined,
    description: '',
  },
)
</script>

<template>
  <div class="empty">
    <div
      v-if="icon"
      class="empty__icon"
    >
      <component
        :is="icon"
        :size="22"
      />
    </div>
    <h3 class="empty__title">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="empty__description"
    >
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="empty__action"
    >
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-12) var(--space-6);
  gap: var(--space-2);
}

.empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: var(--accent-soft);
  color: var(--accent-text);
  margin-bottom: var(--space-2);
}

.empty__title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.empty__description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 360px;
  line-height: var(--leading-relaxed);
}

.empty__action {
  margin-top: var(--space-4);
}
</style>
