<template>
  <div class="h-screen bg-background text-white overflow-hidden flex">
    <!-- Sidebar widget -->
    <AppSidebar />

    <!-- Main Content Container with reactive layout adjustments -->
    <div
      :class="[
        'flex flex-col flex-1 h-full min-h-screen transition-all duration-300',
        layout.sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
      ]"
    >
      <AppHeader />

      <main class="flex-1 overflow-auto bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950 to-zinc-950">
        <RouterView />
      </main>

      <AppFooter />
    </div>

    <!-- Global Command Palette Search Overlay -->
    <GlobalSearchModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/widgets/sidebar/AppSidebar.vue'
import AppHeader from '@/widgets/header/AppHeader.vue'
import AppFooter from '@/widgets/footer/AppFooter.vue'
import GlobalSearchModal from '@/widgets/header/components/GlobalSearchModal.vue'
import { useLayoutStore } from '@/stores/layout'
import { useThemeStore } from '@/stores/theme'

const layout = useLayoutStore()
const themeStore = useThemeStore()

// Apply saved accent theme and load real OpenStack context on app boot
onMounted(() => {
  themeStore.initTheme()
  layout.loadContextData()
})
</script>

