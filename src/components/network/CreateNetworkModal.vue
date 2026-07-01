<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Title bar -->
      <div class="p-6 border-b border-zinc-850 flex items-center justify-between bg-zinc-955/20">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <NetworkIcon class="text-blue-500" :size="20" /> Create Network Wizard
        </h2>
        <span class="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded font-mono">
          Step {{ createStep }} of 3
        </span>
      </div>

      <div class="flex-1 flex overflow-hidden min-h-0">
        <!-- Left side: Form Input controls (55%) -->
        <div class="w-7/12 p-6 overflow-y-auto border-r border-zinc-850/60 space-y-5">
          <!-- Step Indicators -->
          <div class="flex items-center gap-2 select-none pb-2">
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 1 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 2 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 3 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
          </div>

          <!-- Step 1: Network Details -->
          <div v-if="createStep === 1" class="space-y-4 animate-in fade-in duration-200">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Network Name</label>
              <input
                v-model="newNetName"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-700"
                placeholder="e.g., vxlan-tenant-net"
              />
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Network Type (Overlay)</label>
                <select
                  v-model="newNetType"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="vxlan">VXLAN (Tenant Tunnel)</option>
                  <option value="vlan">VLAN (Tagged Physical)</option>
                  <option value="flat">Flat (Shared Direct)</option>
                  <option value="gre">GRE (Generic Routing)</option>
                  <option value="local">Local</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Segmentation ID / VNI / VLAN ID</label>
                <input
                  type="number"
                  v-model.number="newNetSegmentationId"
                  placeholder="e.g., 101"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Physical Network Interface</label>
                <input
                  v-model="newNetPhysicalNetwork"
                  placeholder="e.g., physnet1"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">MTU Size (Bytes)</label>
                <input
                  type="number"
                  v-model.number="newNetMtu"
                  placeholder="e.g., 1450"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-4 pt-1">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Admin State</label>
                <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
                  <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" v-model="newNetAdminState" class="accent-blue-500 h-4 w-4" />
                    UP
                  </label>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Shared status</label>
                <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
                  <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" v-model="newNetShared" class="accent-blue-500 h-4 w-4" />
                    Shared
                  </label>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">External Gateway</label>
                <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
                  <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" v-model="newNetExternal" class="accent-blue-500 h-4 w-4" />
                    External
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 2: Subnet Configuration -->
          <div v-if="createStep === 2" class="space-y-4 animate-in fade-in duration-200">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Subnet Name</label>
              <input
                v-model="newNetSubnetName"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-700"
                placeholder="e.g., vxlan-subnet-1"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Network Address CIDR</label>
                <input
                  v-model="newNetSubnet"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder-zinc-700"
                  placeholder="e.g., 10.0.10.0/24"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">IP Protocol</label>
                <select
                  v-model="newNetIpVersion"
                  class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option :value="4">IPv4 Address Map</option>
                  <option :value="6">IPv6 Address Map</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
              <div class="space-y-1.5 flex-1">
                <label class="text-xs font-bold text-zinc-400 uppercase">Gateway IP</label>
                <input
                  v-model="newNetGateway"
                  :disabled="newNetNoGateway"
                  class="w-full bg-zinc-955 disabled:bg-zinc-950/40 disabled:text-zinc-650 disabled:cursor-not-allowed border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder-zinc-700"
                  placeholder="e.g., 10.0.10.1"
                />
              </div>
              <div class="flex items-center h-10 px-3 bg-zinc-955/60 border border-zinc-800 rounded-lg">
                <label class="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input type="checkbox" v-model="newNetNoGateway" class="accent-blue-500 h-4 w-4" />
                  No Gateway IP
                </label>
              </div>
            </div>
          </div>

          <!-- Step 3: Subnet Advanced Details -->
          <div v-if="createStep === 3" class="space-y-4 animate-in fade-in duration-200">
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="newNetEnableDhcp" class="accent-blue-500 h-4 w-4" />
                Enable Neutron DHCP Server Agent
              </label>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">IP Allocation Pools</label>
              <textarea
                v-model="newNetAllocationPoolsText"
                rows="2"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder-zinc-700"
                placeholder="IP range per line: start_ip,end_ip&#10;e.g., 10.0.10.10,10.0.10.250"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">DNS Nameservers</label>
              <textarea
                v-model="newNetDnsNameserversText"
                rows="2"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder-zinc-700"
                placeholder="DNS IP per line&#10;e.g., 8.8.8.8"
              ></textarea>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Static Host Routes</label>
              <textarea
                v-model="newNetHostRoutesText"
                rows="2"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder-zinc-700"
                placeholder="cidr,gateway per line&#10;e.g., 192.168.10.0/24,10.0.10.254"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Right side: Realtime Logical Preview Diagram (45%) -->
        <div class="w-5/12 p-6 bg-zinc-955/40 flex flex-col justify-center items-center space-y-6 select-none animate-in fade-in duration-300">
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">
            Real-time SDN Preview
          </h3>

          <!-- Topology Graph Preview Blocks (Vertical Flow) -->
          <div class="w-full flex flex-col items-center space-y-4">
            <!-- External Cloud Node -->
            <div
              class="w-40 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300"
              :class="newNetExternal ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <Globe :size="20" class="transition-colors" :class="newNetExternal ? 'text-blue-400' : 'text-zinc-655'" />
              <span class="text-xs font-semibold mt-1">External Network</span>
              <span class="text-[9px] font-mono mt-0.5 opacity-80 font-semibold">{{ newNetExternal ? 'Enabled (Gateway)' : 'Not Connected' }}</span>
            </div>

            <!-- Connection Arrow 1 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="newNetExternal ? 'border-blue-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Virtual Router Node -->
            <div
              class="w-40 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300"
              :class="newNetExternal ? 'bg-emerald-600/10 border-emerald-500 shadow-md shadow-emerald-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-655'"
            >
              <RouteIcon :size="20" class="transition-colors" :class="newNetExternal ? 'text-emerald-400' : 'text-zinc-655'" />
              <span class="text-xs font-semibold mt-1">Neutron Router</span>
              <span class="text-[9px] font-mono mt-0.5 opacity-80 font-semibold">{{ newNetExternal ? 'Active Gateway' : 'No Gateway Link' }}</span>
            </div>

            <!-- Connection Arrow 2 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="newNetName.trim() ? 'border-indigo-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Private Subnet Node -->
            <div
              class="w-48 p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="newNetName.trim() ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <NetworkIcon :size="22" class="transition-colors" :class="newNetName.trim() ? 'text-indigo-400' : 'text-zinc-655'" />
              <span class="text-xs font-bold mt-1 truncate max-w-full">
                {{ newNetName.trim() ? newNetName : 'New Tenant Net' }}
              </span>
              <span class="text-[10px] font-mono mt-1 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850/65 animate-pulse" :class="newNetName.trim() ? 'text-indigo-300 border-indigo-500/20' : 'text-zinc-600 border-transparent'">
                CIDR: {{ newNetSubnet || '10.0.10.0/24' }}
              </span>
              <div class="mt-2 flex items-center justify-center gap-1.5 flex-wrap" v-if="newNetName.trim()">
                <span class="text-[9px] px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase font-mono">
                  {{ newNetType }}
                </span>
                <span v-if="newNetEnableDhcp" class="text-[9px] px-1 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono">
                  DHCP
                </span>
                <span v-if="!newNetNoGateway && newNetGateway" class="text-[9px] px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  GW: {{ newNetGateway }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wizard buttons -->
      <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-between gap-3">
        <button
          v-if="createStep > 1"
          @click="createStep--"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          v-else
          @click="emit('close')"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          v-if="createStep < 3"
          @click="createStep++"
          :disabled="createStep === 1 && !newNetName.trim()"
          class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Next Step
        </button>
        <button
          v-else
          @click="submitCreateNetwork"
          class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Create Network
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Network as NetworkIcon, Route as RouteIcon, Globe } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const networkStore = useNetworkStore()

