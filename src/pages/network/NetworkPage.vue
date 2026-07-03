<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <NetworkIcon :style="{ color: 'var(--accent)' }" :size="32" /> Network Control Plane
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Manage tenant networks, subnets, routers, and ports. Inspect structured software-defined networking (SDN) topologies.
        </p>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <button
          @click="openCreateNetworkModal"
          class="btn-primary"
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

    <!-- SDN Topology Graph Component -->
    <NetworkTopology
      ref="topologyRef"
      :networks="networkStore.networks"
      :routers="networkStore.routers"
      :vms="instances"
      :all-network-ports="allNetworkPorts"
      :selected-network="selectedNetwork"
      :loading="networkStore.loading"
      @select-network="onNetworkSelect"
      @double-click-network="openDetailPane"
    />

    <!-- Main Lists Section -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <div class="space-y-6">
        <!-- Networks Table -->
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
          <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20">
            <h2 class="font-semibold text-lg text-white">Networks</h2>
            <input
              v-model="searchQuery"
              placeholder="Filter networks..."
              class="form-input sm:w-64"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80 select-none sticky top-0 z-10 cursor-pointer">
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
                    class="even:bg-zinc-900/20 odd:bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                    @click="openDetailPane(net)"
                    :class="selectedNetwork?.id === net.id ? 'bg-blue-955/20 border-l-2 border-blue-500 bg-blue-500/5' : ''"
                  >
                    <td class="p-4 font-semibold text-white">
                      <button @click="openDetailPane(net)" class="flex items-center gap-2 w-full text-left text-blue-400 hover:text-blue-300">
                        {{ net.name }}
                      </button>
                    </td>
                    <td class="p-4 font-mono text-zinc-300">{{ net.subnet }}</td>
                    <td class="p-4"><span class="text-xs uppercase px-2.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-400">{{ net.providerNetworkType || (net.external ? 'external' : 'local') }}</span></td>
                    <td class="p-4 font-mono text-zinc-300">{{ net.providerSegmentationId ?? '-' }}</td>
                    <td class="p-4 text-right" @click.stop>
                      <div class="flex items-center justify-end gap-2">

                        <button @click="openEditNetworkModal(net)"
                          class="btn-table"
                        >Edit</button>
                        <button @click="handleDeleteNetwork(net)"
          class="btn-table-danger">
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
                <div class="flex items-center gap-1.5">
                  <span>ID: {{ selectedNetwork.id }}</span>
                  <CopyButton :text="selectedNetwork.id" class="p-0.5 border-0 bg-transparent scale-90" />
                </div>
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
          <div class="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
  <span>ID: {{ router.id.substring(0, 8) }}...</span>
  <CopyButton :text="router.id" class="p-0.5 border-0 bg-transparent scale-75" />
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
          class="btn-table"
        >
          Configure
        </button>
        <button
          @click="handleDeleteRouter(router)"
          class="btn-table-danger"
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
      @refresh="onDetailsRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue'
import {
  Loader,
  Network as NetworkIcon,
  Route as RouteIcon,
} from 'lucide-vue-next'
import CopyButton from '@/components/CopyButton.vue'
import { useNetworkStore } from '@/stores/network'
import { computeService } from '@/services/compute.service'
import {
  networkService,
  type NetworkConfig,
  type NetworkRouter,
} from '@/services/network.service'

// Sub-components
import CreateNetworkModal from '@/components/network/CreateNetworkModal.vue'
import CreateRouterModal from '@/components/network/CreateRouterModal.vue'
import EditNetworkModal from '@/components/network/EditNetworkModal.vue'
import EditRouterModal from '@/components/network/EditRouterModal.vue'
import NetworkDetailsDrawer from '@/components/network/NetworkDetailsDrawer.vue'
import NetworkTopology from '@/components/network/NetworkTopology.vue'

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

// Topology ref
const topologyRef = ref<InstanceType<typeof NetworkTopology> | null>(null)

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
  
  // Also select topology node
  selectedNetwork.value = net

  // Fit camera focus smoothly
  nextTick(() => {
    topologyRef.value?.focusOnNetwork(net)
  })
}

function onNetworkSelect(net: NetworkConfig) {
  selectedNetwork.value = net
  selectedNetworkPorts.value = allNetworkPorts.value[net.id] || []
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
  networkStore.invalidateCache()
  await Promise.all([
    networkStore.loadNetworks(),
    networkStore.loadRouters(),
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
    setTimeout(() => {
      topologyRef.value?.focusOnNetwork(mainNet)
    }, 600)
  } else if (networkStore.networks.length > 0 && networkStore.networks[0]) {
    const firstNet = networkStore.networks[0]
    selectedNetwork.value = firstNet
    selectedNetworkPorts.value = allNetworkPorts.value[firstNet.id] || []
    setTimeout(() => {
      topologyRef.value?.focusOnNetwork(firstNet)
    }, 600)
  }
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

function alignLayout() {
  topologyRef.value?.alignLayout()
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

async function onDetailsRefresh() {
  await refreshAll()
  if (selectedDetailNetwork.value) {
    const updated = networkStore.networks.find((n) => n.id === selectedDetailNetwork.value?.id)
    if (updated) {
      selectedDetailNetwork.value = updated
    }
    selectedNetworkPorts.value = allNetworkPorts.value[selectedDetailNetwork.value.id] || []
  }
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

onMounted(async () => {
  await refreshAll()
})
</script>

<style scoped>
.vis-network {
  outline: none;
}
</style>
