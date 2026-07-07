<template>
  <BaseModal :show="show" title="Create Keystone Project" @close="$emit('close')">
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

    <template #footer>
      <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition-all bg-transparent cursor-pointer">Cancel</button>
      <button @click="submit" :disabled="!name.trim()" class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-0" :style="{ backgroundColor: 'var(--accent)' }">Create Project</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '../BaseModal.vue'

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
