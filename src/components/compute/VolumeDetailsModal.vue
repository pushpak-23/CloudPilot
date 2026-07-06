<template>
  <div>
    <!-- Backdrop Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-250 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity" @click="$emit('close')"></div>
    </Transition>

    <!-- Side-Drawer Panel -->
    <Transition
      enter-active-class="transition duration-300 ease-out transform"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-250 ease-in transform"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="show"
        class="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] md:w-[780px] lg:w-[900px] bg-zinc-950/[0.97] border-l border-zinc-800/60 shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-zinc-800/60 flex items-center justify-between bg-gradient-to-r from-zinc-900/40 via-zinc-950/20 to-zinc-900/40">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <HardDrive :size="18" />
            </div>
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <span>{{ volume.name }}</span>
              </h2>
              <span class="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5 block">Volume Properties Inspector</span>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="text-zinc-500 hover:text-white transition-all cursor-pointer text-lg outline-none font-bold p-1.5 hover:bg-zinc-800 rounded-lg w-9 h-9 flex items-center justify-center border border-transparent hover:border-zinc-700 bg-transparent"
          >
            &times;
          </button>
        </div>

        <!-- Drawer Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          <!-- Two-Column Layout -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            <!-- LEFT COLUMN: Operations and Managers (3/5 width) -->
            <div class="md:col-span-3 space-y-6">
              
              <!-- Volume Attachments Manager -->
              <div class="space-y-3 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl">
                <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <LinkIcon :size="14" class="text-blue-400" /> Volume Attachment
                </h3>
                
                <div v-if="volume.status === 'Available'" class="space-y-4 pt-1">
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-bold text-zinc-500 uppercase">Select Target Virtual Machine</label>
                    <select
                      v-model="targetServerId"
                      class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="" disabled>-- Choose a VM Instance --</option>
                      <option v-for="vm in computeStore.instances" :key="vm.id" :value="vm.id">
                        {{ vm.name }} (Status: {{ vm.status }})
                      </option>
                    </select>
                  </div>
                  <button
                    @click="attachVolume"
                    :disabled="!targetServerId || operationLoading"
                    class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                  >
                    <Loader v-if="operationLoading" :size="12" class="animate-spin" />
                    <span>Attach to Instance</span>
                  </button>
                </div>

                <div v-else-if="volume.status === 'In-Use'" class="space-y-4 pt-1">
                  <div class="text-xs space-y-1 text-zinc-400">
                    <div>Attached Device: <strong class="font-mono text-zinc-200">{{ attachmentDevice }}</strong></div>
                    <div>Host Instance: <strong class="font-semibold text-zinc-200">{{ resolvedServerName }}</strong></div>
                  </div>
                  <button
                    @click="detachVolume"
                    :disabled="operationLoading"
                    class="w-full px-4 py-2 bg-red-955/20 hover:bg-red-900/40 border border-red-500/25 text-red-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Loader v-if="operationLoading" :size="12" class="animate-spin" />
                    <span>Detach from Instance</span>
                  </button>
                </div>

                <div v-else class="text-center text-zinc-500 text-xs italic py-4">
                  Volume status is {{ volume.status }}. Attachments are locked.
                </div>
              </div>

              <!-- Extend Volume Capacity -->
              <div class="space-y-3 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-xl">
                <h3 class="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Maximize :size="14" class="text-blue-400" /> Extend Capacity
                </h3>
                <div class="space-y-4 pt-1">
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-bold text-zinc-500 uppercase">New Capacity (GB)</label>
                    <input
                      type="number"
                      v-model.number="newSize"
                      :min="volume.rawSize + 1"
                      class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span class="text-[10px] text-zinc-500 block">Must be larger than current size: {{ volume.size }}</span>
                  </div>
                  <button
                    @click="extendVolume"
                    :disabled="newSize <= volume.rawSize || operationLoading"
                    class="w-full px-4 py-2 border border-zinc-850 hover:border-zinc-700 bg-zinc-900 text-zinc-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Loader v-if="operationLoading" :size="12" class="animate-spin" />
                    <span>Extend Storage Size</span>
                  </button>
                </div>
              </div>

              <!-- Danger Action -->
              <div class="p-4 bg-red-955/5 border border-red-500/10 rounded-xl space-y-2">
                <h4 class="text-xs font-bold text-red-400 uppercase">Danger Zone</h4>
                <p class="text-[11px] text-zinc-500">Deletes the storage volume block permanently. This cannot be reverted.</p>
                <button
                  @click="deleteVolume"
                  :disabled="operationLoading"
                  class="px-4 py-2 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white text-xs font-bold uppercase rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete Volume
                </button>
              </div>

            </div>

            <!-- RIGHT COLUMN: Volume Metadata Specs (2/5 width) -->
            <div class="md:col-span-2 space-y-5">
              
              <!-- Specs Folder -->
              <div class="space-y-3">
                <div class="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Storage Properties</div>
                <div class="text-xs text-zinc-400 font-mono space-y-3 bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-xl">
                  
                  <div class="flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Status</span>
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase" :class="volume.statusClass">
                      <span class="w-1.5 h-1.5 rounded-full animate-pulse" :class="volume.bulletClass"></span>
                      {{ volume.status }}
                    </span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Size</span>
                    <span class="text-zinc-200 font-bold text-sm">{{ volume.size }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Ceph Pool</span>
                    <span class="text-zinc-300 font-semibold">{{ volume.type }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Zone</span>
                    <span class="text-zinc-300">{{ volume.availabilityZone || 'nova' }}</span>
                  </div>

                  <div class="border-t border-zinc-800/40 pt-2 flex justify-between items-center">
                    <span class="text-zinc-500 text-[10px] uppercase">Created</span>
                    <span class="text-zinc-300 text-[11px]">{{ formatDate(volume.createdAt) }}</span>
                  </div>

                  <div v-if="volume.description" class="border-t border-zinc-800/40 pt-2">
                    <span class="text-zinc-500 text-[10px] uppercase block">Description</span>
                    <span class="text-zinc-300 block mt-1 normal-case not-italic text-[11px] leading-relaxed italic">{{ volume.description }}</span>
                  </div>
                  
                  <div class="border-t border-zinc-800/40 pt-2">
                    <span class="text-zinc-500 text-[10px] uppercase block">Volume ID</span>
                    <span class="text-zinc-400 block mt-1 text-[10px] break-all">{{ volume.id }}</span>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="p-6 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
          <button
            @click="$emit('refresh')"
            :disabled="operationLoading"
            class="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-transparent"
          >
            Refresh
          </button>
          <button
            @click="$emit('close')"
            class="px-4 py-2 bg-zinc-800 hover:bg-zinc-755 text-sm text-white rounded-lg transition-all cursor-pointer border-0"
          >
            Close Details
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  HardDrive,
  Server,
  Link as LinkIcon,
  Maximize,
  Loader,
} from 'lucide-vue-next'
import { useStorageStore } from '@/stores/storage'
import { useComputeStore } from '@/stores/compute'
import { computeService } from '@/services/compute.service'
import type { Volume } from '@/services/storage.service'
import CopyButton from '@/components/CopyButton.vue'

const props = defineProps<{
  show: boolean
  volume: Volume
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const storageStore = useStorageStore()
const computeStore = useComputeStore()

const targetServerId = ref('')
const newSize = ref(props.volume.rawSize + 50)
const operationLoading = ref(false)

// Resolve server name from instances array
const resolvedServerName = computed(() => {
  const srvId = props.volume.attachedTo
  if (!srvId || srvId === 'None (Unattached)') return 'Unattached'
  const found = computeStore.instances.find((vm) => vm.id === srvId)
  return found ? found.name : srvId
})

const attachmentDevice = computed(() => {
  if (props.volume.attachments && props.volume.attachments.length > 0) {
    return props.volume.attachments[0].device || '/dev/vdb'
  }
  return '/dev/vdb'
})

function formatDate(dStr?: string) {
  if (!dStr) return '-'
  try {
    return new Date(dStr).toLocaleString()
  } catch (e) {
    return dStr
  }
}

// Action triggers
async function attachVolume() {
  if (!targetServerId.value) return
  try {
    operationLoading.value = true
    await computeService.attachVolume(targetServerId.value, props.volume.id)
    emit('refresh')
    targetServerId.value = ''
    alert(`Attachment requested. Volume "${props.volume.name}" is attaching.`)
  } catch (err: any) {
    alert('Failed to attach volume: ' + (err.message || err))
  } finally {
    operationLoading.value = false
  }
}

async function detachVolume() {
  const srvId = props.volume.attachedTo
  if (!srvId || srvId === 'None (Unattached)') return
  if (
    !confirm(
      `Are you sure you want to detach volume "${props.volume.name}" from VM?`
    )
  )
    return
  try {
    operationLoading.value = true
    await computeService.detachVolume(srvId, props.volume.id)
    emit('refresh')
    alert(`Detachment requested. Volume "${props.volume.name}" is detaching.`)
  } catch (err: any) {
    alert('Failed to detach volume: ' + (err.message || err))
  } finally {
    operationLoading.value = false
  }
}

async function extendVolume() {
  if (newSize.value <= props.volume.rawSize) return
  if (
    !confirm(
      `Are you sure you want to extend volume "${props.volume.name}" capacity to ${newSize.value} GB?`
    )
  )
    return
  try {
    operationLoading.value = true
    await storageStore.extendVolume(props.volume.id, newSize.value)
    emit('refresh')
    alert(`Extend requested. Volume size increased to ${newSize.value} GB.`)
  } catch (err: any) {
    alert('Failed to extend volume: ' + (err.message || err))
  } finally {
    operationLoading.value = false
  }
}

async function deleteVolume() {
  if (
    !confirm(
      `Are you sure you want to delete volume "${props.volume.name}"? This cannot be undone.`
    )
  )
    return
  try {
    operationLoading.value = true
    await storageStore.deleteVolume(props.volume.id)
    emit('refresh')
    emit('close')
    alert(`Volume "${props.volume.name}" has been deleted.`)
  } catch (err: any) {
    alert('Failed to delete volume: ' + (err.message || err))
  } finally {
    operationLoading.value = false
  }
}

onMounted(() => {
  // Load VMs if empty
  if (computeStore.instances.length === 0) {
    computeStore.loadAllComputeData()
  }
})
</script>
