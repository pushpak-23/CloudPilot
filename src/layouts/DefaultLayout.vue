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

      <main class="flex-1 overflow-auto relative bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/20 via-zinc-950 to-zinc-950">
        <!-- Holographic Scanline sweep visual element -->
        <div class="scanline-beam"></div>

        <!-- Floating abstract color blobs (GPU accelerated background animation) -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none">
          <div 
            class="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[130px] animate-blob transition-all duration-1000"
            :class="[
              themeStore.themeStyle === 'cyberpunk' 
                ? 'bg-yellow-500/12' 
                : (themeStore.isDarkMode ? 'bg-blue-600/10' : 'bg-blue-400/10')
            ]"
          ></div>
          <div 
            class="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[130px] animate-blob animation-delay-2000 transition-all duration-1000"
            :class="[
              themeStore.themeStyle === 'cyberpunk' 
                ? 'bg-cyan-500/12' 
                : (themeStore.isDarkMode ? 'bg-purple-600/10' : 'bg-purple-400/8')
            ]"
          ></div>
          <div 
            class="absolute top-[35%] left-[25%] w-[400px] h-[400px] rounded-full blur-[130px] animate-blob animation-delay-4000 transition-all duration-1000"
            :class="[
              themeStore.themeStyle === 'cyberpunk' 
                ? 'bg-yellow-600/8' 
                : (themeStore.isDarkMode ? 'bg-indigo-600/5' : 'bg-indigo-400/6')
            ]"
          ></div>
        </div>

        <!-- Page contents container -->
        <div class="relative z-10">
          <RouterView />
        </div>
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

