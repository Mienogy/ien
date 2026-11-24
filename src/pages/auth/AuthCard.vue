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
  background: var(--bg-base);
  gap: var(--space-8);
}

.auth__card {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.auth__brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
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
}
</style>
