<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <NetworkIcon class="text-blue-500" :size="32" /> Network Control Plane
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Manage tenant networks, subnets, routers, and ports. Inspect structured software-defined networking (SDN) topologies.
        </p>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <button
          @click="openCreateNetworkModal"
          class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4.5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-lg shadow-blue-500/15 cursor-pointer"
        >
          <span>+</span> Create Network
        </button>
        <button
          @click="openCreateRouterModal"
          class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200 font-semibold px-4.5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm cursor-pointer"
        >
          <span>+</span> Create Router
        </button>
      </div>
    </div>

    <!-- SDN Topology Graph Card -->
    <div class="bg-zinc-955/40 border border-zinc-800 rounded-xl p-6 shadow-xl relative flex flex-col space-y-4">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 class="font-semibold text-lg text-white">Logical Topology Flow</h2>
          <p class="text-xs text-zinc-500 mt-0.5">
            Selected network gets a violet glow. Connected external gateways and other active subnets are colored in cyan/indigo. Unused networks are muted.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> External
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Subnet
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Router
          </span>
          <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-200"></span> Instance
          </span>
          <button
            @click="alignLayout"
            class="ml-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Stabilize Layout
          </button>
        </div>
      </div>
      
      <div
        ref="topologyContainer"
        class="w-full h-[480px] bg-zinc-955 border border-zinc-900 rounded-xl overflow-hidden relative"
      >
        <div v-if="networkStore.loading" class="absolute inset-0 bg-zinc-955/80 backdrop-blur-xs flex items-center justify-center text-zinc-400 text-sm z-10">
          <Loader class="animate-spin mr-2" :size="18" /> Querying SDN resources...
        </div>
      </div>
    </div>

    <!-- Main Lists Section -->
    <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <div class="space-y-6">
        <!-- Networks Table -->
        <div class="bg-zinc-955/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
            <h2 class="font-semibold text-lg text-white">Networks</h2>
            <input
              v-model="searchQuery"
              placeholder="Filter networks..."
              class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
                  <th class="p-4">Network Name</th>
                  <th class="p-4">Subnet CIDR</th>
                  <th class="p-4">Network Type</th>
                  <th class="p-4">Segmentation ID</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-850 text-sm">
                <tr v-if="networkStore.loading">
                  <td colspan="5" class="p-8 text-center text-zinc-500">
                    <Loader class="animate-spin inline-block mr-2" :size="16" /> Loading Neutron resources...
                  </td>
                </tr>
                <tr v-else-if="filteredNetworks.length === 0">
                  <td colspan="5" class="p-8 text-center text-zinc-500">
                    No networks found.
                  </td>
                </tr>
                <tr
                  v-for="net in filteredNetworks"
                  :key="net.id"
                  class="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                  @click="selectAndFocusNetwork(net)"
                  :class="selectedNetwork?.id === net.id ? 'bg-blue-955/20 border-l-2 border-blue-500 bg-blue-500/5' : ''"
                >
                  <td class="p-4 font-semibold text-white">
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full animate-pulse" :class="net.external ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-indigo-400 shadow-lg shadow-indigo-500/50'"></span>
                      {{ net.name }}
                    </div>
                  </td>
                  <td class="p-4 font-mono text-zinc-300">{{ net.subnet }}</td>
                  <td class="p-4">
                    <span class="text-xs uppercase px-2.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-400">
                      {{ net.providerNetworkType || (net.external ? 'external' : 'local') }}
                    </span>
                  </td>
                  <td class="p-4 font-mono text-zinc-400">
                    {{ net.providerSegmentationId ?? '-' }}
                  </td>
                  <td class="p-4 text-right" @click.stop>
                    <div class="flex items-center justify-end gap-2">
                      <button
                        @click="openDetailPane(net)"
                        class="px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
                      >
                        Inspect
                      </button>
                      <button
                        @click="openEditNetworkModal(net)"
                        class="px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        @click="handleDeleteNetwork(net)"
                        class="px-2.5 py-1.5 rounded border border-red-500/20 bg-red-500/5 hover:bg-red-650 hover:text-white text-xs text-red-400 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Quick Info Side panel / Selected Node properties -->
      <div class="space-y-6">
        <div class="bg-zinc-955/40 border border-zinc-800 rounded-xl p-5 shadow-xl sticky top-6">
          <div class="flex flex-col gap-2 mb-4">
            <h2 class="font-semibold text-lg text-white">Properties Inspector</h2>
            <span class="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Live Details</span>
          </div>

          <div v-if="selectedNetwork" class="space-y-5">
            <div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
              <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Selected Network</div>
              <div class="text-white font-semibold text-base">{{ selectedNetwork.name }}</div>
              <div class="text-xs text-zinc-400 font-mono mt-1 space-y-1">
                <div>ID: {{ selectedNetwork.id }}</div>
                <div>Subnet: {{ selectedNetwork.subnet }}</div>
                <div>Gateway: {{ selectedNetwork.gateway }}</div>
                <div>Type: {{ selectedNetwork.providerNetworkType || 'Local' }}</div>
                <div>Segmentation ID: {{ selectedNetwork.providerSegmentationId ?? '-' }}</div>
                <div>MTU: {{ selectedNetwork.mtu ?? 'Default (1500)' }}</div>
              </div>
              <div class="pt-2">
                <button
                  @click="openDetailPane(selectedNetwork)"
                  class="w-full text-center bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs py-2 rounded-lg transition-colors cursor-pointer border border-blue-500/20"
                >
                  View Deep Network Details & Ports
                </button>
              </div>
            </div>

            <!-- Ports list -->
            <div class="space-y-2">
              <div class="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Subnet Ports ({{ topologyPorts.length }})</div>
              <div class="space-y-2 max-h-80 overflow-y-auto pr-1">
                <div
                  v-for="port in topologyPorts"
                  :key="port.id"
                  class="rounded-lg border border-zinc-855 bg-zinc-900/40 p-3 space-y-1.5 text-xs text-zinc-300"
                >
                  <div class="flex items-center justify-between font-semibold">
                    <span class="text-white truncate max-w-[140px]">{{ portLabel(port) }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded border" :class="portTypeClass(port)">
                      {{ portTypeLabel(port) }}
                    </span>
                  </div>
                  <div class="text-zinc-500 font-mono text-[10px] truncate">MAC: {{ port.mac_address || 'n/a' }}</div>
                  <div class="grid grid-cols-1 gap-1 text-[11px] text-zinc-400">
                    <div>IP Addresses: {{ fixedIpsForPort(port) }}</div>
                  </div>
                </div>
                <div v-if="topologyPorts.length === 0" class="text-xs text-zinc-500 italic">No ports connected on this subnet.</div>
              </div>
            </div>
<div class="bg-zinc-955/40 border border-zinc-800 rounded-xl p-5 shadow-xl mt-4">
  <div class="flex items-center justify-between mb-2">
    <h2 class="font-semibold text-lg text-white">Virtual Routers</h2>
    <span class="text-xs text-zinc-500">{{ networkStore.routers.length }} Active Routers</span>
  </div>
  <div class="grid grid-cols-1 gap-4">
    <div
      v-for="router in networkStore.routers"
      :key="router.id"
      class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-zinc-700 transition-colors cursor-pointer text-left w-full"
      @click="openRouterDetail(router)"
    >
      <div class="flex items-center justify-between">
        <div class="flex flex-col">
          <div class="text-white font-semibold flex items-center gap-1.5">
            <RouteIcon :size="16" class="text-emerald-400" />
            {{ router.name }}
          </div>
          <div class="text-[10px] text-zinc-500 font-mono mt-0.5">
            ID: {{ router.id.substring(0, 8) }}...
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
          :class="router.adminStateUp ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-zinc-700 text-zinc-400 bg-zinc-900'">
          {{ router.adminStateUp ? 'UP' : 'DOWN' }}
        </span>
      </div>

      
      <div class="text-xs text-zinc-400 grid grid-cols-2 gap-2 pt-1 border-t border-zinc-850">
        <div>External Net: <span class="text-zinc-200 font-medium">{{ router.externalNetworkName || 'None' }}</span></div>
        <div>HA Router: <span class="text-zinc-200 font-medium">{{ router.ha ? 'Enabled' : 'Disabled' }}</span></div>
        <div>Distributed: <span class="text-zinc-200 font-medium">{{ router.distributed ? 'Yes' : 'No' }}</span></div>
        <div>Status: <span class="text-emerald-400 font-semibold">{{ router.status }}</span></div>
      </div>
      <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-850" @click.stop>
        <button
          @click="openEditRouterModal(router)"
          class="px-2.5 py-1 rounded bg-zinc-955 border border-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          Configure
        </button>
        <button
          @click="handleDeleteRouter(router)"
          class="px-2.5 py-1 rounded bg-red-955/10 border border-red-500/20 text-[11px] text-red-400 hover:bg-red-655 hover:text-white transition-colors cursor-pointer"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</div>
          </div>

          <div
            v-else
            class="p-8 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-xl"
          >
            Click any network, subnet, router, or compute instance on the topology graph to inspect.
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-components Modals and Drawer -->
    <CreateNetworkModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @created="onNetworkCreated"
    />

    <CreateRouterModal
      :show="showCreateRouterModal"
      :external-networks="externalNetworks"
      :internal-networks="internalNetworks"
      @close="showCreateRouterModal = false"
      @created="onRouterCreated"
    />

    <EditNetworkModal
      :show="showEditNetworkModal"
      :network="selectedEditNetwork"
      @close="showEditNetworkModal = false"
      @updated="onNetworkUpdated"
    />

    <EditRouterModal
      :show="showEditRouterModal"
      :router="selectedEditRouter"
      :external-networks="externalNetworks"
      @close="showEditRouterModal = false"
      @updated="onRouterUpdated"
    />

    <NetworkDetailsDrawer
      :show="showDetailPane"
      :network="selectedDetailNetwork"
      :ports="selectedNetworkPorts"
      :instances="instances"
      @close="showDetailPane = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import {
  Loader,
  Network as NetworkIcon,
  Route as RouteIcon,
} from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'
import { computeService } from '@/services/compute.service'
import {
  networkService,
  type NetworkConfig,
  type NetworkRouter,
} from '@/services/network.service'
import { Network } from 'vis-network'

