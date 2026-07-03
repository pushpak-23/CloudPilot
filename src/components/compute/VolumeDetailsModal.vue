<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <!-- Modal Header -->
      <div
        class="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10"
      >
        <div class="flex items-center gap-3">
          <div
            class="p-3 bg-zinc-950 border border-zinc-850 rounded-lg text-blue-400"
          >
            <HardDrive :size="22" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white flex items-center gap-2.5">
              <span>{{ volume.name }}</span>
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase"
                :class="volume.statusClass"
              >
                <span
                  class="w-1 h-1 rounded-full"
                  :class="volume.bulletClass"
                ></span>
                {{ volume.status }}
              </span>
            </h2>
            <p class="text-xs text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{{ volume.id }}</span>
              <CopyButton :text="volume.id" class="p-0.5 border-0 bg-transparent scale-90" />
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-zinc-500 hover:text-zinc-300 transition-colors text-lg font-semibold cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <!-- Specs Tab Grid -->
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Size</span
              >
              <span class="text-sm font-semibold text-white mt-1 block">{{
                volume.size
              }}</span>
            </div>
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Backend Ceph Pool / Type</span
              >
              <span class="text-sm font-mono text-zinc-300 mt-1 block">{{
                volume.type
              }}</span>
            </div>
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Availability Zone</span
              >
              <span class="text-sm text-zinc-400 mt-1 block">{{
                volume.availabilityZone || 'nova'
              }}</span>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Description</span
              >
              <span class="text-sm text-zinc-400 mt-1 block italic">{{
                volume.description || '-'
              }}</span>
            </div>
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Created At</span
              >
              <span class="text-sm font-mono text-zinc-300 mt-1 block">{{
                formatDate(volume.createdAt)
              }}</span>
            </div>
            <div>
              <span
                class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block"
                >Attached Resource</span
              >
              <div class="mt-1 flex items-center gap-1.5">
                <span
                  v-if="
                    volume.attachedTo &&
                    volume.attachedTo !== 'None (Unattached)'
                  "
                  class="text-blue-400 text-sm font-semibold flex items-center gap-1.5"
                >
                  <Server :size="12" /> {{ resolvedServerName }}
                </span>
                <span v-else class="text-zinc-500 text-sm italic"
                  >Unattached / Available</span
                >
              </div>
            </div>
          </div>
        </div>

        <hr class="border-zinc-800" />

        <!-- Attachment Controls -->
        <div class="space-y-3">
          <h3
            class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
          >
            <LinkIcon :size="12" /> Volume Attachments Manager
          </h3>

          <div
            v-if="volume.status === 'Available'"
            class="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 flex-1 w-full">
              <label class="text-[10px] font-bold text-zinc-500 uppercase"
                >Select Target Virtual Machine</label
              >
              <select
                v-model="targetServerId"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>-- Choose a VM Instance --</option>
                <option
                  v-for="vm in computeStore.instances"
                  :key="vm.id"
                  :value="vm.id"
                >
                  {{ vm.name }} (Status: {{ vm.status }}, IP: {{ vm.ip }})
                </option>
              </select>
            </div>
            <button
              @click="attachVolume"
              :disabled="!targetServerId || operationLoading"
              class="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Loader v-if="operationLoading" :size="12" class="animate-spin" />
              Attach Volume
            </button>
          </div>

          <div
            v-else-if="volume.status === 'In-Use'"
            class="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div class="text-xs space-y-1 text-zinc-400">
              <p>
                Attached Device:
                <span class="font-mono text-zinc-200">{{
                  attachmentDevice
                }}</span>
              </p>
              <p>
                Host Instance:
                <span class="font-semibold text-zinc-200">{{
                  resolvedServerName
                }}</span>
              </p>
            </div>
            <button
              @click="detachVolume"
              :disabled="operationLoading"
              class="w-full sm:w-auto px-4 py-2 bg-red-950/20 hover:bg-red-900/40 border border-red-500/25 text-red-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Loader v-if="operationLoading" :size="12" class="animate-spin" />
              Detach Volume
            </button>
          </div>

          <div v-else class="text-center text-zinc-500 text-xs italic py-4">
            Volume is in {{ volume.status }} state. Attach/detach operations are
            locked.
          </div>
        </div>

        <hr class="border-zinc-800" />

        <!-- Extend Size Controls -->
        <div class="space-y-3">
          <h3
            class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5"
          >
            <Maximize :size="12" /> Extend Volume Capacity
          </h3>
          <div
            class="bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4"
          >
            <div class="space-y-1.5 flex-1 w-full">
              <label class="text-[10px] font-bold text-zinc-500 uppercase"
                >New Storage Capacity (GB)</label
              >
              <input
                type="number"
                v-model.number="newSize"
                :min="volume.rawSize + 10"
                class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span class="text-[10px] text-zinc-500 block"
                >Must be larger than current size: {{ volume.size }}.</span
              >
            </div>
            <button
              @click="extendVolume"
              :disabled="newSize <= volume.rawSize || operationLoading"
              class="w-full sm:w-auto px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Loader v-if="operationLoading" :size="12" class="animate-spin" />
              Extend Size
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div
        class="p-6 border-t border-zinc-800 bg-zinc-900/10 flex justify-end gap-3"
      >
        <button
          @click="deleteVolume"
          :disabled="operationLoading"
          class="px-4 py-2 border border-zinc-700 bg-zinc-800 text-sm text-white rounded-lg hover:bg-zinc-700 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Delete Volume
        </button>
        <button
          @click="$emit('refresh')"
          :disabled="operationLoading"
          class="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Refresh
        </button>
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-zinc-800 hover:border-zinc-700 text-sm text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
        >
          Close Details
        </button>
      </div>
    </div>
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
