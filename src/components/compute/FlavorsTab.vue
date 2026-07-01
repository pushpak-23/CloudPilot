<template>
  <div class="space-y-6">
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">Nova Machine Flavors</h2>
        <button
          @click="$emit('create-flavor')"
          class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          + Create Flavor
        </button>
      </div>
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
            <th class="p-4">Flavor ID</th>
            <th class="p-4">Flavor Name</th>
            <th class="p-4">vCPUs</th>
            <th class="p-4">RAM Allocation</th>
            <th class="p-4">Root Disk Capacity</th>
            <th class="p-4">Public Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-850">
          <tr v-for="flavor in computeStore.flavors" :key="flavor.id" class="hover:bg-zinc-900/30 transition-colors">
            <td class="p-4 font-mono text-xs text-zinc-500">#{{ flavor.id }}</td>
            <td class="p-4 font-bold text-white">{{ flavor.name }}</td>
            <td class="p-4 text-zinc-300">{{ flavor.vcpus }} Cores</td>
            <td class="p-4 text-zinc-300 font-mono">{{ flavor.ram }} MB</td>
            <td class="p-4 text-zinc-300 font-mono">{{ flavor.disk }} GB</td>
            <td class="p-4 text-zinc-400">{{ flavor.isPublic ? 'Publicly Available' : 'Private' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useComputeStore } from '@/stores/compute'

defineEmits<{
  (e: 'create-flavor'): void
}>()

const computeStore = useComputeStore()
</script>