// Sub-components
import CreateNetworkModal from '@/components/network/CreateNetworkModal.vue'
import CreateRouterModal from '@/components/network/CreateRouterModal.vue'
import EditNetworkModal from '@/components/network/EditNetworkModal.vue'
import EditRouterModal from '@/components/network/EditRouterModal.vue'
import NetworkDetailsDrawer from '@/components/network/NetworkDetailsDrawer.vue'

// Pinia store
const networkStore = useNetworkStore()

// State
const searchQuery = ref('')
const showCreateModal = ref(false)
const showCreateRouterModal = ref(false)
const showEditNetworkModal = ref(false)
const showEditRouterModal = ref(false)
const showDetailPane = ref(false)

const selectedNetwork = ref<NetworkConfig | null>(null)
const selectedNetworkPorts = ref<any[]>([])
const allNetworkPorts = ref<Record<string, any[]>>({})
const instances = ref<any[]>([])

const selectedDetailNetwork = ref<NetworkConfig | null>(null)
const selectedEditNetwork = ref<NetworkConfig | null>(null)
const selectedEditRouter = ref<NetworkRouter | null>(null)

// Topology DOM elements & vis instance
const topologyContainer = ref<HTMLDivElement | null>(null)
let visNetworkInstance: Network | null = null

// Computed properties
const filteredNetworks = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return networkStore.networks.filter(
    (network) =>
      network.name.toLowerCase().includes(q) ||
      network.subnet.toLowerCase().includes(q) ||
      network.gateway.toLowerCase().includes(q)
  )
})

