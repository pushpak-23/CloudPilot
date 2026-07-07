<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150" @click.self="$emit('close')">
    <div :class="['bg-zinc-900 border border-zinc-800 rounded-xl w-full shadow-2xl overflow-hidden flex flex-col', maxW]">
      <!-- Header -->
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20 select-none">
        <h3 class="font-bold text-base text-white">{{ title }}</h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white transition-colors cursor-pointer text-lg font-bold bg-transparent border-0 outline-none leading-none">
          &times;
        </button>
      </div>
      
      <!-- Body -->
      <div class="p-5 space-y-4 text-left">
        <slot></slot>
      </div>
      
      <!-- Footer -->
      <div v-if="$slots.footer" class="p-5 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  show: boolean
  title: string
  maxW?: string
}>(), {
  maxW: 'max-w-md'
})

defineEmits<{
  (e: 'close'): void
}>()
</script>
