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
      <div v-if="selectedLb" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in" @click="emit('close')"></div>
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
        v-if="selectedLb"
        class="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] md:w-[780px] lg:w-[900px] bg-zinc-950/[0.97] border-l border-zinc-800/60 shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm"
      >
        <!-- Header -->
        <!-- Header with gradient accent -->
        <div class="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between bg-gradient-to-r from-zinc-900/40 via-zinc-950/20 to-zinc-900/40">
          <div>
            <h2 class="font-bold text-lg text-white flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <ShieldIcon class="text-blue-400" :size="16" />
              </div>
              Properties Inspector
            </h2>
            <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1 block ml-[42px]">Live Infrastructure Topology</span>
          </div>
          <button
            @click="emit('close')"
            class="text-zinc-500 hover:text-white transition-all cursor-pointer text-lg outline-none font-bold p-1.5 hover:bg-zinc-800 rounded-lg w-9 h-9 flex items-center justify-center border border-transparent hover:border-zinc-700 bg-transparent"
          >
            &times;
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-5 text-left">
          <!-- Modular Actions Toolbar -->
          <div class="flex flex-wrap gap-2 pb-4 border-b border-zinc-800/50 justify-between items-center w-full">
            <div class="flex flex-wrap gap-2">
              <button @click="emit('add-listener')" class="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs rounded-lg cursor-pointer transition-all font-medium">
                <PlusIcon :size="12" /> Add Listener
              </button>
              <button @click="emit('add-pool')" class="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900/60 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs rounded-lg cursor-pointer transition-all font-medium">
                <PlusIcon :size="12" /> Add Pool
              </button>
            </div>
            <button @click="emit('failover', selectedLb.id)" class="px-3 py-1.5 text-xs border border-amber-600/25 hover:border-amber-500/50 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-semibold">
              <ZapIcon :size="12" /> Trigger Failover
            </button>
          </div>

          <!-- Two-Column Layout: Stack Diagram + Details -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-5">

          <!-- LEFT COLUMN: Visual Stack Diagram (3/5 width) -->
          <div class="md:col-span-3 flex flex-col items-center select-none space-y-0">
            
            <!-- VIP Node Card -->
            <div class="w-full bg-gradient-to-br from-blue-950/25 to-zinc-900/80 border border-blue-500/25 rounded-xl p-5 shadow-lg shadow-blue-500/[0.03] hover:border-blue-500/40 transition-all duration-300">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
                  <div class="w-6 h-6 rounded-md bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <ShieldIcon :size="12" />
                  </div>
                  VIP Load Balancer
                </div>
                <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span class="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500"></span>
                  <span class="text-[9px] uppercase font-bold text-emerald-400">{{ selectedLb.provisioningStatus }}</span>
                </div>
              </div>
              <h3 class="text-white font-black text-base mt-2.5 truncate">{{ selectedLb.name }}</h3>
              
              <div class="mt-3 grid grid-cols-2 gap-3 text-[11px] border-t border-blue-500/10 pt-3">
                <div>
                  <span class="text-zinc-500 block text-[10px] uppercase font-semibold">VIP Address</span>
                  <span class="text-zinc-300 font-mono flex items-center gap-1 mt-0.5">
                    {{ selectedLb.vipAddress || 'Auto-assigning...' }}
                    <CopyButton v-if="selectedLb.vipAddress" :text="selectedLb.vipAddress" class="p-0.5 border-0 bg-transparent scale-75" />
                  </span>
                </div>
                <div>
                  <span class="text-zinc-500 block text-[10px] uppercase font-semibold">Provider</span>
                  <span class="text-zinc-300 font-semibold uppercase mt-0.5 block">{{ selectedLb.provider }}</span>
                </div>
              </div>
            </div>

            <!-- Connection Arrow 1 -->
            <div v-if="listeners.length > 0" class="h-6 w-0.5 bg-gradient-to-b from-blue-500/50 to-purple-500/50 relative">
              <div class="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-r-2 border-b-2 border-purple-500/70 transform rotate-45"></div>
            </div>

            <!-- Listener Nodes -->
            <div v-for="lis in listeners" :key="lis.id" class="w-full space-y-3.5">
              <div class="w-full bg-gradient-to-br from-purple-950/15 to-zinc-900 border border-purple-500/25 rounded-xl p-4 shadow-lg hover:border-purple-500/40 transition-all duration-300">
                <div class="flex justify-between items-center">
                  <div class="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <ShuffleIcon :size="14" />
                    Protocol Listener
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-950/20 text-purple-300 font-mono font-bold">
                    {{ lis.protocol }}:{{ lis.protocolPort }}
                  </span>
                </div>
                <h3 class="text-white font-extrabold text-sm mt-2 truncate">{{ lis.name }}</h3>
                <div class="text-[10px] text-zinc-500 mt-1 font-mono">Listener ID: {{ lis.id }}</div>
              </div>

              <!-- Connection Arrow 2 -->
              <div v-if="pools.length > 0" class="h-6 w-0.5 bg-gradient-to-b from-purple-500/50 to-amber-500/50 relative mx-auto">
                <div class="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-r-2 border-b-2 border-amber-500/70 transform rotate-45"></div>
              </div>

              <!-- Pool Nodes with Members -->
              <div v-for="pool in pools" :key="pool.id" class="w-full space-y-3.5">
                <div class="w-full bg-gradient-to-br from-amber-950/15 to-zinc-900 border border-amber-500/25 rounded-xl p-4 shadow-lg hover:border-amber-500/40 transition-all duration-300">
                  <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <LayersIcon :size="14" />
                      Backend Pool
                    </div>
                    <span class="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-950/20 text-amber-300 font-mono font-bold">
                      {{ pool.lbAlgorithm }}
                    </span>
                  </div>
                  <h3 class="text-white font-extrabold text-sm mt-2 truncate">{{ pool.name }}</h3>
                  
                  <div class="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-2">
                    <span>Protocol: <strong class="text-white">{{ pool.protocol }}</strong></span>
                  </div>

                  <!-- Pool actions: Add Member, Monitor -->
                  <div class="mt-3 pt-3 border-t border-amber-500/10 flex justify-between gap-2">
                    <button @click="emit('add-monitor', pool.id)" class="px-2 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-450 text-[10px] hover:bg-emerald-900/30 transition-colors flex items-center gap-1 font-bold cursor-pointer">
                      <HeartIcon :size="10" /> + Monitor
                    </button>
                    <button @click="emit('add-member', pool.id)" class="px-2.5 py-1 rounded bg-blue-950/40 border border-blue-500/30 text-blue-400 text-[10px] hover:bg-blue-900/30 transition-colors flex items-center gap-1 font-bold cursor-pointer">
                      <ServerIcon :size="10" /> + Server Member
                    </button>
                  </div>
                </div>

                <!-- Pool Members (Sub-nodes with connecting tree line) -->
                <div v-if="membersByPool[pool.id] && membersByPool[pool.id]?.length" class="pl-6 space-y-2 text-left relative">
                  <!-- Connecting visual guide line -->
                  <div class="absolute left-2.5 inset-y-0 w-0.5 border-l border-dashed border-zinc-700/60"></div>

                  <div v-for="member in membersByPool[pool.id]" :key="member.id" class="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-zinc-700 transition-all duration-200 relative z-10">
                    <div class="space-y-0.5 min-w-0">
                      <div class="text-white font-bold truncate flex items-center gap-1.5">
                        <ServerIcon :size="10" class="text-blue-400" />
                        {{ member.address }}:{{ member.protocolPort }}
                      </div>
                      <div class="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                        <span>Weight: <strong class="text-zinc-400">{{ member.weight }}</strong></span>
                        <span>|</span>
                        <span>Status: 
                          <span :class="member.provisioningStatus === 'ACTIVE' ? 'text-emerald-450 font-bold' : 'text-zinc-450'">
                            {{ member.provisioningStatus }}
                          </span>
                        </span>
                      </div>
                    </div>
                    <button @click="emit('delete-member', pool.id, member.id)" class="p-1.5 hover:bg-rose-955/30 border border-transparent hover:border-rose-900/20 text-rose-455 hover:text-rose-400 rounded-lg transition-all cursor-pointer bg-transparent">
                      <TrashIcon :size="12" />
                    </button>
                  </div>
                </div>
                <div v-else class="pl-6 text-[11px] text-zinc-500 italic py-1 relative">
                  <div class="absolute left-2.5 inset-y-0 w-0.5 border-l border-dashed border-zinc-800"></div>
                  No backend servers configured. Add a member to service traffic.
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT COLUMN: Stats + Properties (2/5 width) -->
          <div class="md:col-span-2 space-y-5">

            <!-- Live Traffic Stats Card -->
            <div class="space-y-3">
              <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-black flex items-center gap-1.5">
                <ActivityIcon :size="12" class="text-blue-500" /> Live Traffic
              </div>
              <div class="grid grid-cols-2 gap-2.5">
                <div class="bg-zinc-900/60 border border-zinc-800/60 p-3.5 rounded-xl flex flex-col text-left hover:border-zinc-700/60 transition-colors">
                  <span class="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Active Conn.</span>
                  <span class="text-lg font-black text-white mt-1 tabular-nums">
                    {{ stats?.activeConnections ?? 0 }}
                  </span>
                </div>
                <div class="bg-zinc-900/60 border border-zinc-800/60 p-3.5 rounded-xl flex flex-col text-left hover:border-zinc-700/60 transition-colors">
                  <span class="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Total Conn.</span>
                  <span class="text-lg font-black text-white mt-1 tabular-nums">
                    {{ stats?.totalConnections ?? 0 }}
                  </span>
                </div>
                <div class="bg-zinc-900/60 border border-zinc-800/60 p-3.5 rounded-xl flex flex-col text-left hover:border-zinc-700/60 transition-colors">
                  <span class="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Ingress</span>
                  <span class="text-lg font-black text-blue-400 mt-1 tabular-nums">
                    {{ formatBytes(stats?.bytesIn ?? 0) }}
                  </span>
                </div>
                <div class="bg-zinc-900/60 border border-zinc-800/60 p-3.5 rounded-xl flex flex-col text-left hover:border-zinc-700/60 transition-colors">
                  <span class="text-[9px] text-zinc-550 uppercase font-bold tracking-wider">Egress</span>
                  <span class="text-lg font-black text-purple-400 mt-1 tabular-nums">
                    {{ formatBytes(stats?.bytesOut ?? 0) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Deep Properties -->
            <div class="space-y-3">
              <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Resource Properties</div>
              <div class="text-xs text-zinc-400 font-mono space-y-2.5 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
                <div class="flex justify-between items-start gap-2">
                  <span class="text-zinc-500 shrink-0 text-[10px] uppercase">Subnet</span>
                  <span class="text-zinc-300 truncate text-right text-[11px]">{{ selectedLb.vipSubnetId }}</span>
                </div>
                <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-start gap-2">
                  <span class="text-zinc-500 shrink-0 text-[10px] uppercase">Port ID</span>
                  <span class="text-zinc-300 truncate text-right text-[11px]">{{ selectedLb.vipPortId }}</span>
                </div>
                <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                  <span class="text-zinc-500 text-[10px] uppercase">Admin State</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" :class="selectedLb.adminStateUp ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' : 'text-red-400 bg-red-500/10 border border-red-500/20'">
                    {{ selectedLb.adminStateUp ? 'UP' : 'DOWN' }}
                  </span>
                </div>
                <div v-if="selectedLb.description" class="border-t border-zinc-800/40 pt-2">
                  <span class="text-zinc-500 text-[10px] uppercase block">Description</span>
                  <span class="text-zinc-300 block mt-1 normal-case not-italic text-[11px] leading-relaxed">{{ selectedLb.description }}</span>
                </div>
              </div>
            </div>

          </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  Shield as ShieldIcon,
  Activity as ActivityIcon,
  Shuffle as ShuffleIcon,
  Layers as LayersIcon,
  Plus as PlusIcon,
  Zap as ZapIcon,
  Heart as HeartIcon,
  Server as ServerIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import CopyButton from '@/components/CopyButton.vue'
import type { LoadBalancer, Listener, Pool, PoolMember } from '@/services/loadbalancer.service'

defineProps<{
  selectedLb: LoadBalancer | null
  listeners: Listener[]
  pools: Pool[]
  membersByPool: Record<string, PoolMember[]>
  stats: { activeConnections: number; bytesIn: number; bytesOut: number; totalConnections: number } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add-listener'): void
  (e: 'add-pool'): void
  (e: 'add-monitor', poolId: string): void
  (e: 'add-member', poolId: string): void
  (e: 'delete-member', poolId: string, memberId: string): void
  (e: 'failover', id: string): void
}>()

function formatBytes(bytes: number) {
  if (!bytes || isNaN(bytes)) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>
