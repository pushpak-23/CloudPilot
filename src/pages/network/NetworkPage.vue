<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white">Network Overview</h1>
        <p class="text-zinc-400 mt-1">Configure virtual subnets, overlay networks, and floating IPs with OpenStack Neutron.</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4.5 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
      >
        <span>+</span> Create Network
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Networks</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">{{ networkStore.totalNetworksCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <NetworkIcon :size="20" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subnets</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">82</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <Layers :size="18" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Floating IPs</div>
          <div class="text-3xl font-extrabold mt-1.5 text-blue-400">120</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-blue-500/10 border-blue-500/20">
          <Globe :size="18" class="text-blue-400" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Routers</div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">12</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20">
          <Cpu :size="18" class="text-emerald-400" />
        </div>
      </div>
    </div>

    <!-- Networks Table -->
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">All Networks</h2>
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
              <th class="p-4">Subnet (CIDR)</th>
              <th class="p-4">Gateway IP</th>
              <th class="p-4">Shared</th>
              <th class="p-4">External Port</th>
              <th class="p-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="networkStore.loading">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                <Loader class="animate-spin inline-block mr-2" :size="16" /> Loading SDN topologies from Neutron...
              </td>
            </tr>
            <tr v-else-if="filteredNets.length === 0">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                No networks found.
              </td>
            </tr>
            <tr v-for="net in filteredNets" :key="net.name" class="hover:bg-zinc-900/30 transition-colors">
              <td class="p-4 font-semibold text-white">{{ net.name }}</td>
              <td class="p-4 font-mono text-zinc-300">{{ net.subnet }}</td>
              <td class="p-4 font-mono text-zinc-400">{{ net.gateway }}</td>
              <td class="p-4 text-zinc-550">{{ net.shared ? 'Yes' : 'No' }}</td>
              <td class="p-4">
                <span v-if="net.external" class="px-2.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">External</span>
                <span v-else class="text-zinc-650 italic">Internal</span>
              </td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Network Dialog Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">Create Network Topology</h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Network Name</label>
            <input
              v-model="newNetName"
              placeholder="e.g., custom-overlay-net"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Subnet CIDR</label>
              <input
                v-model="newNetSubnet"
                placeholder="e.g., 10.0.10.0/24"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Gateway IP</label>
              <input
                v-model="newNetGateway"
                placeholder="e.g., 10.0.10.1"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
              />
            </div>
          </div>
          <div class="flex items-center gap-6 pt-2 select-none">
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer">
              <input type="checkbox" v-model="newNetShared" class="accent-blue-500 h-4 w-4" />
              Shared Network
            </label>
            <label class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer">
              <input type="checkbox" v-model="newNetExternal" class="accent-blue-500 h-4 w-4" />
              External Gateway
            </label>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitCreate"
            :disabled="!newNetName.trim() || !newNetSubnet.trim() || !newNetGateway.trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Create Topology
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Network as NetworkIcon, Layers, Globe, Cpu, Loader } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'

const networkStore = useNetworkStore()
const searchQuery = ref('')
const showCreateModal = ref(false)
const newNetName = ref('')
const newNetSubnet = ref('10.0.5.0/24')
const newNetGateway = ref('10.0.5.1')
const newNetShared = ref(false)
const newNetExternal = ref(false)

const filteredNets = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return networkStore.networks.filter(
    n => n.name.toLowerCase().includes(q) || n.subnet.toLowerCase().includes(q)
  )
})

function submitCreate() {
  if (newNetName.value.trim() && newNetSubnet.value.trim() && newNetGateway.value.trim()) {
    networkStore.createNetwork({
      name: newNetName.value.trim(),
      subnet: newNetSubnet.value.trim(),
      gateway: newNetGateway.value.trim(),
      shared: newNetShared.value,
      external: newNetExternal.value
    })
    newNetName.value = ''
    newNetSubnet.value = '10.0.5.0/24'
    newNetGateway.value = '10.0.5.1'
    newNetShared.value = false
    newNetExternal.value = false
    showCreateModal.value = false
  }
}

onMounted(() => {
  networkStore.loadNetworks()
})
</script>
