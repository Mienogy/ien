<script setup lang="ts">
import { useUiStore, type Theme } from '@/stores/ui'

const ui = useUiStore()

const options: { value: Theme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Warm off-white with charcoal text' },
  { value: 'dark', label: 'Dark', description: 'Near-black surfaces with soft white text' },
]
</script>

<template>
  <section class="section">
    <h2 class="section__title">
      Theme
    </h2>
    <p class="section__description">
      Choose how Ien looks. Your preference is saved on this device.
    </p>

    <div
      class="theme-grid"
      role="radiogroup"
      aria-label="Theme"
    >
      <button
        v-for="option in options"
        :key="option.value"
        class="theme-card"
        :class="{ 'theme-card--active': ui.theme === option.value }"
        role="radio"
        :aria-checked="ui.theme === option.value"
        @click="ui.applyTheme(option.value)"
      >
        <div
          class="theme-card__preview"
          :class="`theme-card__preview--${option.value}`"
        >
          <span class="preview__sidebar" />
          <span class="preview__content">
            <span class="preview__line" />
            <span class="preview__line preview__line--short" />
          </span>
          <span class="preview__accent" />
        </div>
        <span class="theme-card__label">{{ option.label }}</span>
        <span class="theme-card__description">{{ option.description }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.theme-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  text-align: left;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.theme-card:hover {
  border-color: var(--border-strong);
}

.theme-card--active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.theme-card__preview {
  position: relative;
  width: 100%;
  height: 72px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  margin-bottom: var(--space-2);
  border: 1px solid var(--border);
}

.theme-card__preview--light {
  background: #f7f7f5;
}

.theme-card__preview--dark {
  background: #1e1e1e;
}

.preview__sidebar {
  width: 28%;
  height: 100%;
  background: rgba(128, 128, 128, 0.15);
}

.preview__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
}

.preview__line {
  height: 6px;
  border-radius: 3px;
  background: rgba(128, 128, 128, 0.35);
  width: 80%;
}

.preview__line--short {
  width: 55%;
}

.preview__accent {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
}

.theme-card__label {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.theme-card__description {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

@media (max-width: 560px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }
}
</style>