const createStep = ref(1)
const newNetName = ref('')
const newNetAdminState = ref(true)
const newNetShared = ref(false)
const newNetExternal = ref(false)
const newNetType = ref('vxlan')
const newNetSegmentationId = ref<number | undefined>(undefined)
const newNetPhysicalNetwork = ref('')
const newNetMtu = ref<number | undefined>(1450)

const newNetSubnetName = ref('')
const newNetSubnet = ref('10.0.10.0/24')
const newNetGateway = ref('10.0.10.1')
const newNetNoGateway = ref(false)
const newNetIpVersion = ref(4)

const newNetEnableDhcp = ref(true)
const newNetAllocationPoolsText = ref('')
const newNetDnsNameserversText = ref('')
const newNetHostRoutesText = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    createStep.value = 1
    newNetName.value = ''
    newNetAdminState.value = true
    newNetShared.value = false
    newNetExternal.value = false
    newNetType.value = 'vxlan'
    newNetSegmentationId.value = undefined
    newNetPhysicalNetwork.value = ''
    newNetMtu.value = 1450

    newNetSubnetName.value = ''
    newNetSubnet.value = '10.0.10.0/24'
    newNetGateway.value = '10.0.10.1'
    newNetNoGateway.value = false
    newNetIpVersion.value = 4

    newNetEnableDhcp.value = true
    newNetAllocationPoolsText.value = ''
    newNetDnsNameserversText.value = ''
    newNetHostRoutesText.value = ''
  }
})

