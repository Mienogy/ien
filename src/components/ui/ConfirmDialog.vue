<script setup lang="ts">
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    danger?: boolean
    loading?: boolean
  }>(),
  {
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true,
    loading: false,
  },
)

const emit = defineEmits<{ confirm: []; close: [] }>()
</script>

<template>
  <BaseModal
    :open="open"
    :title="title"
    width="400px"
    @close="!loading && emit('close')"
  >
    <p class="confirm__message">
      {{ message }}
    </p>
    <template #footer>
      <BaseButton
        variant="ghost"
        :disabled="loading"
        @click="emit('close')"
      >
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton
        :variant="danger ? 'danger' : 'primary'"
        :loading="loading"
        data-autofocus
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm__message {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-relaxed);
}
</style>
