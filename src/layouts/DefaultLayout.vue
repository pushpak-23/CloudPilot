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

      <main class="flex-1 overflow-auto bg-zinc-950">
        <RouterView />
      </main>

      <AppFooter />
    </div>

    <!-- Global Command Palette Search Overlay -->
    <GlobalSearchModal />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/widgets/sidebar/AppSidebar.vue'
import AppHeader from '@/widgets/header/AppHeader.vue'
import AppFooter from '@/widgets/footer/AppFooter.vue'
import GlobalSearchModal from '@/widgets/header/components/GlobalSearchModal.vue'
import { useLayoutStore } from '@/stores/layout'

const layout = useLayoutStore()
</script>

