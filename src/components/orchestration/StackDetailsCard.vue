<template>
  <div v-if="stack" class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6 space-y-6">
    <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
      <div>
        <h3 class="text-lg font-bold text-white flex items-center gap-2">
          Stack Details: <span class="text-blue-400 font-mono">{{ stack.name }}</span>
        </h3>
        <p class="text-zinc-500 text-xs mt-0.5">{{ stack.description }}</p>
      </div>
      <span class="text-xs text-zinc-650 font-mono">Heat API v1</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Params -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Template Parameters</h4>
        <div class="bg-zinc-950 border border-zinc-850 rounded-lg p-4 space-y-2">
          <div v-for="(val, key) in stack.parameters" :key="key" class="flex justify-between text-xs border-b border-zinc-900 pb-1.5 last:border-0 last:pb-0">
            <span class="text-zinc-500 font-mono font-medium">{{ key }}</span>
            <span class="text-zinc-200 font-mono">{{ val }}</span>
          </div>
          <div v-if="Object.keys(stack.parameters || {}).length === 0" class="text-xs text-zinc-500 italic">
            No parameter overrides.
          </div>
        </div>
      </div>

      <!-- Execution log timeline -->
      <div class="space-y-3">
        <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Execution Events</h4>
        <div class="bg-zinc-950 border border-zinc-850 rounded-lg p-4 space-y-3.5 max-h-56 overflow-y-auto">
          <div v-for="(evt, idx) in events" :key="idx" class="flex gap-3 text-[11px]">
            <span class="text-zinc-500 font-mono shrink-0">{{ evt.time }}</span>
            <div class="space-y-0.5">
              <div class="font-semibold text-white flex items-center gap-1.5">
                <span>{{ evt.resource }}</span>
                <span class="text-[9px] px-1 py-0.2 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">{{ evt.status }}</span>
              </div>
              <p class="text-zinc-500">{{ evt.reason }}</p>
            </div>
          </div>
          <div v-if="events.length === 0" class="text-xs text-zinc-500 italic">
            No events logged.
          </div>
        </div>
      </div>
    </div>

    <!-- Topology Visual Map slot/child -->
    <slot name="topology"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  stack: any
  events: any[]
}>()
</script>
