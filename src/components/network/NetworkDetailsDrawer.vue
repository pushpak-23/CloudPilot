<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-250 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show && network" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" @click="emit('close')"></div>
    </Transition>

    <!-- Side-Drawer Panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-250 ease-in transform"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="show && network"
        class="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] md:w-[780px] lg:w-[900px] bg-zinc-955/[0.97] border-l border-zinc-800/60 shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm"
      >
        <!-- Header with gradient accent -->
        <div class="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between bg-gradient-to-r from-zinc-900/40 via-zinc-950/20 to-zinc-900/40">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-450" :style="{ color: themeStore.accentColor }">
              <NetworkIcon :size="18" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <span>{{ network.name }}</span>
              </h2>
              <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5 block">Network Properties Inspector</span>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="text-zinc-500 hover:text-white transition-all cursor-pointer text-lg outline-none font-bold p-1.5 hover:bg-zinc-800 rounded-lg w-9 h-9 flex items-center justify-center border border-transparent hover:border-zinc-700 bg-transparent"
          >
            &times;
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          <!-- Two-Column Layout -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">

            <!-- LEFT COLUMN: Subnets and Ports (3/5 width) -->
            <div class="md:col-span-3 space-y-6">

              <!-- Subnet Section -->
              <div class="space-y-3 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <LinkIcon :size="14" class="text-blue-400" /> Primary Subnet Details
                  </h3>
                  <button
                    v-if="!showAddSubnetForm"
                    @click="showAddSubnetForm = true"
                    class="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer transition-colors border-0"
                  >
                    + Add Subnet
                  </button>
                </div>

                <!-- Add Subnet Reusable Form Component -->
                <CreateSubnetForm
                  :show="showAddSubnetForm"
                  :network-id="network.id"
                  @saved="() => { showAddSubnetForm = false; emit('refresh'); }"
                  @cancel="showAddSubnetForm = false"
                />

                <!-- Existing Subnet Info -->
                <div v-if="!showAddSubnetForm && network.subnetId" class="pt-1">
                  <div class="grid grid-cols-2 gap-3 text-xs bg-zinc-955/60 p-3.5 border border-zinc-800 rounded-lg font-mono">
                    <div>
                      <span class="text-zinc-550 block text-[9px] uppercase font-bold tracking-wider">Subnet Name</span>
                      <span class="text-white mt-1 block">{{ network.name }}-subnet</span>
                    </div>
                    <div>
                      <span class="text-zinc-555 block text-[9px] uppercase font-bold tracking-wider">CIDR Block</span>
                      <span class="text-white mt-1 block">{{ network.subnet }}</span>
                    </div>
                    <div>
                      <span class="text-zinc-555 block text-[9px] uppercase font-bold tracking-wider">Gateway IP</span>
                      <span class="text-white mt-1 block">{{ network.gateway }}</span>
                    </div>
                    <div>
                      <span class="text-zinc-555 block text-[9px] uppercase font-bold tracking-wider">Subnet ID</span>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-zinc-400 block truncate max-w-[120px]" :title="network.subnetId">{{ network.subnetId }}</span>
                        <CopyButton v-if="network.subnetId" :text="network.subnetId" class="scale-75" />
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else-if="!showAddSubnetForm" class="text-center text-zinc-500 text-[11px] italic py-6 bg-zinc-955/20 border border-dashed border-zinc-850 rounded-xl">
                  No subnets configured. Click Create Subnet to provision an IP range.
                </div>
              </div>

              <!-- Ports Section -->
              <div class="space-y-3 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ServerIcon :size="14" class="text-blue-400" /> SDN Ports ({{ ports.length }})
                  </h3>
                  <button
                    v-if="!showAddPortForm"
                    @click="showAddPortForm = true"
                    class="px-2.5 py-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white rounded font-bold cursor-pointer transition-colors border-0"
                  >
                    + Add Port
                  </button>
                </div>

                <!-- Add Port Reusable Form Component -->
                <CreatePortForm
                  :show="showAddPortForm"
                  :network-id="network.id"
                  :subnet-id="network.subnetId ?? null"
                  @saved="() => { showAddPortForm = false; emit('refresh'); }"
                  @cancel="showAddPortForm = false"
                />

                <!-- Existing Ports List -->
                <div class="space-y-2.5 pt-1" v-if="!showAddPortForm">
                  <div
                    v-for="port in ports"
                    :key="port.id"
                    class="bg-zinc-955/50 p-3.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-2 hover:border-zinc-700/60 transition-colors"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-white font-bold text-sm flex items-center gap-1.5">
                        {{ portLabel(port) }}
                        <CopyButton :text="port.id" class="p-0.5 border-0 bg-transparent scale-75" />
                      </span>
                      <span class="px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider" :class="portTypeClass(port)">
                        {{ portTypeLabel(port) }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-mono">
                      <div>MAC: <span class="text-zinc-200">{{ port.mac_address }}</span></div>
                      <div>IP: <span class="text-zinc-200">{{ fixedIpsForPort(port) }}</span></div>
                      <div>Device ID: <span class="text-zinc-300 truncate max-w-[120px] inline-block align-bottom" :title="port.device_id">{{ port.device_id || '-' }}</span></div>
                      <div>State: <span class="text-emerald-450 uppercase font-semibold">{{ port.admin_state_up ? 'UP' : 'DOWN' }}</span></div>
                    </div>
                  </div>
                  <div v-if="ports.length === 0" class="p-8 text-center text-zinc-550 italic bg-zinc-955/20 border border-dashed border-zinc-800 rounded-xl text-xs">
                    No active SDN ports mapped to this network.
                  </div>
                </div>
              </div>

            </div>

            <!-- RIGHT COLUMN: Network Properties Specs (2/5 width) -->
            <div class="md:col-span-2 space-y-5">

              <!-- Specs Card -->
              <div class="space-y-3">
                <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Overlay Properties</div>
                <div class="text-xs text-zinc-400 font-mono space-y-3 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
                  
                  <div class="flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Admin State</span>
                    <span
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase"
                      :class="network.adminStateUp ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : 'border-zinc-700 text-zinc-400 bg-zinc-900'"
                    >
                      <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="network.adminStateUp ? 'bg-emerald-500' : 'bg-zinc-500'"></span>
                      {{ network.adminStateUp ? 'UP' : 'DOWN' }}
                    </span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Access Style</span>
                    <span class="text-zinc-300 font-semibold">{{ network.shared ? 'Shared (Tenant)' : 'Private' }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Overlay Type</span>
                    <span class="text-zinc-300 font-bold uppercase">{{ network.providerNetworkType || 'Local' }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">MTU Size</span>
                    <span class="text-zinc-300 font-semibold">{{ network.mtu ?? '1500' }} Bytes</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Segment VLAN</span>
                    <span class="text-zinc-300 font-semibold">{{ network.providerSegmentationId ?? 'N/A' }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Gateway Connection</span>
                    <span class="text-zinc-300 font-semibold">{{ network.external ? 'Yes (Public)' : 'No (Private)' }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2">
                    <span class="text-zinc-500 text-[10px] uppercase block">Network UUID</span>
                    <span class="text-zinc-400 block mt-1 text-[10px] break-all">{{ network.id }}</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
          <button
            @click="emit('refresh')"
            class="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer bg-transparent"
          >
            Refresh
          </button>
          <button
            @click="emit('close')"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-755 text-sm text-white rounded-lg transition-all cursor-pointer border-0"
          >
            Close Details
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Network as NetworkIcon, Link as LinkIcon, Server as ServerIcon } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import type { NetworkConfig } from '@/services/network.service'
import CopyButton from '@/components/CopyButton.vue'

// Reusable Components
import CreateSubnetForm from './CreateSubnetForm.vue'
import CreatePortForm from './CreatePortForm.vue'

const props = defineProps<{
  show: boolean
  network: NetworkConfig | null
  ports: any[]
  instances: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const themeStore = useThemeStore()

// View toggles
const showAddSubnetForm = ref(false)
const showAddPortForm = ref(false)

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
