<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div
      v-for="hyp in computeStore.hypervisors"
      :key="hyp.name"
      class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-6"
    >
      <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h3 class="font-bold text-white">{{ hyp.name }}</h3>
          <span class="text-[10px] text-zinc-500 uppercase font-semibold">Nova Compute Node</span>
        </div>
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold border"
          :class="hyp.status === 'Up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'"
        >
          {{ hyp.status }}
        </span>
      </div>

      <div class="space-y-4">
        <!-- CPU Cores progress -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-zinc-400">vCPUs Allocated</span>
            <span class="text-white">{{ hyp.vcpusUsed }} / {{ hyp.vcpusTotal }} Cores</span>
          </div>
          <div class="w-full bg-zinc-950 rounded-full h-2 border border-zinc-850 overflow-hidden">
            <div
              class="bg-blue-600 h-full transition-all duration-500"
              :style="{ width: `${(hyp.vcpusUsed / hyp.vcpusTotal) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Memory progress -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-zinc-400">RAM Allocated</span>
            <span class="text-white">{{ (hyp.ramUsedMb / 1024).toFixed(0) }} GB / {{ (hyp.ramTotalMb / 1024).toFixed(0) }} GB</span>
          </div>
          <div class="w-full bg-zinc-950 rounded-full h-2 border border-zinc-850 overflow-hidden">
            <div
              class="bg-blue-600 h-full transition-all duration-500"
              :style="{ width: `${(hyp.ramUsedMb / hyp.ramTotalMb) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Disk Storage progress -->
        <div class="space-y-1">
          <div class="flex justify-between text-xs font-semibold">
            <span class="text-zinc-400">Disk Usage</span>
            <span class="text-white">{{ hyp.diskUsedGb }} GB / {{ hyp.diskTotalGb }} GB</span>
          </div>
          <div class="w-full bg-zinc-950 rounded-full h-2 border border-zinc-850 overflow-hidden">
            <div
              class="bg-indigo-500 h-full transition-all duration-500"
              :style="{ width: `${(hyp.diskUsedGb / hyp.diskTotalGb) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="flex justify-between items-center text-xs border-t border-zinc-850 pt-4">
        <span class="text-zinc-500">Running Instances</span>
        <span class="font-bold text-white">{{ hyp.vmsCount }} VMs</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useComputeStore } from '@/stores/compute'

const computeStore = useComputeStore()
</script>
