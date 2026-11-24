<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

const router = useRouter()
const content = useContentStore()
const toasts = useToasts()

const title = ref('')
const error = ref('')
const busy = ref(false)

watch(
  () => props.open,
  (open) => {
    if (open) {
      title.value = ''
      error.value = ''
    }
  },
)

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const page = await content.createPage({
      title: title.value.trim() || 'Untitled checklist',
      type: 'checklist',
    })
    emit('update:open', false)
    toasts.success('Checklist created')
    router.push({ name: 'page', params: { pageId: page.id } })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to create checklist.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseModal
    :open="open"
    title="New checklist"
    description="Track tasks with add, edit, complete, and reorder."
    @close="emit('update:open', false)"
  >
    <BaseInput
      v-model="title"
      label="Checklist name"
      placeholder="e.g. Launch plan"
      :error="error"
      data-autofocus
      @keyup.enter="submit"
    />
    <template #footer>
      <BaseButton
        variant="ghost"
        @click="emit('update:open', false)"
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