const externalNetworks = computed(() =>
  networkStore.networks.filter((network) => network.external)
)

const internalNetworks = computed(() =>
  networkStore.networks.filter((network) => !network.external)
)

const topologyPorts = computed(() => selectedNetworkPorts.value)

// Methods
function openDetailPane(net: NetworkConfig) {
  selectedDetailNetwork.value = net
  selectedNetworkPorts.value = allNetworkPorts.value[net.id] || []
  showDetailPane.value = true
}

// Map connected nodes for the sub-graph focus bounds
function getConnectedNodesList(networkId: string): string[] {
  const nodes = [`net_${networkId}`]
  const ports = allNetworkPorts.value[networkId] || []
  ports.forEach((port) => {
    if (String(port.device_owner || '').includes('router')) {
      nodes.push(`router_${port.device_id}`)
    } else if (String(port.device_owner || '').includes('compute')) {
      nodes.push(`vm_${port.device_id}`)
    }
  })
  
  const routerIds = new Set(
    ports.filter((p) => String(p.device_owner || '').includes('router')).map((p) => p.device_id)
  )
  networkStore.routers.forEach((router) => {
    if (routerIds.has(router.id) && router.externalNetworkId) {
      nodes.push(`net_${router.externalNetworkId}`)
    }
  })
  return nodes
}

