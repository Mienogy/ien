<script setup lang="ts">
import { useId } from 'vue'

withDefaults(
  defineProps<{
    label?: string
    modelValue?: string
    type?: 'text' | 'email' | 'password' | 'search'
    placeholder?: string
    error?: string
    hint?: string
    autocomplete?: string
    disabled?: boolean
    required?: boolean
  }>(),
  {
    label: '',
    modelValue: '',
    type: 'text',
    placeholder: '',
    error: '',
    hint: '',
    autocomplete: 'off',
    disabled: false,
    required: false,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const id = useId()
</script>

<template>
  <div class="field">
    <label
      v-if="label"
      class="field__label"
      :for="id"
    >{{ label }}</label>
    <input
      :id="id"
      class="field__input"
      :class="{ 'field__input--error': error }"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
    <p
      v-if="error"
      :id="`${id}-error`"
      class="field__error"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${id}-hint`"
      class="field__hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.field__label {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.field__input {
  height: 38px;
  padding: 0 var(--space-3);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.field__input::placeholder {
  color: var(--text-muted);
}

.field__input:hover:not(:disabled) {
  border-color: var(--border-strong);
}

.field__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.field__input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.field__input--error {
  border-color: var(--danger);
}
.field__input--error:focus {
  box-shadow: 0 0 0 3px var(--danger-soft);
}

.field__error {
  font-size: var(--text-xs);
  color: var(--danger);
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
</style>
