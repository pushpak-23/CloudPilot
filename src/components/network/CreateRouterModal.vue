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
          <RouteIcon class="text-emerald-400" :size="20" /> Create Router
        </h2>
        <button @click="emit('close')" class="text-zinc-500 hover:text-white cursor-pointer bg-transparent border-0 text-lg">
          <span>✕</span>
        </button>
      </div>

      <div class="flex-1 flex overflow-hidden min-h-0">
        <!-- Left side input forms -->
        <div class="w-7/12 p-6 overflow-y-auto border-r border-zinc-855/60 space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Router Name</label>
            <input
              v-model="newRouterName"
              class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-700"
              placeholder="e.g., tenant-dvr-router"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Admin State</label>
              <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
                <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="checkbox" v-model="newRouterAdminState" class="accent-emerald-500 h-4 w-4" />
                  State Up
                </label>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">High Availability</label>
              <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
                <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input type="checkbox" v-model="newRouterHA" class="accent-emerald-500 h-4 w-4" />
                  HA Router
                </label>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Distributed Mode (DVR)</label>
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="newRouterDistributed" class="accent-emerald-500 h-4 w-4" />
                Enable DVR
              </label>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">External Network (Gateway)</label>
            <select
              v-model="newRouterExternalNetworkId"
              class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">None (Private Only)</option>
              <option v-for="net in externalNetworks" :key="net.id" :value="net.id">
                {{ net.name }}
              </option>
            </select>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Initial Subnet Interface</label>
            <select
              v-model="newRouterAttachSubnetId"
              class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">No initial interface</option>
              <option v-for="net in internalNetworks" :key="net.id" :value="net.subnetId || ''" :disabled="!net.subnetId">
                {{ net.name }} ({{ net.subnet }})
              </option>
            </select>
          </div>
        </div>

        <!-- Right side visual preview for router -->
        <div class="w-5/12 p-6 bg-zinc-955/40 flex flex-col justify-center items-center space-y-6 select-none animate-in fade-in duration-300">
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">
            Real-time Router Map
          </h3>

          <!-- Topology Graph Preview Blocks (Vertical Flow) -->
          <div class="w-full flex flex-col items-center space-y-4">
            <!-- External Gateway block -->
            <div
              class="w-40 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300"
              :class="newRouterExternalNetworkId ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 text-white' : 'bg-zinc-955/30 border-zinc-850 text-zinc-650'"
            >
              <Globe :size="20" class="transition-colors" :class="newRouterExternalNetworkId ? 'text-blue-400' : 'text-zinc-650'" />
              <span class="text-xs font-semibold mt-1">External Gateway</span>
              <span class="text-[9px] font-mono mt-0.5 opacity-80">
                {{ newRouterExternalNetworkId ? (externalNetworks.find(n => n.id === newRouterExternalNetworkId)?.name || 'Gateway') : 'Disconnected' }}
              </span>
            </div>

            <!-- Connection Arrow 1 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="newRouterExternalNetworkId ? 'border-blue-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Router block -->
            <div
              class="w-44 p-3.5 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="newRouterName.trim() ? 'bg-emerald-600/10 border-emerald-500 shadow-md shadow-emerald-500/10 text-white animate-pulse' : 'bg-zinc-955/30 border-zinc-855 text-zinc-650'"
            >
              <RouteIcon :size="22" class="transition-colors" :class="newRouterName.trim() ? 'text-emerald-400' : 'text-zinc-650'" />
              <span class="text-xs font-bold mt-1 truncate max-w-full">
                {{ newRouterName.trim() ? newRouterName : 'New Router' }}
              </span>
              <div class="mt-2 flex items-center justify-center gap-1.5 flex-wrap" v-if="newRouterName.trim()">
                <span v-if="newRouterHA" class="text-[9px] px-1 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono">
                  HA
                </span>
                <span v-if="newRouterDistributed" class="text-[9px] px-1 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono">
                  DVR
                </span>
                <span class="text-[9px] px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                  {{ newRouterAdminState ? 'UP' : 'DOWN' }}
                </span>
              </div>
            </div>

            <!-- Connection Arrow 2 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="newRouterAttachSubnetId ? 'border-indigo-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Attached subnet interface block -->
            <div
              class="w-40 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300"
              :class="newRouterAttachSubnetId ? 'bg-indigo-600/10 border-indigo-500 shadow-md shadow-indigo-500/10 text-white' : 'bg-zinc-955/30 border-zinc-850 text-zinc-655'"
            >
              <NetworkIcon :size="20" class="transition-colors" :class="newRouterAttachSubnetId ? 'text-indigo-400' : 'text-zinc-655'" />
              <span class="text-xs font-semibold mt-1">Private Subnet</span>
              <span class="text-[9px] font-mono mt-0.5 opacity-80 truncate max-w-full">
                {{ newRouterAttachSubnetId ? (internalNetworks.find(n => n.subnetId === newRouterAttachSubnetId)?.name || 'Tenant Subnet') : 'No private subnet' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
        >
          Cancel
        </button>
        <button
          @click="submitCreateRouter"
          :disabled="!newRouterName.trim()"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Create Router
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Route as RouteIcon, Network as NetworkIcon, Globe } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'
import type { NetworkConfig } from '@/services/network.service'

const props = defineProps<{
  show: boolean
  externalNetworks: NetworkConfig[]
  internalNetworks: NetworkConfig[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const networkStore = useNetworkStore()

const newRouterName = ref('')
const newRouterAdminState = ref(true)
const newRouterHA = ref(false)
const newRouterDistributed = ref(false)
const newRouterExternalNetworkId = ref('')
const newRouterAttachSubnetId = ref('')

watch(() => props.show, (newVal) => {
  if (newVal) {
    newRouterName.value = ''
    newRouterAdminState.value = true
    newRouterHA.value = false
    newRouterDistributed.value = false
    newRouterExternalNetworkId.value = ''
    newRouterAttachSubnetId.value = ''
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
    <linearGradient id="routerBadgeGrad_${borderColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="routerBadgeShadow_${borderColor.replace('#', '')}" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="${glowDeviation}" flood-color="${highlighted ? borderColor : '#000000'}" flood-opacity="${glowOpacity}"/>
    </filter>
  </defs>
  <circle cx="44" cy="44" r="${radius}" fill="url(#routerBadgeGrad_${borderColor.replace('#', '')})" stroke="${borderColor}" stroke-width="${strokeWidth}" filter="url(#routerBadgeShadow_${borderColor.replace('#', '')})" />
  <g transform="translate(28, 28)">
    ${iconContent}
  </g>
</svg>
`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

async function submitCreateRouter() {
  if (!newRouterName.value.trim()) return

  try {
    await networkStore.createRouter({
      name: newRouterName.value.trim(),
      adminStateUp: newRouterAdminState.value,
      ha: newRouterHA.value,
      distributed: newRouterDistributed.value,
      externalNetworkId: newRouterExternalNetworkId.value || null,
      attachSubnetId: newRouterAttachSubnetId.value || null,
    })
    emit('created')
  } catch (err: any) {
    alert('Failed to create router: ' + (err.message || err))
  }
}
</script>