function openRouterDetail(router: NetworkRouter) {
  const net = portsForRouter(router.id)
  if (net) {
    openDetailPane(net)
  }
}

function isVmPort(port: any): boolean {
  return String(port.device_owner || '').includes('compute')
}

function portLabel(port: any): string {
  if (isVmPort(port)) {
    return instanceNameForPort(port)
  }
  if (String(port.device_owner || '').includes('router')) {
    return `Router Port: ${port.device_id || port.id}`
  }
  return port.name || port.device_id || 'Unassigned Port'
}

// Find primary tenant network based on VM ports attached
function getMainProjectNetwork(): NetworkConfig | null {
  const internalNets = networkStore.networks.filter(n => !n.external)
  if (internalNets.length === 0) {
    return networkStore.networks[0] || null
  }

  let bestNet: NetworkConfig | null = null
  let maxVms = -1

  for (const net of internalNets) {
    const ports = allNetworkPorts.value[net.id] || []
    const vmCount = ports.filter(p => String(p.device_owner || '').includes('compute')).length
    if (vmCount > maxVms) {
      maxVms = vmCount
      bestNet = net
    }
  }

  return bestNet || internalNets[0] || null
}

function portTypeLabel(port: any): string {
  if (isVmPort(port)) return 'Instance'
  if (String(port.device_owner || '').includes('router')) return 'Router'
  return 'Other'
}

function portTypeClass(port: any): string {
  if (isVmPort(port)) return 'text-blue-400 border-blue-500/20 bg-blue-500/10'
  if (String(port.device_owner || '').includes('router'))
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
  return 'text-zinc-400 border-zinc-700 bg-zinc-800/80'
}

function fixedIpsForPort(port: any): string {
  const ips = (port.fixed_ips || [])
    .map((ip: any) => ip.ip_address)
    .filter(Boolean)
  return ips.length > 0 ? ips.join(', ') : 'n/a'
}

function instanceNameForPort(port: any): string {
  const instance = instances.value.find((vm) => vm.id === port.device_id)
  return instance?.name || port.device_id || 'n/a'
}

async function refreshAll() {
  await Promise.all([
    networkStore.loadNetworks(true),
    networkStore.loadRouters(true),
    (async () => {
      instances.value = await computeService.getInstances()
    })(),
  ])

  const portEntries = await Promise.all(
    networkStore.networks.map(async (network) => [
      network.id,
      await networkService.getPortsForNetwork(network.id),
    ])
  )
  allNetworkPorts.value = Object.fromEntries(portEntries)

  const mainNet = getMainProjectNetwork()
  if (mainNet) {
    selectedNetwork.value = mainNet
    selectedNetworkPorts.value = allNetworkPorts.value[mainNet.id] || []
  } else if (networkStore.networks.length > 0 && networkStore.networks[0]) {
    const firstNet = networkStore.networks[0]
    selectedNetwork.value = firstNet
    selectedNetworkPorts.value = allNetworkPorts.value[firstNet.id] || []
  }

  // Draw the topology
  await nextTick()
  initTopologyGraph()

  // Default focus camera fit boundary on main project network + its connected peers
  nextTick(() => {
    const activeFocus = getMainProjectNetwork()
    if (activeFocus && visNetworkInstance) {
      setTimeout(() => {
        if (visNetworkInstance && activeFocus) {
          const nodesToFit = getConnectedNodesList(activeFocus.id)
          visNetworkInstance.fit({
            nodes: nodesToFit,
            animation: { duration: 1200, easingFunction: 'easeInOutQuad' }
          })
        }
      }, 600)
    }
  })
}

