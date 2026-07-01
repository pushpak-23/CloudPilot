<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs"
    @click.self="emit('close')"
  >
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
      <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
        <RouteIcon class="text-emerald-400" :size="20" /> Configure Router
      </h2>
      <div class="space-y-4">
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">Router Name</label>
          <input
            v-model="editRouterName"
            class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Admin State</label>
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="editRouterAdminStateUp" class="accent-emerald-500 h-4 w-4" />
                State Up
              </label>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">HA Router</label>
            <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
              <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="editRouterHA" class="accent-emerald-500 h-4 w-4" />
                HA
              </label>
            </div>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">DVR Mode</label>
          <div class="flex items-center h-10 px-3 bg-zinc-955 border border-zinc-800 rounded-lg">
            <label class="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
              <input type="checkbox" v-model="editRouterDistributed" class="accent-emerald-500 h-4 w-4" />
              Distributed (DVR)
            </label>
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold text-zinc-400 uppercase">External Network Gateway</label>
          <select
            v-model="editRouterExternalNetworkId"
            class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">None (Clear Gateway)</option>
            <option v-for="net in externalNetworks" :key="net.id" :value="net.id">
              {{ net.name }}
            </option>
          </select>
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
          @click="submitEditRouter"
          :disabled="!editRouterName.trim()"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Route as RouteIcon } from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'
import type { NetworkConfig, NetworkRouter } from '@/services/network.service'

const props = defineProps<{
  show: boolean
  router: NetworkRouter | null
  externalNetworks: NetworkConfig[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'updated'): void
}>()

const networkStore = useNetworkStore()

const editRouterName = ref('')
const editRouterAdminStateUp = ref(true)
const editRouterHA = ref(false)
const editRouterDistributed = ref(false)
const editRouterExternalNetworkId = ref('')

watch(() => props.router, (newRouter) => {
  if (newRouter) {
    editRouterName.value = newRouter.name
    editRouterAdminStateUp.value = newRouter.adminStateUp
    editRouterHA.value = newRouter.ha
    editRouterDistributed.value = newRouter.distributed
    editRouterExternalNetworkId.value = newRouter.externalNetworkId || ''
  }
}, { immediate: true })

async function submitEditRouter() {
  if (!props.router || !editRouterName.value.trim()) return

  try {
    await networkStore.updateRouter(props.router.id, {
      name: editRouterName.value.trim(),
      adminStateUp: editRouterAdminStateUp.value,
      ha: editRouterHA.value,
      distributed: editRouterDistributed.value,
      externalNetworkId: editRouterExternalNetworkId.value || null,
    })
    emit('updated')
  } catch (err: any) {
    alert('Failed to update router: ' + (err.message || err))
  }
}
</script>
