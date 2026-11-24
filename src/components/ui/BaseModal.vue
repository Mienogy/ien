<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    width?: string
  }>(),
  {
    title: '',
    description: '',
    width: '440px',
  },
)

const emit = defineEmits<{ close: [] }>()

const dialogEl = ref<HTMLElement | null>(null)
const previousFocus = ref<HTMLElement | null>(null)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) {
    e.stopPropagation()
    emit('close')
    return
  }
  // Trap focus inside the dialog while open
  if (e.key === 'Tab' && props.open && dialogEl.value) {
    const focusables = dialogEl.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      previousFocus.value = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        dialogEl.value?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      })
    } else {
      document.body.style.overflow = ''
      previousFocus.value?.focus()
    }
  },
)

onMounted(() => document.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="modal-overlay"
        @mousedown.self="emit('close')"
      >
        <div
          ref="dialogEl"
          class="modal"
          role="dialog"
          aria-modal="true"
          :aria-label="title || undefined"
          :style="{ '--modal-width': width }"
        >
          <div class="modal__header">
            <div>
              <h2
                v-if="title"
                class="modal__title"
              >
                {{ title }}
              </h2>
              <p
                v-if="description"
                class="modal__description"
              >
                {{ description }}
              </p>
            </div>
            <button
              class="modal__close"
              aria-label="Close dialog"
              @click="emit('close')"
            >
              <X :size="18" />
            </button>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div
            v-if="$slots.footer"
            class="modal__footer"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
}

.modal {
  width: var(--modal-width);
  max-width: 100%;
  max-height: calc(100vh - var(--space-8));
  overflow-y: auto;
  background: var(--surface-raised);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-5) var(--space-5) 0;
}

.modal__title {
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
}

.modal__description {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.modal__close {
  display: flex;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  flex-shrink: 0;
}
.modal__close:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.modal__body {
  padding: var(--space-5);
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
  padding: 0 var(--space-5) var(--space-5);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.18s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.97) translateY(6px);
}
</style>
