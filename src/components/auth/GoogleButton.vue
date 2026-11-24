<script setup lang="ts">
import { signInWithGoogle } from '@/services/supabase/auth'
import { useToasts } from '@/composables/useToasts'
import BaseButton from '@/components/ui/BaseButton.vue'

const toasts = useToasts()

async function continueWithGoogle() {
  const { error } = await signInWithGoogle()
  // On success the browser navigates away to Google — no further code runs.
  if (error) toasts.error(error)
}
</script>

<template>
  <BaseButton
    variant="secondary"
    block
    @click="continueWithGoogle"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.2-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.7 2.9c2.3-2.1 3.7-5.2 3.7-8.6z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.2 1.2-3.2 0-5.9-2.1-6.9-5L1.2 17.3C3.2 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.1 14.4c-.3-.8-.4-1.6-.4-2.4s.2-1.6.4-2.4L1.2 6.7C.4 8.3 0 10.1 0 12s.4 3.7 1.2 5.3l3.9-2.9z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.7l3.9 2.9c1-2.9 3.7-4.9 6.9-4.9z"
      />
    </svg>
    Continue with Google
  </BaseButton>
</template>