// Vector Badge SVG Icon Generators (Circular Glassmorphism Look with glowing borders)
const generateCircularBadge = (
  gradientStart: string,
  gradientEnd: string,
  borderColor: string,
  iconContent: string,
  highlighted: boolean = false
) => {
  const strokeWidth = highlighted ? 5.5 : 2.5
  const glowDeviation = highlighted ? 9 : 4
  const glowOpacity = highlighted ? 0.95 : 0.4
  const radius = highlighted ? 34 : 32
  
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
  <defs>
    <linearGradient id="parentBadgeGrad_${borderColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="parentBadgeShadow_${borderColor.replace('#', '')}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="${glowDeviation}" flood-color="${highlighted ? borderColor : '#000000'}" flood-opacity="${glowOpacity}"/>
    </filter>
  </defs>
  <circle cx="44" cy="44" r="${radius}" fill="url(#parentBadgeGrad_${borderColor.replace('#', '')})" stroke="${borderColor}" stroke-width="${strokeWidth}" filter="url(#parentBadgeShadow_${borderColor.replace('#', '')})" />
  <g transform="translate(28, 28)">
    ${iconContent}
  </g>
</svg>
`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

const getGlobeSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e3a8a', '#0284c7', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  highlighted
)

const getNetworkSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#4c1d95', '#4f46e5', '#818cf8',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  highlighted
)

const getMutedNetworkSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e293b', '#334155', '#475569',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  highlighted
)

const getMutedGlobeSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e293b', '#334155', '#475569',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  highlighted
)

// Secondary Active Project Highlights (Cyan Style)
const getOtherActiveNetworkSvg = () => generateCircularBadge(
  '#083344', '#0e7490', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  false
)

const getOtherActiveGlobeSvg = () => generateCircularBadge(
  '#083344', '#0e7490', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  false
)

const getRouterSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#064e3b', '#0d9488', '#10b981',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>`,
  highlighted
)

const getServerSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#18181b', '#27272a', '#a1a1aa',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>`,
  highlighted
)

// Active Context Identification (Focus highlights)
function isNodeSelectedNetwork(nodeKey: string): boolean {
  if (!selectedNetwork.value) return false
  return nodeKey === `net_${selectedNetwork.value.id}`
}

