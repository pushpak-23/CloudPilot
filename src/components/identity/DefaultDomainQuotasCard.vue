<template>
  <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
    <h2 class="font-bold text-lg text-white">Default Domain Quotas</h2>

    <div class="space-y-4">
      <!-- CPU Cores -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-zinc-400">Compute Cores (vCPUs)</span>
          <span class="text-white">64 / {{ cores }} Cores</span>
        </div>
        <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
          <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${Math.min((64 / cores) * 100, 100)}%`, backgroundColor: 'var(--accent)' }"></div>
        </div>
        <div class="text-[10px] text-zinc-500 text-right">{{ ((64 / cores) * 100).toFixed(0) }}% Allocated</div>
      </div>

      <!-- Memory -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-zinc-400">RAM Allocation</span>
          <span class="text-white">128 GB / {{ ram }} GB</span>
        </div>
        <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
          <div class="h-full rounded-full transition-all duration-500" :style="{ width: `${Math.min((128 / ram) * 100, 100)}%`, backgroundColor: 'var(--accent)' }"></div>
        </div>
        <div class="text-[10px] text-zinc-500 text-right">{{ ((128 / ram) * 100).toFixed(0) }}% Allocated</div>
      </div>

      <!-- Disk Storage -->
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs font-semibold">
          <span class="text-zinc-400">Ceph Volume Capacity</span>
          <span class="text-white">4.1 TB / {{ (disk / 1024).toFixed(1) }} TB</span>
        </div>
        <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
          <div class="bg-indigo-500 h-full rounded-full transition-all duration-500" :style="{ width: `${Math.min((4.1 / (disk / 1024)) * 100, 100)}%` }"></div>
        </div>
        <div class="text-[10px] text-zinc-500 text-right">{{ ((4.1 / (disk / 1024)) * 100).toFixed(0) }}% Allocated</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  cores: number
  ram: number
  disk: number
}>()
</script>
