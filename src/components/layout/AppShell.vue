<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Sidebar from './Sidebar.vue'
import Topbar from './Topbar.vue'
import CommandPalette from '@/components/search/CommandPalette.vue'
import { useUiStore } from '@/stores/ui'
import { useContentStore } from '@/stores/content'

const ui = useUiStore()
const content = useContentStore()

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    document.dispatchEvent(new CustomEvent('ien:open-search'))
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  // Load workspace data (profile, spaces, categories) for the sidebar —
  // safe to call repeatedly: the store no-ops after the first load.
  void content.loadAll()
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div
    class="shell"
    :class="{ 'shell--collapsed': ui.sidebarCollapsed }"
  >
    <Sidebar />
    <div class="shell__main">
      <Topbar />
      <main class="shell__content">
        <RouterView />
      </main>
    </div>
    <CommandPalette />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.shell__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.shell__content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}
</style>