function initTopologyGraph() {
  if (!topologyContainer.value) return

  if (visNetworkInstance) {
    visNetworkInstance.destroy()
    visNetworkInstance = null
  }

  const nodesList: any[] = []
  const edgesList: any[] = []
  const addedNodes = new Set<string>()

  // Groups
  const extNets = networkStore.networks.filter(n => n.external)
  const intNets = networkStore.networks.filter(n => !n.external)
  const routers = networkStore.routers
  const vms = instances.value

  // Trace active external networks connected to routers that connect to networks with VMs
  const activeExternalNetworkIds = new Set<string>()
  const projectNetsWithVms = networkStore.networks.filter(net => {
    const ports = allNetworkPorts.value[net.id] || []
    return ports.some(p => String(p.device_owner || '').includes('compute'))
  })
  
  projectNetsWithVms.forEach(net => {
    const ports = allNetworkPorts.value[net.id] || []
    const routerIds = new Set(
      ports.filter(p => String(p.device_owner || '').includes('router')).map(p => p.device_id)
    )
    networkStore.routers.forEach(router => {
      if (routerIds.has(router.id) && router.externalNetworkId) {
        activeExternalNetworkIds.add(router.externalNetworkId)
      }
    })
  })

  // 1. External networks (Highlight active ones, otherwise Mute)
  extNets.forEach((net) => {
    const nodeKey = `net_${net.id}`
    const isSelected = isNodeSelectedNetwork(nodeKey)
    const isActiveExt = activeExternalNetworkIds.has(net.id)

    let img = getMutedGlobeSvg(isSelected)
    let fontColor = '#64748b'

    if (isSelected) {
      img = getGlobeSvg(true)
      fontColor = '#00f0ff'
    } else if (isActiveExt) {
      img = selectedNetwork.value ? getOtherActiveGlobeSvg() : getGlobeSvg(false)
      fontColor = selectedNetwork.value ? '#22d3ee' : '#60a5fa'
    } else if (selectedNetwork.value) {
      fontColor = '#475569'
    }

    nodesList.push({
      id: nodeKey,
      label: `${net.name}\n(external)`,
      image: img,
      shape: 'image',
      size: isSelected ? 40 : 32,
      font: { color: fontColor, size: 11, fontStyle: isSelected ? 'bold' : 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'network', item: net },
    })
    addedNodes.add(nodeKey)
  })

  // 2. Routers
  routers.forEach((router) => {
    const nodeKey = `router_${router.id}`

    nodesList.push({
      id: nodeKey,
      label: `${router.name}`,
      image: getRouterSvg(false), // No dynamic glows on routers
      shape: 'image',
      size: 32,
      font: { color: '#34d399', size: 11, fontStyle: 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'router', item: router },
    })
    addedNodes.add(nodeKey)

    if (router.externalNetworkId && addedNodes.has(`net_${router.externalNetworkId}`)) {
      const activeEdge = isNodeSelectedNetwork(`net_${router.externalNetworkId}`)
      edgesList.push({
        from: nodeKey,
        to: `net_${router.externalNetworkId}`,
        color: { color: activeEdge ? '#00f0ff' : '#3f3f46', opacity: activeEdge ? 1.0 : 0.6 },
        width: activeEdge ? 2.5 : 1.2,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      })
    }
  })

  // 3. Subnets (Highlight if has VM, otherwise Mute)
  intNets.forEach((net) => {
    const nodeKey = `net_${net.id}`
    const isSelected = isNodeSelectedNetwork(nodeKey)
    
    // Check if VM compute port exists on this subnet
    const ports = allNetworkPorts.value[net.id] || []
    const hasVms = ports.some(p => String(p.device_owner || '').includes('compute'))

    let img = getMutedNetworkSvg(isSelected)
    let fontColor = '#64748b'

    if (isSelected) {
      img = getNetworkSvg(true)
      fontColor = '#a78bfa'
    } else if (hasVms) {
      img = selectedNetwork.value ? getOtherActiveNetworkSvg() : getNetworkSvg(false)
      fontColor = selectedNetwork.value ? '#22d3ee' : '#cbd5e1'
    } else if (selectedNetwork.value) {
      fontColor = '#475569'
    }

    nodesList.push({
      id: nodeKey,
      label: `${net.name}\n${net.subnet}`,
      image: img,
      shape: 'image',
      size: isSelected ? 40 : 32,
      font: { color: fontColor, size: 11, fontStyle: isSelected ? 'bold' : 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'network', item: net },
    })
    addedNodes.add(nodeKey)
  })

  // 4. Compute VM Instances
  vms.forEach((vm) => {
    const nodeKey = `vm_${vm.id}`

    nodesList.push({
      id: nodeKey,
      label: vm.name,
      image: getServerSvg(false), // No glows on VM instances
      shape: 'image',
      size: 28,
      font: { color: '#a1a1aa', size: 10, face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'instance', item: vm },
    })
    addedNodes.add(nodeKey)
  })

  // 5. Connect Port map links
  Object.entries(allNetworkPorts.value).forEach(([networkId, portsList]) => {
    portsList.forEach((port) => {
      const isRouter = String(port.device_owner || '').includes('router')
      const isCompute = String(port.device_owner || '').includes('compute')
      const netNodeId = `net_${networkId}`

      const isNetSelected = selectedNetwork.value?.id === networkId

      if (isRouter) {
        const routerNodeId = `router_${port.device_id}`
        if (addedNodes.has(netNodeId) && addedNodes.has(routerNodeId)) {
          edgesList.push({
            from: routerNodeId,
            to: netNodeId,
            color: { color: isNetSelected ? '#10b981' : '#27272a', opacity: isNetSelected ? 1.0 : 0.5 },
            width: isNetSelected ? 2.5 : 1.2,
          })
        }
      } else if (isCompute) {
        const vmNodeId = `vm_${port.device_id}`
        if (addedNodes.has(netNodeId) && addedNodes.has(vmNodeId)) {
          edgesList.push({
            from: vmNodeId,
            to: netNodeId,
            color: { color: isNetSelected ? '#818cf8' : '#27272a', opacity: isNetSelected ? 1.0 : 0.5 },
            width: isNetSelected ? 2.0 : 1.0,
          })
        }
      }
    })
  })

  const data = { nodes: nodesList, edges: edgesList }
  const options = {
    nodes: {
      shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 8 },
    },
    edges: {
      smooth: { enabled: true, type: 'continuous', roundness: 0.35 },
    },
    physics: {
      enabled: true,
      barnesHut: {
        centralGravity: 0.5,
        springLength: 85,
        springConstant: 0.045,
        damping: 0.09,
        avoidOverlap: 1.0,
      },
      stabilization: { iterations: 100, updateInterval: 25 },
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
    },
  }

  visNetworkInstance = new Network(topologyContainer.value, data, options)

  visNetworkInstance.on('selectNode', (params) => {
    if (params.nodes?.length > 0) {
      const selectedId = params.nodes[0]
      const foundNode = nodesList.find((n) => n.id === selectedId)
      if (foundNode && foundNode.customData) {
        const { type, item } = foundNode.customData
        if (type === 'network') {
          selectedNetwork.value = item
          selectedNetworkPorts.value = allNetworkPorts.value[item.id] || []
        } else if (type === 'router') {
          const connectedNet = portsForRouter(item.id)
          if (connectedNet) {
            selectedNetwork.value = connectedNet
            selectedNetworkPorts.value = allNetworkPorts.value[connectedNet.id] || []
          }
        }
      }
    }
  })

  visNetworkInstance.on('doubleClick', (params) => {
    if (params.nodes?.length > 0) {
      const selectedId = params.nodes[0]
      const foundNode = nodesList.find((n) => n.id === selectedId)
      if (foundNode && foundNode.customData) {
        const { type, item } = foundNode.customData
        if (type === 'network') {
          openDetailPane(item)
        }
      }
    }
  })
}

