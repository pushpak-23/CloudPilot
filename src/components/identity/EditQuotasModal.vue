<template>
  <BaseModal v-if="project" :show="show" :title="`Edit Quotas: ${project.name}`" @close="$emit('close')">
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

    <template #footer>
      <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition-all bg-transparent cursor-pointer">Cancel</button>
      <button @click="submit" class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-0" :style="{ backgroundColor: 'var(--accent)' }">Save Quotas</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from '../BaseModal.vue'
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
