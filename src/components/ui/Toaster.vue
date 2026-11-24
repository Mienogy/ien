<script setup lang="ts">
import { CheckCircle2, Info, X, XCircle } from 'lucide-vue-next'
import { useToasts } from '@/composables/useToasts'

const { toasts, dismiss } = useToasts()
</script>

<template>
  <div
    class="toaster"
    role="status"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
      >
        <CheckCircle2
          v-if="toast.type === 'success'"
          class="toast__icon"
          :size="16"
        />
        <XCircle
          v-else-if="toast.type === 'error'"
          class="toast__icon"
          :size="16"
        />
        <Info
          v-else
          class="toast__icon"
          :size="16"
        />
        <span class="toast__message">{{ toast.message }}</span>
        <button
          class="toast__close"
          aria-label="Dismiss notification"
          @click="dismiss(toast.id)"
        >
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toaster {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 240px;
  max-width: 380px;
  padding: var(--space-3) var(--space-4);
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  pointer-events: auto;
}

.toast__icon {
  flex-shrink: 0;
}
.toast--success .toast__icon {
  color: var(--success);
}
.toast--error .toast__icon {
  color: var(--danger);
}
.toast--info .toast__icon {
  color: var(--accent-text);
}

.toast__message {
  flex: 1;
}

.toast__close {
  display: flex;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  padding: 2px;
}
.toast__close:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .toaster {
    left: var(--space-4);
    right: var(--space-4);
    bottom: var(--space-4);
  }
  .toast {
    max-width: none;
  }
}
</style>
