<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
      <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">Create Flavor Profile</h2>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-zinc-400 uppercase">Flavor Name</label>
          <input v-model="name" placeholder="e.g., m1.custom" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-zinc-400 uppercase">vCPUs</label>
            <input type="number" v-model.number="cpus" min="1" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-zinc-400 uppercase">RAM (MB)</label>
            <input type="number" v-model.number="ram" min="256" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" />
          </div>
          <div class="space-y-1.5">
            <label class="text-[10px] font-semibold text-zinc-400 uppercase">Disk (GB)</label>
            <input type="number" v-model.number="disk" min="1" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" />
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
        <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer">Cancel</button>
        <button @click="submit" :disabled="!name.trim() || cpus < 1" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer">Create</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComputeStore } from '@/stores/compute'

defineProps<{ show: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const computeStore = useComputeStore()
const name = ref('')
const cpus = ref(2)
const ram = ref(4096)
const disk = ref(40)

function submit() {
  if (name.value.trim() && cpus.value > 0) {
    computeStore.addFlavor(name.value.trim(), cpus.value, ram.value, disk.value)
    name.value = ''
    cpus.value = 2
    ram.value = 4096
    disk.value = 40
    emit('close')
  }
}
</script>
