<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
      <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
        <NetworkIcon class="text-blue-500" :size="20" /> Edit Network Configuration
      </h2>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">Network Name</label>
          <input
            v-model="editNetworkName"
            class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Admin State</label>
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="editNetworkAdminState" class="accent-blue-500 h-4 w-4" />
                State Up
              </label>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Shared status</label>
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="editNetworkShared" class="accent-blue-500 h-4 w-4" />
                Shared
              </label>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">Network Routing</label>
          <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
            <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" v-model="editNetworkExternal" class="accent-blue-500 h-4 w-4" />
              External Gateway
            </label>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
        <button
          @click="emit('close')"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
        >
          Cancel
        </button>
        <button
          @click="submitEditNetwork"
          :disabled="!editNetworkName.trim()"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Save Configuration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Network as NetworkIcon } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'
import type { NetworkConfig } from '@/services/network.service'

const props = defineProps<{
  show: boolean
  network: NetworkConfig | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const networkStore = useNetworkStore()

const editNetworkName = ref('')
const editNetworkAdminState = ref(true)
const editNetworkShared = ref(false)
const editNetworkExternal = ref(false)

watch(() => props.network, (newNet) => {
  if (newNet) {
    editNetworkName.value = newNet.name
    editNetworkAdminState.value = newNet.adminStateUp ?? true
    editNetworkShared.value = newNet.shared
    editNetworkExternal.value = newNet.external
  }
}, { immediate: true })

async function submitEditNetwork() {
  if (!props.network || !editNetworkName.value.trim()) return

  try {
    await networkStore.updateNetwork(props.network.id, {
      name: editNetworkName.value.trim(),
      shared: editNetworkShared.value,
      external: editNetworkExternal.value,
      adminStateUp: editNetworkAdminState.value,
    })
    emit('updated')
  } catch (err: any) {
    alert('Failed to update network: ' + (err.message || err))
  }
}
</script>
