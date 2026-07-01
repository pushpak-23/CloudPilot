<template>
  <!-- Desktop Sidebar -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-30 flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 hidden md:flex',
      layout.sidebarCollapsed ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Sidebar Header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-zinc-850">
      <div v-if="!layout.sidebarCollapsed" class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
          :style="{ backgroundColor: themeStore.accentColor, boxShadow: `0 4px 14px -3px ${themeStore.accentColorBorder}` }"
        >
          <Cloud :size="18" class="text-white" />
        </div>
        <span class="font-bold text-lg text-white tracking-wider">CloudPilot</span>
      </div>
      <div v-else class="w-full flex justify-center">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
          :style="{ backgroundColor: themeStore.accentColor, boxShadow: `0 4px 14px -3px ${themeStore.accentColorBorder}` }"
        >
          <Cloud :size="18" class="text-white" />
        </div>
      </div>

      <button
        @click="layout.toggleSidebar()"
        class="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-900 rounded-lg"
      >
        <component :is="layout.sidebarCollapsed ? PanelLeft : PanelLeftClose" :size="18" />
      </button>
    </div>

    <!-- Navigation List -->
    <nav class="flex-1 mt-6 space-y-1.5 px-3 overflow-y-auto">
      <RouterLink
        v-for="item in navigation"
        :key="item.title"
        :to="item.path"
        :class="[
          'flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all group',
          isRouteActive(item.path)
            ? 'border'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
        ]"
        :style="isRouteActive(item.path) ? {
          backgroundColor: themeStore.accentColorSubtle,
          color: themeStore.accentColor,
          borderColor: themeStore.accentColorBorder,
        } : {}"
      >
        <component
          :is="item.icon"
          :size="18"
          :class="[
            'transition-colors shrink-0',
            !isRouteActive(item.path) ? 'text-zinc-400 group-hover:text-zinc-300' : ''
          ]"
          :style="isRouteActive(item.path) ? { color: themeStore.accentColor } : {}"
        />

        <span
          v-if="!layout.sidebarCollapsed"
          class="transition-opacity duration-300"
        >
          {{ item.title }}
        </span>
      </RouterLink>
    </nav>
  </aside>

  <!-- Mobile Drawer Overlay Backdrop -->
  <div
    v-if="layout.sidebarMobileOpen"
    class="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm md:hidden"
    @click="layout.closeMobileSidebar()"
  ></div>

  <!-- Mobile Sidebar Drawer -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 md:hidden',
      layout.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
  >
    <div class="h-16 flex items-center justify-between px-5 border-b border-zinc-850">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center"
          :style="{ backgroundColor: themeStore.accentColor }"
        >
          <Cloud :size="18" class="text-white" />
        </div>
        <span class="font-bold text-lg text-white tracking-wider">CloudPilot</span>
      </div>

      <button
        @click="layout.closeMobileSidebar()"
        class="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-900 rounded-lg"
      >
        <X :size="18" />
      </button>
    </div>

    <nav class="flex-1 mt-6 space-y-1.5 px-3 overflow-y-auto">
      <RouterLink
        v-for="item in navigation"
        :key="item.title"
        :to="item.path"
        @click="layout.closeMobileSidebar()"
        :class="[
          'flex items-center gap-3 rounded-lg p-3 text-sm font-medium transition-all group',
          isRouteActive(item.path)
            ? 'border'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
        ]"
        :style="isRouteActive(item.path) ? {
          backgroundColor: themeStore.accentColorSubtle,
          color: themeStore.accentColor,
          borderColor: themeStore.accentColorBorder,
        } : {}"
      >
        <component
          :is="item.icon"
          :size="18"
          :class="[
            'transition-colors shrink-0',
            !isRouteActive(item.path) ? 'text-zinc-400 group-hover:text-zinc-300' : ''
          ]"
          :style="isRouteActive(item.path) ? { color: themeStore.accentColor } : {}"
        />
        <span>{{ item.title }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { PanelLeftClose, PanelLeft, X, Cloud } from 'lucide-vue-next'
import navigation from '@/shared/navigation'
import { useLayoutStore } from '@/stores/layout'
import { useThemeStore } from '@/stores/theme'

const layout = useLayoutStore()
const themeStore = useThemeStore()
const route = useRoute()

// Helper to determine if a route is active
function isRouteActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>


