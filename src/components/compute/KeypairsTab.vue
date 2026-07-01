<template>
  <div class="space-y-6">
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">SSH Keypairs</h2>
        <button
          @click="$emit('create-keypair')"
          class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          + Create Keypair
        </button>
      </div>
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
            <th class="p-4">Key Name</th>
            <th class="p-4">SHA256 Fingerprint</th>
            <th class="p-4">Public SSH Key Preview</th>
            <th class="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-850">
          <tr v-for="key in computeStore.keypairs" :key="key.name" class="hover:bg-zinc-900/30 transition-colors">
            <td class="p-4 font-bold text-white flex items-center gap-2">
              <Key :size="14" class="text-zinc-400" />
              {{ key.name }}
            </td>
            <td class="p-4 font-mono text-xs text-zinc-400">{{ key.fingerprint }}</td>
            <td class="p-4 font-mono text-[10px] text-zinc-500 max-w-xs truncate">{{ key.publicKey }}</td>
            <td class="p-4 text-right">
              <button
                @click="computeStore.deleteKeypair(key.name)"
                class="text-xs px-2.5 py-1 rounded border border-red-500/25 bg-red-950/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Key } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'

defineEmits<{
  (e: 'create-keypair'): void
}>()

const computeStore = useComputeStore()
</script>
