<template>
  <header
    class="h-14 border-b border-zinc-800/50 flex items-center justify-between px-4 md:px-8 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20 shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]"
  >
    <!-- Left Section: Mobile Toggle & Breadcrumbs -->
    <div class="flex items-center gap-4">
      <button
        @click="layout.toggleMobileSidebar()"
        class="md:hidden text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
      >
        <Menu :size="20" />
      </button>

      <!-- Breadcrumbs -->
      <nav class="hidden sm:flex items-center space-x-1.5 text-sm font-medium text-zinc-400">
        <div class="flex items-center">
          <RouterLink to="/" class="hover:text-zinc-200 transition-colors text-zinc-400">
            CloudPilot
          </RouterLink>
        </div>
        <div v-for="(crumb, idx) in breadcrumbs" :key="crumb.path" class="flex items-center gap-1.5">
          <span class="text-zinc-600">/</span>
          <RouterLink
            v-if="idx < breadcrumbs.length - 1"
            :to="crumb.path"
            class="hover:text-zinc-200 transition-colors"
          >
            {{ crumb.text }}
          </RouterLink>
          <span v-else class="text-zinc-100 font-semibold">{{ crumb.text }}</span>
        </div>
      </nav>
    </div>

    <!-- Right Section: Actions -->
    <div class="flex items-center gap-3 md:gap-5">
      <!-- Search Input Trigger Button -->
      <button
        @click="layout.setSearchModalOpen(true)"
        class="flex items-center gap-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 text-xs md:text-sm w-36 md:w-64 transition-all"
      >
        <Search :size="16" />
        <span class="text-left flex-1 hidden md:inline">Search resources...</span>
        <span class="text-left flex-1 md:hidden">Search...</span>
        <span class="text-xs bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-800">Ctrl K</span>
      </button>

      <!-- Notifications Dropdown Center -->
      <div class="relative">
        <button
          @click="toggleNotifications"
          class="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors relative"
        >
          <Bell :size="19" />
          <span
            v-if="layout.unreadNotificationsCount > 0"
            class="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 animate-pulse"
            :style="{ backgroundColor: themeStore.accentColor }"
          ></span>
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showNotifications"
          class="absolute right-0 mt-2.5 w-80 md:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-30"
        >
          <div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
            <h3 class="font-semibold text-sm text-white flex items-center gap-2">
              Notifications
              <span v-if="layout.unreadNotificationsCount > 0" class="text-xs font-normal px-2 py-0.5 rounded-full" :style="{ color: themeStore.accentColor, backgroundColor: themeStore.accentColorSubtle }">
                {{ layout.unreadNotificationsCount }} new
              </span>
            </h3>
            <button
              v-if="layout.unreadNotificationsCount > 0"
              @click="layout.markAllNotificationsAsRead()"
              class="text-xs transition-colors"
              :style="{ color: themeStore.accentColor }"
            >
              Mark all read
            </button>
          </div>

          <div class="max-h-[320px] overflow-y-auto divide-y divide-zinc-800/50">
            <div
              v-for="item in layout.notifications"
              :key="item.id"
              :class="[
                'p-4 transition-colors text-xs flex gap-3 cursor-pointer',
                item.read ? 'hover:bg-zinc-800/20 opacity-70' : 'bg-blue-600/[0.03] hover:bg-blue-600/[0.06]'
              ]"
              @click="layout.toggleNotificationRead(item.id)"
            >
              <!-- Type Indicator -->
              <div class="mt-0.5">
                <span
                  class="w-2.5 h-2.5 rounded-full block"
                  :class="{
                    'bg-emerald-500': item.type === 'success',
                    'bg-red-500': item.type === 'error',
                    'bg-amber-500': item.type === 'warning',
                    'bg-blue-500': item.type === 'info',
                  }"
                ></span>
              </div>
              <!-- Content -->
              <div class="flex-1 space-y-1">
                <div class="flex justify-between items-start gap-2">
                  <span class="font-semibold text-white">{{ item.title }}</span>
                  <span class="text-zinc-500 shrink-0">{{ item.time }}</span>
                </div>
                <p class="text-zinc-400 leading-normal">{{ item.description }}</p>
              </div>
            </div>
            <div v-if="layout.notifications.length === 0" class="p-8 text-center text-zinc-500">
              No notifications
            </div>
          </div>
        </div>
      </div>

      <!-- Settings Direct Link -->
      <RouterLink
        to="/settings"
        class="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
      >
        <SettingsIcon :size="19" />
      </RouterLink>

      <!-- User Profile & Context Dropdown -->
      <div class="relative">
        <button
          @click="toggleProfile"
          class="flex items-center gap-2 pl-2 pr-1.5 py-1 hover:bg-zinc-900 rounded-lg transition-colors border border-transparent hover:border-zinc-800"
        >
          <div class="rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner select-none" :style="{ backgroundColor: themeStore.accentColor }">
            {{ authStore.user?.username ? authStore.user.username.charAt(0).toUpperCase() : 'A' }}
          </div>
          <span class="text-sm font-semibold text-zinc-300 hidden md:inline">{{ authStore.user?.username || 'Admin' }}</span>
          <ChevronDown :size="14" class="text-zinc-400" />
        </button>

        <!-- Dropdown Menu -->
        <div
          v-if="showProfile"
          class="absolute right-0 mt-2.5 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-30 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div class="px-3 py-2 border-b border-zinc-800/80 mb-1.5">
            <div class="font-bold text-sm text-white capitalize">{{ authStore.user?.username || 'Administrator' }}</div>
            <div class="text-zinc-500 text-xs mt-0.5">{{ authStore.user?.email || 'admin@cloudpilot.internal' }}</div>
          </div>

          <!-- Region Switcher -->
          <div class="p-1 space-y-1">
            <div class="text-[10px] font-semibold text-zinc-500 uppercase px-2 py-1 tracking-wider flex items-center gap-1.5">
              <Globe :size="10" /> Region
            </div>
            <button
              v-for="region in layout.regions"
              :key="region"
              @click="layout.setRegion(region)"
              class="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors"
            >
              <span>{{ region }}</span>
              <Check v-if="layout.currentRegion === region" :size="12" :style="{ color: themeStore.accentColor }" />
            </button>
          </div>

          <hr class="border-zinc-800 my-1.5" />

          <!-- Project Switcher -->
          <div class="p-1 space-y-1">
            <div class="text-[10px] font-semibold text-zinc-500 uppercase px-2 py-1 tracking-wider flex items-center gap-1.5">
              <FolderKanban :size="10" /> Project Space
            </div>
            <button
              v-for="project in layout.projects"
              :key="project"
              @click="layout.setProject(project)"
              class="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800/60 transition-colors text-left"
            >
              <span class="truncate pr-2">{{ project }}</span>
              <Check v-if="layout.currentProject === project" :size="12" class="shrink-0" :style="{ color: themeStore.accentColor }" />
            </button>
          </div>

          <hr class="border-zinc-800 my-1.5" />

          <button
            @click="handleLogout"
            class="w-full rounded-md px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left cursor-pointer"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Menu,
  Bell,
  Search,
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  Globe,
  FolderKanban
} from 'lucide-vue-next'
import { useLayoutStore } from '@/stores/layout'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const layout = useLayoutStore()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

const showNotifications = ref(false)
const showProfile = ref(false)

// Breadcrumbs derived from route meta info
const breadcrumbs = computed(() => {
  return (route.meta.breadcrumbs as Array<{ text: string; path: string }>) || []
})

function toggleNotifications(e: Event) {
  e.stopPropagation()
  showNotifications.value = !showNotifications.value
  showProfile.value = false
}

function toggleProfile(e: Event) {
  e.stopPropagation()
  showProfile.value = !showProfile.value
  showNotifications.value = false
}

function closeDropdowns() {
  showNotifications.value = false
  showProfile.value = false
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
  closeDropdowns()
}

onMounted(() => {
  window.addEventListener('click', closeDropdowns)
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
})
</script>

