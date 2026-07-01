<template>
  <div class="p-8 space-y-8 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight text-white bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p class="text-zinc-400 mt-1">Live status control plane for OpenStack resources and system hypervisors.</p>
      </div>
      <div class="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full">
        <span class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
        API Status: Connected
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <RouterLink
        to="/compute"
        class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/[0.03] flex flex-col justify-between h-36"
      >
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Compute Instances</span>
          <Server class="text-zinc-500 group-hover:text-blue-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">{{ computeStore.totalInstancesCount }}</div>
          <div class="text-[11px] text-zinc-500 mt-1">
            {{ computeStore.runningCount }} Active, {{ computeStore.stoppedCount }} Shutoff
          </div>
        </div>
      </RouterLink>

      <RouterLink
        to="/storage"
        class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/[0.03] flex flex-col justify-between h-36"
      >
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Storage Volumes</span>
          <HardDrive class="text-zinc-500 group-hover:text-blue-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">{{ storageStore.totalVolumesCount }}</div>
          <div class="text-[11px] text-zinc-500 mt-1">
            {{ (storageStore.totalAllocatedGb / 1024).toFixed(1) }} TB total allocated
          </div>
        </div>
      </RouterLink>

      <RouterLink
        to="/network"
        class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/[0.03] flex flex-col justify-between h-36"
      >
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">SDN Networks</span>
          <NetworkIcon class="text-zinc-500 group-hover:text-blue-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">{{ networkStore.totalNetworksCount }}</div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Subnets configured across project zones
          </div>
        </div>
      </RouterLink>

      <RouterLink
        to="/identity"
        class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/[0.03] flex flex-col justify-between h-36"
      >
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Identity Projects</span>
          <Users class="text-zinc-500 group-hover:text-blue-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">{{ identityStore.totalProjectsCount }}</div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Keystone domains and tenant resources
          </div>
        </div>
      </RouterLink>
    </div>

    <!-- Cluster Resource Metrics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Live Metrics Line Chart -->
      <DashboardChart class="lg:col-span-2" />

      <!-- Quick Operations / Health Info & Bars -->
      <div class="space-y-6 lg:col-span-1 flex flex-col justify-between">
        <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-lg text-white">Live Hypervisor Usage</h2>
            <span class="text-xs text-zinc-500">Updates every 4s</span>
          </div>

          <div class="space-y-5">
            <!-- CPU usage bar -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-zinc-400">Total CPU Load</span>
                <span class="text-white font-mono">{{ monitoringStore.metrics.cpuLoad }}%</span>
              </div>
              <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  :style="{ width: `${monitoringStore.metrics.cpuLoad}%` }"
                ></div>
              </div>
            </div>

            <!-- Memory usage bar -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-zinc-400">RAM Allocated</span>
                <span class="text-white font-mono">
                  {{ monitoringStore.metrics.memoryAllocatedGb }} GB / {{ monitoringStore.metrics.memoryTotalGb }} GB
                </span>
              </div>
              <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                <div
                  class="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  :style="{ width: `${(monitoringStore.metrics.memoryAllocatedGb / monitoringStore.metrics.memoryTotalGb) * 100}%` }"
                ></div>
              </div>
            </div>

            <!-- Network Bandwidth bar -->
            <div class="space-y-1.5">
              <div class="flex justify-between text-xs font-semibold">
                <span class="text-zinc-400">Network Throughput</span>
                <span class="text-emerald-400 font-mono">{{ monitoringStore.metrics.networkBps }} Gbps</span>
              </div>
              <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                <div
                  class="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                  :style="{ width: `${(monitoringStore.metrics.networkBps / 20) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between flex-1">
          <div>
            <h2 class="font-bold text-lg text-white mb-4">Cluster Health</h2>
            <div class="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 mb-4">
              <CheckCircle :size="24" class="shrink-0" />
              <div>
                <div class="text-sm font-bold">Services Nominal</div>
                <div class="text-xs text-emerald-500/80">All openstack-nodes online.</div>
              </div>
            </div>

            <div
              v-if="monitoringStore.alerts.length > 0"
              class="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400"
            >
              <AlertCircle :size="24" class="shrink-0 animate-pulse" />
              <div>
                <div class="text-sm font-bold">{{ monitoringStore.metrics.activeAlerts }} Active Alerts</div>
                <div class="text-xs text-red-500/80">Critical alert pending in Ceph pools.</div>
              </div>
            </div>
          </div>

          <RouterLink
            to="/monitoring"
            class="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-center py-2.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-colors mt-6 block"
          >
            View System Monitoring
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Server, HardDrive, Network as NetworkIcon, Users, CheckCircle, AlertCircle } from 'lucide-vue-next'
import DashboardChart from './components/DashboardChart.vue'
import { useComputeStore } from '@/stores/compute'
import { useStorageStore } from '@/stores/storage'
import { useNetworkStore } from '@/stores/network'
import { useIdentityStore } from '@/stores/identity'
import { useMonitoringStore } from '@/stores/monitoring'

const computeStore = useComputeStore()
const storageStore = useStorageStore()
const networkStore = useNetworkStore()
const identityStore = useIdentityStore()
const monitoringStore = useMonitoringStore()

onMounted(() => {
  computeStore.loadAllComputeData(true)
  storageStore.loadVolumes(true)
  networkStore.loadNetworks(true)
  identityStore.loadProjects(true)
  monitoringStore.loadMonitoringData(true)

  // Start periodic real metrics refresh
  monitoringStore.startMetricsSimulation()
})
</script>
