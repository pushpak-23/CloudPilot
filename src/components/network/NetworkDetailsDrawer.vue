<template>
  <div
    v-if="show && network"
    class="fixed inset-0 z-50 flex justify-end bg-zinc-955/80 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-zinc-900 border-l border-zinc-800 w-full max-w-4xl h-full shadow-2xl flex flex-col">
      <!-- Drawer Header -->
      <div class="p-6 border-b border-zinc-850 flex items-start justify-between">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <NetworkIcon class="text-blue-500" :size="22" /> Network: {{ network.name }}
          </h2>
          <p class="text-xs text-zinc-500 font-mono mt-1">ID: {{ network.id }}</p>
        </div>
        <button @click="emit('close')" class="text-zinc-500 hover:text-white cursor-pointer p-1.5 hover:bg-zinc-800 rounded-lg bg-transparent border-0">
          <span>✕</span>
        </button>
      </div>

      <!-- Detail Tabs Navigation -->
      <div class="flex border-b border-zinc-855 px-6 bg-zinc-900/35 select-none">
        <button
          v-for="t in ['overview', 'subnets', 'ports']"
          :key="t"
          @click="detailActiveTab = t"
          class="px-4 py-3 text-sm font-semibold capitalize border-b-2 transition-all cursor-pointer bg-transparent"
          :class="detailActiveTab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-300'"
        >
          {{ t }}
        </button>
      </div>

      <!-- Detail Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Overview Tab -->
        <div v-if="detailActiveTab === 'overview'" class="space-y-4 animate-in fade-in duration-150">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
              <div class="text-xs text-zinc-500 font-bold uppercase">Admin State</div>
              <div class="text-white font-semibold mt-1">
                {{ network.adminStateUp ? 'UP' : 'DOWN' }}
              </div>
            </div>
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
              <div class="text-xs text-zinc-500 font-bold uppercase">Shared Status</div>
              <div class="text-white font-semibold mt-1">
                {{ network.shared ? 'Shared' : 'Private' }}
              </div>
            </div>
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-855">
              <div class="text-xs text-zinc-500 font-bold uppercase">Overlay network type</div>
              <div class="text-white font-semibold mt-1 uppercase">
                {{ network.providerNetworkType || 'Local' }}
              </div>
            </div>
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-855">
              <div class="text-xs text-zinc-500 font-bold uppercase">Segmentation ID / VLAN</div>
              <div class="text-white font-semibold mt-1">
                {{ network.providerSegmentationId ?? 'N/A' }}
              </div>
            </div>
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
              <div class="text-xs text-zinc-500 font-bold uppercase">MTU (Bytes)</div>
              <div class="text-white font-semibold mt-1">
                {{ network.mtu ?? '1500' }}
              </div>
            </div>
            <div class="bg-zinc-950/60 p-4 rounded-xl border border-zinc-850">
              <div class="text-xs text-zinc-500 font-bold uppercase">External Gateway Network</div>
              <div class="text-white font-semibold mt-1">
                {{ network.external ? 'Yes' : 'No' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Subnets Tab -->
        <div v-if="detailActiveTab === 'subnets'" class="space-y-4 animate-in fade-in duration-150">
          <div class="bg-zinc-950/60 p-5 rounded-xl border border-zinc-850 space-y-3">
            <h3 class="text-sm font-bold text-white uppercase tracking-wide">Primary Subnet Details</h3>
            <div class="grid grid-cols-2 gap-4 text-xs text-zinc-300">
              <div>Subnet Name: <span class="text-white font-mono">{{ network.name }}-subnet</span></div>
              <div>CIDR: <span class="text-white font-mono">{{ network.subnet }}</span></div>
              <div>Gateway IP: <span class="text-white font-mono">{{ network.gateway }}</span></div>
              <div>Subnet ID: <span class="text-white font-mono">{{ network.subnetId || 'None' }}</span></div>
            </div>
          </div>
        </div>

        <!-- Ports Tab -->
        <div v-if="detailActiveTab === 'ports'" class="space-y-3 animate-in fade-in duration-150">
          <div
            v-for="port in ports"
            :key="port.id"
            class="bg-zinc-955/40 p-4 rounded-xl border border-zinc-855 text-xs text-zinc-300 space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-white font-semibold text-sm">{{ portLabel(port) }}</span>
              <span class="px-2 py-0.5 rounded border" :class="portTypeClass(port)">
                {{ portTypeLabel(port) }}
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
              <div>MAC Address: <span class="text-zinc-200 font-mono">{{ port.mac_address }}</span></div>
              <div>IP Assignment: <span class="text-zinc-200 font-mono">{{ fixedIpsForPort(port) }}</span></div>
              <div>Device ID: <span class="text-zinc-300 font-mono">{{ port.device_id }}</span></div>
              <div>Admin State: <span class="text-emerald-400">{{ port.admin_state_up ? 'UP' : 'DOWN' }}</span></div>
            </div>
          </div>
          <div v-if="ports.length === 0" class="p-8 text-center text-zinc-500 italic">
            No SDN ports mapped to this network.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Network as NetworkIcon } from 'lucide-vue-next'
import type { NetworkConfig } from '@/services/network.service'

const props = defineProps<{
  show: boolean
  network: NetworkConfig | null
  ports: any[]
  instances: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const detailActiveTab = ref('overview')

watch(() => props.show, (newVal) => {
  if (newVal) {
    detailActiveTab.value = 'overview'
  }
})

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
  const instance = props.instances.find((vm) => vm.id === port.device_id)
  return instance?.name || port.device_id || 'n/a'
}
</script>
