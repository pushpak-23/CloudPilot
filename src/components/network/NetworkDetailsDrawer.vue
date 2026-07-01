<template>
  <div
    v-if="show && network"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-sm"
    @click.self="emit('close')"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div
        class="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-3 bg-zinc-950 border border-zinc-855 rounded-lg"
            :style="{ color: themeStore.accentColor }"
          >
            <NetworkIcon :size="22" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
              <span>{{ network.name }}</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase"
                :class="network.adminStateUp ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-zinc-700 text-zinc-400 bg-zinc-900'"
              >
                <span
                  class="w-1 h-1 rounded-full"
                  :class="network.adminStateUp ? 'bg-emerald-500' : 'bg-zinc-500'"
                ></span>
                {{ network.adminStateUp ? 'UP' : 'DOWN' }}
              </span>
            </h2>
            <p class="text-xs text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
              ID: {{ network.id }}
              <CopyIcon class="w-3.5 h-3.5 inline-block cursor-pointer hover:text-zinc-300" @click="copyToClipboard(network.id)" />
            </p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="text-zinc-500 hover:text-zinc-300 transition-colors text-lg font-semibold cursor-pointer bg-transparent border-0"
        >
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 overflow-y-auto flex-1">
        <!-- Overview Grid -->
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Shared Status</span>
              <span class="text-sm font-semibold text-white mt-1 block">
                {{ network.shared ? 'Shared' : 'Private' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Overlay Network Type</span>
              <span class="text-sm font-mono text-zinc-300 mt-1 block uppercase">
                {{ network.providerNetworkType || 'Local' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">MTU (Bytes)</span>
              <span class="text-sm text-zinc-400 mt-1 block">
                {{ network.mtu ?? '1500' }}
              </span>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Segmentation ID / VLAN</span>
              <span class="text-sm font-semibold text-zinc-300 mt-1 block">
                {{ network.providerSegmentationId ?? 'N/A' }}
              </span>
            </div>
            <div>
              <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">External Gateway</span>
              <span class="text-sm text-zinc-400 mt-1 block">
                {{ network.external ? 'Yes (Public)' : 'No (Private)' }}
              </span>
            </div>
          </div>
        </div>

        <hr class="border-zinc-800" />

        <!-- Subnet Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon :size="12" /> Primary Subnet Details
            </h3>
            <button
              v-if="!showAddSubnetForm"
              @click="showAddSubnetForm = true"
              class="text-xs px-2.5 py-1 rounded border font-semibold bg-transparent transition-all cursor-pointer hover:bg-[var(--accent-subtle)]"
              :style="{
                color: themeStore.accentColor,
                borderColor: themeStore.accentColorBorder
              }"
            >
              + Create Subnet
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
          <div v-if="!showAddSubnetForm && network.subnetId" class="bg-zinc-955/40 border border-zinc-800/80 rounded-xl p-4">
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span class="text-zinc-500 block">Subnet Name</span>
                <span class="text-white font-mono mt-0.5 block">{{ network.name }}-subnet</span>
              </div>
              <div>
                <span class="text-zinc-500 block">CIDR Block</span>
                <span class="text-white font-mono mt-0.5 block">{{ network.subnet }}</span>
              </div>
              <div>
                <span class="text-zinc-500 block">Gateway IP</span>
                <span class="text-white font-mono mt-0.5 block">{{ network.gateway }}</span>
              </div>
              <div>
                <span class="text-zinc-500 block">Subnet ID</span>
                <span class="text-zinc-400 font-mono mt-0.5 block truncate" :title="network.subnetId">{{ network.subnetId }}</span>
              </div>
            </div>
          </div>

          <div v-else-if="!showAddSubnetForm" class="text-center text-zinc-500 text-xs italic py-4 bg-zinc-955/20 border border-dashed border-zinc-850 rounded-xl">
            No subnets configured. Click Create Subnet to provision an IP range.
          </div>
        </div>

        <hr class="border-zinc-800" />

        <!-- Ports Section -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ServerIcon :size="12" /> Mapped SDN Ports ({{ ports.length }})
            </h3>
            <button
              v-if="!showAddPortForm"
              @click="showAddPortForm = true"
              class="text-xs px-2.5 py-1 rounded border font-semibold bg-transparent transition-all cursor-pointer hover:bg-[var(--accent-subtle)]"
              :style="{
                color: themeStore.accentColor,
                borderColor: themeStore.accentColorBorder
              }"
            >
              + Create Port
            </button>
          </div>

          <!-- Add Port Reusable Form Component -->
          <CreatePortForm
            :show="showAddPortForm"
            :network-id="network.id"
            :subnet-id="network.subnetId"
            @saved="() => { showAddPortForm = false; emit('refresh'); }"
            @cancel="showAddPortForm = false"
          />

          <!-- Existing Ports List -->
          <div class="space-y-2.5" v-if="!showAddPortForm">
            <div
              v-for="port in ports"
              :key="port.id"
              class="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 space-y-2"
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
                <div>Device ID: <span class="text-zinc-300 font-mono">{{ port.device_id || '-' }}</span></div>
                <div>Admin State: <span class="text-emerald-400">{{ port.admin_state_up ? 'UP' : 'DOWN' }}</span></div>
              </div>
            </div>
            <div v-if="ports.length === 0" class="p-8 text-center text-zinc-500 italic bg-zinc-955/20 border border-dashed border-zinc-850 rounded-xl">
              No active SDN ports mapped to this network.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Network as NetworkIcon, Copy as CopyIcon, Link as LinkIcon, Server as ServerIcon } from 'lucide-vue-next'
import { copyToClipboard } from '@/composables/useClipboard'
import { useThemeStore } from '@/stores/theme'
import type { NetworkConfig } from '@/services/network.service'

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
