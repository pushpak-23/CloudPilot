<template>
  <div v-if="show && project" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
        <h3 class="font-bold text-base text-white">Edit Quotas: {{ project.name }}</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white transition-colors cursor-pointer text-lg font-bold bg-transparent border-0 outline-none">
          &times;
        </button>
      </div>
      
      <div class="p-5 space-y-4 text-left">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Compute Cores Limit (vCPUs)</label>
          <input type="number" v-model.number="cores" min="64" max="1024" class="form-input" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">RAM Allocation Limit (GB)</label>
          <input type="number" v-model.number="ram" min="128" max="2048" class="form-input" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Ceph Storage Limit (GB)</label>
          <input type="number" v-model.number="disk" min="4096" max="51200" class="form-input" />
          <span class="text-[10px] text-zinc-500 block">Enter values in GB (1 TB = 1024 GB)</span>
        </div>
      </div>
      
      <div class="p-5 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition-all bg-transparent cursor-pointer">Cancel</button>
        <button @click="submit" class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-0" :style="{ backgroundColor: 'var(--accent)' }">Save Quotas</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  project: any
  currentCores: number
  currentRam: number
  currentDisk: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update', data: { cores: number; ram: number; disk: number }): void
}>()

const cores = ref(128)
const ram = ref(256)
const disk = ref(10240)

watch(() => props.show, (newVal) => {
  if (newVal) {
    cores.value = props.currentCores
    ram.value = props.currentRam
    disk.value = props.currentDisk
  }
}, { immediate: true })

function submit() {
  if (cores.value < 64 || ram.value < 128 || disk.value < 4096) {
    alert('Please enter valid quota limits within range.')
    return
  }
  emit('update', {
    cores: cores.value,
    ram: ram.value,
    disk: disk.value
  })
}
</script>