watch(newNetName, (val) => {
  if (val.trim()) {
    newNetSubnetName.value = `${val.trim()}-subnet`
  }
})

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
    <linearGradient id="wizardBadgeGrad_${borderColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="wizardBadgeShadow_${borderColor.replace('#', '')}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="${glowDeviation}" flood-color="${highlighted ? borderColor : '#000000'}" flood-opacity="${glowOpacity}"/>
    </filter>
  </defs>
  <circle cx="44" cy="44" r="${radius}" fill="url(#wizardBadgeGrad_${borderColor.replace('#', '')})" stroke="${borderColor}" stroke-width="${strokeWidth}" filter="url(#wizardBadgeShadow_${borderColor.replace('#', '')})" />
  <g transform="translate(28, 28)">
    ${iconContent}
  </g>
</svg>
`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

async function submitCreateNetwork() {
  if (!newNetName.value.trim()) return

  const allocationPools: { start: string; end: string }[] = []
  if (newNetAllocationPoolsText.value.trim()) {
    newNetAllocationPoolsText.value.split('\n').forEach((line) => {
      const parts = line.split(',')
      if (parts.length === 2 && parts[0] && parts[1]) {
        allocationPools.push({ start: parts[0].trim(), end: parts[1].trim() })
      }
    })
  }

  const dnsNameservers = newNetDnsNameserversText.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const hostRoutes: { destination: string; nexthop: string }[] = []
  if (newNetHostRoutesText.value.trim()) {
    newNetHostRoutesText.value.split('\n').forEach((line) => {
      const parts = line.split(',')
      if (parts.length === 2 && parts[0] && parts[1]) {
        hostRoutes.push({ destination: parts[0].trim(), nexthop: parts[1].trim() })
      }
    })
  }

  try {
    await networkStore.createNetwork({
      name: newNetName.value.trim(),
      shared: newNetShared.value,
      external: newNetExternal.value,
      adminStateUp: newNetAdminState.value,
      providerNetworkType: newNetType.value,
      providerPhysicalNetwork: newNetPhysicalNetwork.value.trim() || undefined,
      providerSegmentationId: newNetSegmentationId.value,
      mtu: newNetMtu.value,
      subnetName: newNetSubnetName.value.trim() || undefined,
      subnet: newNetSubnet.value.trim(),
      gateway: newNetGateway.value.trim(),
      noGateway: newNetNoGateway.value,
      enableDhcp: newNetEnableDhcp.value,
      allocationPools,
      dnsNameservers,
      hostRoutes,
    })
    emit('created')
  } catch (err: any) {
    alert('Failed to create network: ' + (err.message || err))
  }
}
</script>
