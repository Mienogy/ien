<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="auth">
    <div class="auth__card">
      <RouterLink
        to="/login"
        class="auth__brand"
      >
        <img
          src="@/assets/branding/tulip.svg"
          alt=""
          width="30"
          height="30"
        >
        <span class="auth__brand-name">Ien</span>
      </RouterLink>

      <h1 class="auth__title">
        {{ title }}
      </h1>
      <p
        v-if="subtitle"
        class="auth__subtitle"
      >
        {{ subtitle }}
      </p>

      <slot />
    </div>
    <p class="auth__footer">
      A personal knowledge management system
    </p>
  </div>
</template>

<style scoped>
.auth {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6) var(--space-4);
  gap: var(--space-8);
  background:
    radial-gradient(600px 320px at 50% 18%, var(--accent-soft), transparent 70%), var(--bg-base);
}

.auth__card {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-6);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  animation: rise-in 0.45s ease-out both;
}

/* Staggered entrance: brand → title → subtitle → slot children → footer */
.auth__card > :deep(*) {
  animation: rise-in 0.4s ease-out both;
}

.auth__card > :deep(*:nth-child(1)) {
  animation-delay: 0.06s;
}

.auth__card > :deep(*:nth-child(2)) {
  animation-delay: 0.12s;
}

.auth__card > :deep(*:nth-child(3)) {
  animation-delay: 0.18s;
}

.auth__card > :deep(*:nth-child(4)) {
  animation-delay: 0.26s;
}

.auth__card > :deep(*:nth-child(5)) {
  animation-delay: 0.34s;
}

.auth__card > :deep(*:nth-child(6)) {
  animation-delay: 0.42s;
}

.auth__card > :deep(*:nth-child(n + 7)) {
  animation-delay: 0.5s;
}

.auth__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.auth__brand-name {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  letter-spacing: -0.01em;
}

.auth__title {
  font-size: var(--text-2xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
}

.auth__subtitle {
  font-size: var(--text-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  line-height: var(--leading-relaxed);
}

.auth__footer {
  font-size: var(--text-xs);
  color: var(--text-muted);
  animation: rise-in 0.4s ease-out 0.55s both;
}
</style>
