<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import BaseButton from '@/components/ui/BaseButton.vue'
import AuthCard from './AuthCard.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const content = useContentStore()

const failed = ref(false)

onMounted(async () => {
  // OAuth and email links land here; the client exchanges the URL code
  // for a session (detectSessionInUrl in the Supabase client config).
  await auth.init()

  if (auth.isAuthenticated) {
    await content.loadAll()
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } else {
    failed.value = true
  }
})
</script>

<template>
  <AuthCard
    :title="failed ? 'Sign-in failed' : 'Signing you in…'"
    :subtitle="
      failed
        ? 'The sign-in link is invalid or has expired. Please try again.'
        : 'Please wait a moment.'
    "
  >
    <div
      v-if="failed"
      class="actions"
    >
      <RouterLink :to="{ name: 'login' }">
        <BaseButton
          variant="primary"
          block
        >Back to sign in</BaseButton>
      </RouterLink>
    </div>
    <div
      v-else
      class="spinner"
      role="status"
      aria-label="Loading"
    />
  </AuthCard>
</template>

<style scoped>
.spinner {
  width: 22px;
  height: 22px;
  margin: var(--space-6) auto;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: var(--radius-full);
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.actions {
  margin-top: var(--space-4);
}
</style>
