<template>
  <button
    type="button"
    @click.stop="handleCopy"
    class="relative inline-flex items-center justify-center p-1 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer select-none group"
    :class="props.class"
    title="Copy ID"
  >
    <!-- Micro-animations for icons -->
    <transition name="icon-pop" mode="out-in">
      <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
      <Copy v-else class="w-3.5 h-3.5 group-hover:scale-105 transition-transform" />
    </transition>

    <!-- Floating Tooltip Confirmation -->
    <transition name="tooltip-fade">
      <span
        v-if="copied"
        class="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded shadow-lg shadow-emerald-500/20 uppercase tracking-wider pointer-events-none whitespace-nowrap z-50 border border-emerald-400/20 animate-in fade-in slide-in-from-bottom-1 duration-150"
      >
        Copied!
      </span>
    </transition>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import { copyToClipboard } from '@/composables/useClipboard'

const props = defineProps<{
  text: string
  class?: string
}>()

const copied = ref(false)

function handleCopy() {
  if (!props.text) return
  copyToClipboard(props.text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<style scoped>
/* Icon popping animation */
.icon-pop-enter-active,
.icon-pop-leave-active {
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.icon-pop-enter-from {
  transform: scale(0.6);
  opacity: 0;
}
.icon-pop-leave-to {
  transform: scale(0.8);
  opacity: 0;
}

/* Tooltip fade & slide animation */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.tooltip-fade-enter-from {
  transform: translate(-50%, 4px) scale(0.9);
  opacity: 0;
}
.tooltip-fade-leave-to {
  transform: translate(-50%, -4px) scale(0.9);
  opacity: 0;
}
</style>
