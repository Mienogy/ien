<script setup lang="ts">
import { ref, watch } from 'vue'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const content = useContentStore()
const toasts = useToasts()

const name = ref('')
const error = ref('')
const busy = ref(false)

watch(
  () => content.createSpaceOpen,
  (open) => {
    if (open) {
      name.value = ''
      error.value = ''
    }
  },
)

async function submit() {
  if (!name.value.trim()) {
    error.value = 'Please enter a space name.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    await content.createSpace(name.value)
    content.createSpaceOpen = false
    toasts.success('Space created')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create space.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="content.createSpaceOpen"
    title="Create a space"
    description="Spaces group related pages, like Work or Personal."
    @close="content.createSpaceOpen = false"
  >
    <BaseInput
      v-model="name"
      label="Space name"
      placeholder="e.g. Work"
      :error="error"
      data-autofocus
      @keyup.enter="submit"
    />
    <template #footer>
      <BaseButton
        variant="ghost"
        @click="content.createSpaceOpen = false"
      >
        Cancel
      </BaseButton>
      <BaseButton
        variant="primary"
        :loading="busy"
        @click="submit"
      >
        Create
      </BaseButton>
    </template>
  </BaseModal>
</template>
