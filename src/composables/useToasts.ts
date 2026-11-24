import { readonly, ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<Toast[]>([])
let nextId = 1
const DEFAULT_DURATION = 3200

function show(message: string, type: ToastType = 'info', duration = DEFAULT_DURATION) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  window.setTimeout(() => dismiss(id), duration)
}

function dismiss(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

/** Toast notifications (Workflow §28). Keep usage sparse. */
export function useToasts() {
  return {
    toasts: readonly(toasts),
    show,
    success: (message: string) => show(message, 'success'),
    error: (message: string) => show(message, 'error', 5000),
    info: (message: string) => show(message, 'info'),
    dismiss,
  }
}
