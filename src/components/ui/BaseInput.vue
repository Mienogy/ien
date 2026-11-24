<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import type { Component } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    label?: string
    modelValue?: string
    type?: 'text' | 'email' | 'password' | 'search'
    placeholder?: string
    error?: string
    hint?: string
    autocomplete?: string
    inputmode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
    disabled?: boolean
    required?: boolean
    /** Float the label inside the input (auth forms). */
    floating?: boolean
    /** Leading icon rendered inside the field. */
    icon?: Component | null
    /** Show a show/hide toggle when type is password. */
    toggleable?: boolean
  }>(),
  {
    label: '',
    modelValue: '',
    type: 'text',
    placeholder: '',
    error: '',
    hint: '',
    autocomplete: 'off',
    inputmode: undefined,
    disabled: false,
    required: false,
    floating: false,
    icon: null,
    toggleable: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
}>()

const id = useId()
const focused = ref(false)
const revealed = ref(false)

const floated = computed(() => props.floating && (focused.value || Boolean(props.modelValue)))
const inputType = computed(() =>
  props.type === 'password' && revealed.value ? 'text' : props.type,
)
const showToggle = computed(() => props.toggleable && props.type === 'password')

function onBlur(event: FocusEvent) {
  focused.value = false
  emit('blur', event)
}
</script>

<template>
  <div
    class="field"
    :class="{
      'field--floating': floating,
      'field--icon': Boolean(icon),
      'field--toggle': showToggle,
    }"
  >
    <div class="field__box">
      <label
        v-if="label"
        class="field__label"
        :class="{ 'field__label--float': floated, 'field__label--active': floated && focused }"
        :for="id"
      >{{ label }}</label>
      <div class="field__control">
        <component
          :is="icon"
          v-if="icon"
          class="field__icon"
          aria-hidden="true"
        />
        <input
          :id="id"
          class="field__input"
          :class="{ 'field__input--error': error }"
          :type="inputType"
          :value="modelValue"
          :placeholder="floating ? '' : placeholder"
          :autocomplete="autocomplete"
          :inputmode="inputmode"
          :disabled="disabled"
          :required="required"
          :aria-invalid="error ? 'true' : undefined"
          :aria-describedby="error ? `${id}-error` : hint ? `${id}-hint` : undefined"
          @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @focus="focused = true"
          @blur="onBlur"
        >
        <button
          v-if="showToggle"
          type="button"
          class="field__toggle"
          :aria-label="revealed ? 'Hide password' : 'Show password'"
          :aria-pressed="revealed"
          @click="revealed = !revealed"
        >
          <EyeOff
            v-if="revealed"
            :size="16"
          />
          <Eye
            v-else
            :size="16"
          />
        </button>
      </div>
    </div>
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

.field__box {
  position: relative;
}

.field__control {
  position: relative;
}

.field__label {
  display: block;
  margin-bottom: var(--space-1);
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
  animation: fade-in 0.15s ease-out;
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

/* Leading icon */
.field__icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
  transition: color 0.15s ease;
  z-index: 1;
}

.field__box:focus-within .field__icon {
  color: var(--accent-text);
}

.field--icon .field__input {
  padding-left: 36px;
}

/* Password visibility toggle */
.field__toggle {
  position: absolute;
  right: var(--space-1);
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.12s ease;
}

.field__toggle:hover {
  color: var(--text-secondary);
  background: var(--surface-hover);
}

.field__toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.field--toggle .field__input {
  padding-right: 36px;
}

/* Floating label (opt-in) — label sits inside the field and lifts to the
   top edge on focus or once filled, notching the border like Material. */
.field--floating .field__input {
  height: 44px;
}

.field--floating .field__label {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  margin-bottom: 0;
  padding: 0 var(--space-1);
  background: var(--surface);
  font-size: var(--text-base);
  font-weight: var(--weight-regular);
  color: var(--text-muted);
  pointer-events: none;
  transition:
    top 0.15s ease,
    font-size 0.15s ease,
    color 0.15s ease;
  z-index: 1;
}

.field--floating .field__label--float {
  top: 0;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.field--floating .field__label--active {
  color: var(--accent-text);
}

.field--floating.field--icon .field__label {
  left: 36px;
}
</style>
