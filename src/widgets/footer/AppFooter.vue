<template>
  <footer
    class="border-t border-zinc-800 h-9 bg-zinc-950 flex items-center justify-between px-6 text-xs text-zinc-500 font-medium"
  >
    <!-- Left: Connection Status -->
    <div class="flex items-center gap-2">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>Connected</span>
    </div>

    <!-- Center: Selected Region -->
    <div class="flex items-center gap-1">
      <span class="text-zinc-600">Active Region:</span>
      <span class="text-zinc-400 font-semibold">{{ layout.currentRegion }}</span>
    </div>

    <!-- Right: Real-time Latency -->
    <div class="flex items-center gap-1.5 transition-all">
      <span class="text-zinc-600">WebSocket Latency:</span>
      <span class="text-zinc-400 font-mono font-semibold">{{ latency }}ms</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useLayoutStore } from '@/stores/layout'

const layout = useLayoutStore()
const latency = ref(12)
let intervalId: any = null

onMounted(() => {
  intervalId = setInterval(() => {
    // Generate slight latency variations between 8ms and 19ms
    latency.value = Math.floor(Math.random() * 12) + 8
  }, 3500)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

