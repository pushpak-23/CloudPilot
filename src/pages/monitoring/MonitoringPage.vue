<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">Monitoring & Metrics</h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">Real-time status summaries of cloud nodes, storage pools, and alert triggers.</p>
      </div>
      <div class="flex gap-2">
        <button class="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer">
          Open Grafana Console
        </button>
        <button class="btn-primary">
          Alerting Rules
        </button>
      </div>
    </div>

    <!-- Alert Banner (displays first active critical alert if present) -->
    <div
      v-if="criticalAlert"
      class="border border-red-500/30 bg-red-500/10 rounded-xl p-4 flex items-center justify-between transition-all"
    >
      <div class="flex items-center gap-3 text-red-400">
        <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
        <span class="font-medium text-sm">Critical: {{ criticalAlert.name }} ({{ criticalAlert.source }})</span>
      </div>
      <button
        @click="monitoringStore.acknowledgeAlert(criticalAlert.name)"
        class="text-xs text-red-400 hover:text-red-300 font-semibold border border-red-500/30 px-3 py-1 rounded bg-red-950/20 hover:bg-red-950/40 cursor-pointer"
      >
        Dismiss Alert
      </button>
    </div>

    <!-- Stats Grid (bound to live-fluctuating store metrics) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div class="text-sm font-medium text-zinc-400">Average CPU Load</div>
        <div class="text-3xl font-black mt-2 text-white transition-all font-mono">
          {{ monitoringStore.metrics.cpuLoad }}%
        </div>
        <div class="text-[11px] text-zinc-500 mt-1">across 64 hypervisors</div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div class="text-sm font-medium text-zinc-400">Memory Allocated</div>
        <div class="text-3xl font-black mt-2 text-white transition-all font-mono">
          {{ ((monitoringStore.metrics.memoryAllocatedGb / monitoringStore.metrics.memoryTotalGb) * 100).toFixed(1) }}%
        </div>
        <div class="text-[11px] text-zinc-500 mt-1">
          {{ monitoringStore.metrics.memoryAllocatedGb }} GB / 3.2 TB total
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div class="text-sm font-medium text-zinc-400">Network I/O</div>
        <div class="text-3xl font-black mt-2 text-emerald-400 transition-all font-mono">
          {{ monitoringStore.metrics.networkBps }} Gbps
        </div>
        <div class="text-[11px] text-zinc-500 mt-1">Live metrics from gateway-switches</div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
        <div class="text-sm font-medium text-zinc-400">Active Alertmanager Alerts</div>
        <div class="text-3xl font-black mt-2 transition-all font-mono" :class="monitoringStore.metrics.activeAlerts > 0 ? 'text-amber-500' : 'text-zinc-500'">
          {{ monitoringStore.metrics.activeAlerts }}
        </div>
        <div class="text-[11px] text-zinc-500 mt-1">System warning thresholds</div>
      </div>
    </div>

    <!-- Active Alerts Table -->
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800">
        <h2 class="font-semibold text-lg text-white">Active Alertmanager Logs</h2>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
              <th class="p-4">Severity</th>
              <th class="p-4">Alert Summary</th>
              <th class="p-4">Trigger Time</th>
              <th class="p-4">Service Source</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="monitoringStore.loading">
              <td colspan="5" class="p-8 text-center text-zinc-500">
                <Loader class="animate-spin inline-block mr-2" :size="16" /> Querying alerts API...
              </td>
            </tr>
            <tr v-else-if="monitoringStore.alerts.length === 0">
              <td colspan="5" class="p-8 text-center text-zinc-500">
                No active alerts. Cluster health is optimal.
              </td>
            </tr>
            <tr v-for="alert in monitoringStore.alerts" :key="alert.name" class="hover:bg-zinc-900/30 transition-colors">
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold border" :class="alert.severityClass">
                  {{ alert.severity }}
                </span>
              </td>
              <td class="p-4 font-semibold text-white">{{ alert.name }}</td>
              <td class="p-4 text-zinc-400">{{ alert.time }}</td>
              <td class="p-4 text-zinc-500 font-mono text-xs">{{ alert.source }}</td>
              <td class="p-4 text-right">
                <button
                  @click="monitoringStore.acknowledgeAlert(alert.name)"
                  class="btn-table"
                >
                  Acknowledge
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader } from 'lucide-vue-next'
import { useMonitoringStore } from '@/stores/monitoring'

const monitoringStore = useMonitoringStore()

const criticalAlert = computed(() => {
  return monitoringStore.alerts.find(a => a.severity === 'Critical')
})

onMounted(() => {
  monitoringStore.loadMonitoringData()
  monitoringStore.startMetricsSimulation()
})
</script>
