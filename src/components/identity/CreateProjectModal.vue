<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
        <h3 class="font-bold text-base text-white">Create Keystone Project</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white transition-colors cursor-pointer text-lg font-bold bg-transparent border-0 outline-none">
          &times;
        </button>
      </div>
      
      <div class="p-5 space-y-4 text-left">
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Project Name</label>
          <input v-model="name" placeholder="e.g., development-space" class="form-input" />
        </div>
        
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
          <textarea
            v-model="description"
            placeholder="Describe the workspace scope..."
            rows="3"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          ></textarea>
        </div>
        
        <div class="flex items-center gap-3 pt-1">
          <input type="checkbox" v-model="enabled" id="chk-proj-enabled" class="custom-checkbox" />
          <label for="chk-proj-enabled" class="text-xs text-zinc-300 font-semibold select-none cursor-pointer">Enable project space instantly</label>
        </div>
      </div>
      
      <div class="p-5 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition-all bg-transparent cursor-pointer">Cancel</button>
        <button @click="submit" :disabled="!name.trim()" class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-0" :style="{ backgroundColor: 'var(--accent)' }">Create Project</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', data: { name: string; description: string; enabled: boolean }): void
}>()

const name = ref('')
const description = ref('')
const enabled = ref(true)

function submit() {
  if (name.value.trim()) {
    emit('create', {
      name: name.value.trim(),
      description: description.value.trim(),
      enabled: enabled.value
    })
  }
}
</script>
