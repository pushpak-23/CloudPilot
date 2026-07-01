<template>
  <div
    v-if="layout.searchModalOpen"
    class="fixed inset-0 z-50 flex justify-center bg-zinc-950/85 backdrop-blur-sm p-4 md:p-10"
    @click.self="closeSearch"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col h-fit max-h-[70vh] overflow-hidden transform transition-all mt-10 md:mt-20"
      @keydown.esc="closeSearch"
    >
      <!-- Search Input Section -->
      <div class="flex items-center gap-3 px-4 border-b border-zinc-800 h-14">
        <Search class="text-zinc-400" :size="20" />
        <input
          ref="searchInput"
          v-model="query"
          placeholder="Search pages, resources (e.g., k8s, vol, net)..."
          class="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-zinc-500"
          @keydown.down.prevent="moveDown"
          @keydown.up.prevent="moveUp"
          @keydown.enter.prevent="selectItem"
        />
        <span class="text-zinc-500 text-xs bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">ESC</span>
      </div>

      <!-- Search Results -->
      <div class="flex-1 overflow-y-auto p-2" v-if="filteredResults.length > 0">
        <div class="px-3 py-1.5 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
          Search Results
        </div>
        <div class="space-y-1">
          <div
            v-for="(res, index) in filteredResults"
            :key="res.key"
            :class="[
              'flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer text-sm transition-colors',
              activeIndex === index ? 'bg-blue-600/10 text-white border border-blue-500/30' : 'text-zinc-300 hover:bg-zinc-800/40 border border-transparent'
            ]"
            @click="navigate(res)"
            @mouseenter="activeIndex = index"
          >
            <div class="flex items-center gap-3">
              <component :is="res.icon" :size="16" class="text-zinc-400" />
              <div>
                <span class="font-medium">{{ res.title }}</span>
                <span class="text-zinc-500 text-xs ml-2">{{ res.subtitle }}</span>
              </div>
            </div>
            <span class="text-zinc-500 text-xs bg-zinc-950/60 px-2 py-0.5 rounded border border-zinc-850">
              {{ res.type }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="p-10 text-center text-zinc-500 text-sm" v-else>
        No results found for "<span class="text-zinc-300">{{ query }}</span>"
      </div>

      <!-- Help Footer -->
      <div class="px-4 py-3 border-t border-zinc-800 flex items-center justify-between text-zinc-500 text-xs bg-zinc-950/40">
        <div class="flex items-center gap-4">
          <span><kbd class="bg-zinc-800 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700">↓↑</kbd> Navigate</span>
          <span><kbd class="bg-zinc-800 px-1 py-0.5 rounded text-zinc-400 border border-zinc-700">Enter</kbd> Select</span>
        </div>
        <span>CloudPilot AI Search</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import {
  Search,
  LayoutDashboard,
  Server,
  HardDrive,
  Network,
  Users,
  Activity,
  Bot,
  Settings,
  Terminal,
  Cpu
} from 'lucide-vue-next'

const router = useRouter()
const layout = useLayoutStore()
const query = ref('')
const activeIndex = ref(0)
const searchInput = ref<HTMLInputElement | null>(null)

// Mock list of searchable targets (Pages and Fake Resources)
const searchablePool = [
  // Pages
  { key: 'p-dash', title: 'Dashboard', subtitle: 'Overview of cloud services', path: '/', type: 'Page', icon: LayoutDashboard },
  { key: 'p-comp', title: 'Instances', subtitle: 'Compute hypervisor virtual machines', path: '/compute', type: 'Page', icon: Server },
  { key: 'p-stor', title: 'Volumes', subtitle: 'Block storage volumes', path: '/storage', type: 'Page', icon: HardDrive },
  { key: 'p-netw', title: 'Networking', subtitle: 'SDN topologies and routers', path: '/network', type: 'Page', icon: Network },
  { key: 'p-iden', title: 'Identity & Projects', subtitle: 'Keystone user administration', path: '/identity', type: 'Page', icon: Users },
  { key: 'p-moni', title: 'Monitoring & Logs', subtitle: 'Alertmanager and Grafana metrics', path: '/monitoring', type: 'Page', icon: Activity },
  { key: 'p-copi', title: 'AI Co-pilot', subtitle: 'Interactive cloud chat helper', path: '/ai', type: 'Page', icon: Bot },
  { key: 'p-sett', title: 'Settings', subtitle: 'API tokens and system configurations', path: '/settings', type: 'Page', icon: Settings },
  
  // Fake VMs
  { key: 'vm-k8s-m1', title: 'k8s-master-01', subtitle: 'Running VM (10.0.0.10)', path: '/compute', type: 'Instance', icon: Cpu },
  { key: 'vm-k8s-n1', title: 'k8s-node-01', subtitle: 'Running VM (10.0.0.11)', path: '/compute', type: 'Instance', icon: Cpu },
  { key: 'vm-db-p1', title: 'db-primary-01', subtitle: 'Running VM (10.0.1.5)', path: '/compute', type: 'Instance', icon: Cpu },
  { key: 'vm-web-s1', title: 'web-server-01', subtitle: 'Stopped VM (10.0.2.14)', path: '/compute', type: 'Instance', icon: Cpu },
  
  // Fake Storage Volumes
  { key: 'vol-db-bk', title: 'vol-db-backup', subtitle: 'In-Use Volume (500 GB)', path: '/storage', type: 'Volume', icon: HardDrive },
  { key: 'vol-node-bt', title: 'vol-k8s-node-01-boot', subtitle: 'In-Use Volume (100 GB)', path: '/storage', type: 'Volume', icon: HardDrive },
  { key: 'vol-arch-t', title: 'vol-archive-temp', subtitle: 'Available Volume (2 TB)', path: '/storage', type: 'Volume', icon: HardDrive },

  // Fake Network Components
  { key: 'net-int', title: 'internal-net', subtitle: 'Subnet CIDR 10.0.0.0/24', path: '/network', type: 'Network', icon: Network },
  { key: 'net-pub', title: 'public-net', subtitle: 'Subnet CIDR 172.24.4.0/24', path: '/network', type: 'Network', icon: Network }
]

const filteredResults = computed(() => {
  if (!query.value) {
    return searchablePool.slice(0, 6) // default items
  }
  const q = query.value.toLowerCase()
  return searchablePool.filter(
    item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
  )
})

// Auto focus on input when opened
watch(
  () => layout.searchModalOpen,
  async (newVal) => {
    if (newVal) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      searchInput.value?.focus()
    }
  }
)

function closeSearch() {
  layout.setSearchModalOpen(false)
}

function moveDown() {
  if (activeIndex.value < filteredResults.value.length - 1) {
    activeIndex.value++
  }
}

function moveUp() {
  if (activeIndex.value > 0) {
    activeIndex.value--
  }
}

function selectItem() {
  const selected = filteredResults.value[activeIndex.value]
  if (selected) {
    navigate(selected)
  }
}

function navigate(item: any) {
  router.push(item.path)
  closeSearch()
}

// Global Keyboard Shortcut listener
function handleKeyDown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    layout.setSearchModalOpen(!layout.searchModalOpen)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
