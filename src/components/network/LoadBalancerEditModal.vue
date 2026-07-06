<template>
  <div v-if="show && lb" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
      <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <EditIcon class="text-blue-500" :size="20" /> Edit Load Balancer: {{ lb.name }}
        </h2>
        <button @click="emit('close')" class="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl outline-none bg-transparent border-0">
          &times;
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4 text-left">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">Load Balancer Name</label>
          <input v-model="form.name" required class="form-input" />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">Description</label>
          <textarea v-model="form.description" rows="3" class="form-input" placeholder="Enter service description..."></textarea>
        </div>

        <div class="flex items-center gap-2 pt-2">
          <input type="checkbox" v-model="form.adminStateUp" id="editAdminStateUp" class="accent-blue-500 h-4 w-4" />
          <label for="editAdminStateUp" class="text-xs font-bold text-zinc-300 uppercase cursor-pointer select-none">
            Admin State Up
          </label>
        </div>

        <div v-if="error" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
          <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
          <span class="break-words">{{ error }}</span>
        </div>
      </form>

      <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
        <button type="button" @click="emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
          Cancel
        </button>
        <button @click="handleSubmit" :disabled="loading" class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer border-0">
          <LoaderIcon v-if="loading" class="animate-spin" :size="14" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Edit as EditIcon, AlertCircle as AlertCircleIcon, Loader as LoaderIcon } from 'lucide-vue-next'
import type { LoadBalancer } from '@/services/loadbalancer.service'

const props = defineProps<{
  show: boolean
  lb: LoadBalancer | null
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { name: string; description: string; adminStateUp: boolean }): void
}>()

const form = ref({
  name: '',
  description: '',
  adminStateUp: true,
})

watch(() => props.lb, (newLb) => {
  if (newLb) {
    form.value = {
      name: newLb.name,
      description: newLb.description || '',
      adminStateUp: newLb.adminStateUp,
    }
  }
}, { immediate: true })

function handleSubmit() {
  emit('submit', {
    name: form.value.name.trim(),
    description: form.value.description.trim(),
    adminStateUp: form.value.adminStateUp,
  })
}
</script>