function portsForRouter(routerId: string): NetworkConfig | null {
  for (const [netId, ports] of Object.entries(allNetworkPorts.value)) {
    const isAttached = ports.some((p) => p.device_id === routerId)
    if (isAttached) {
      const found = networkStore.networks.find((n) => n.id === netId)
      if (found) return found
    }
  }
  return null
}

// Align Layout: Focuses camera to fit primary project network subgraph on screen
function alignLayout() {
  if (visNetworkInstance) {
    const mainNet = getMainProjectNetwork()
    if (mainNet) {
      const nodesToFit = getConnectedNodesList(mainNet.id)
      visNetworkInstance.fit({
        nodes: nodesToFit,
        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
      })
    } else {
      visNetworkInstance.fit({
        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
      })
    }
  }
}

// Handle network selection and focus camera fitting subgraph on screen
function selectAndFocusNetwork(net: NetworkConfig) {
  selectedNetwork.value = net
  selectedNetworkPorts.value = allNetworkPorts.value[net.id] || []
  initTopologyGraph() // Re-draw to update highlights
  
  nextTick(() => {
    if (visNetworkInstance) {
      const nodesToFit = getConnectedNodesList(net.id)
      visNetworkInstance.fit({
        nodes: nodesToFit,
        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
      })
    }
  })
}

function openCreateNetworkModal() {
  showCreateModal.value = true
}

function openCreateRouterModal() {
  showCreateRouterModal.value = true
}

function openEditNetworkModal(net: NetworkConfig) {
  selectedEditNetwork.value = net
  showEditNetworkModal.value = true
}

function openEditRouterModal(router: NetworkRouter) {
  selectedEditRouter.value = router
  showEditRouterModal.value = true
}

async function onNetworkCreated() {
  showCreateModal.value = false
  await refreshAll()
}

async function onRouterCreated() {
  showCreateRouterModal.value = false
  await refreshAll()
}

async function onNetworkUpdated() {
  showEditNetworkModal.value = false
  await refreshAll()
}

async function onRouterUpdated() {
  showEditRouterModal.value = false
  await refreshAll()
}

async function handleDeleteNetwork(net: NetworkConfig) {
  if (confirm(`Are you sure you want to delete network "${net.name}"?`)) {
    try {
      await networkService.deleteNetwork(net.id, net.subnetId)
      await refreshAll()
    } catch (err: any) {
      alert('Failed to delete network: ' + (err.message || err))
    }
  }
}

async function handleDeleteRouter(router: NetworkRouter) {
  if (confirm(`Are you sure you want to delete router "${router.name}"?`)) {
    try {
      await networkService.deleteRouter(router.id)
      await refreshAll()
    } catch (err: any) {
      alert('Failed to delete router: ' + (err.message || err))
    }
  }
}

// Re-draw graph when selected network changes to update highlights
watch(selectedNetwork, () => {
  initTopologyGraph()
})

onMounted(async () => {
  await refreshAll()
})

onBeforeUnmount(() => {
  if (visNetworkInstance) {
    visNetworkInstance.destroy()
    visNetworkInstance = null
  }
})
</script>

<style scoped>
.vis-network {
  outline: none;
}
</style>
