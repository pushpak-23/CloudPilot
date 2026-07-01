<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
      <!-- Top accent -->
      <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>

      <!-- Modal Header -->
      <div class="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20 select-none">
        <div class="flex items-center gap-3">
          <DistroLogo :name="image.name" size="md" />
          <div>
            <h2 class="text-lg font-bold text-white flex items-center gap-2">
              {{ image.name }}
            </h2>
            <p class="text-zinc-500 text-xs mt-0.5">Glance OS Image Details & Metadata Properties</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white transition-colors text-sm cursor-pointer">
          Close
        </button>
      </div>

      <!-- Tabs navigation -->
      <div class="flex border-b border-zinc-800 bg-zinc-950/10 px-6 select-none">
        <button
          v-for="t in tabs"
          :key="t.value"
          @click="activeTab = t.value"
          :class="[
            'py-3 px-4 border-b-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer',
            activeTab === t.value
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          ]"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Tab 1: Standard Properties -->
        <div v-if="activeTab === 'info'" class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Image UUID</span>
              <span class="text-xs font-mono text-zinc-300 block bg-zinc-950/50 border border-zinc-850 p-2 rounded-lg select-all">
                {{ image.id }}
              </span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Disk Format</span>
              <span class="text-sm font-semibold text-white uppercase font-mono">{{ image.diskFormat }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Container Format</span>
              <span class="text-sm font-semibold text-white uppercase font-mono">{{ image.containerFormat }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Minimum Resources</span>
              <span class="text-sm font-semibold text-white">
                {{ image.minRam }} MB RAM / {{ image.minDisk }} GB Disk Required
              </span>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Image Size</span>
              <span class="text-sm font-semibold text-white font-mono">{{ image.size }}</span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Visibility</span>
              <span class="text-sm font-semibold text-white">
                {{ image.visibility }}
              </span>
            </div>
            <div>
              <span class="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Status</span>
              <span :class="[
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold border mt-1',
                image.status === 'Active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              ]">
                {{ image.status }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tab 2: Custom Metadata -->
        <div v-if="activeTab === 'metadata'" class="space-y-6">
          <!-- Properties List -->
          <div class="space-y-3">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Properties</h3>
            <div v-if="hasProperties" class="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-850 bg-zinc-950/20">
              <div v-for="(val, key) in image.properties" :key="key" class="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-900/10">
                <div class="flex-1 grid grid-cols-3 gap-2">
                  <span class="font-mono text-zinc-500 font-semibold">{{ key }}</span>
                  <span class="col-span-2 text-zinc-300 font-mono select-all">{{ val }}</span>
                </div>
                <button
                  @click="deleteProperty(key)"
                  :disabled="updating"
                  class="p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded transition-colors disabled:opacity-50 cursor-pointer"
                  title="Remove Property"
                >
                  <Trash :size="14" />
                </button>
              </div>
            </div>
            <div v-else class="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 italic">
              No custom metadata properties registered for this Glance image.
            </div>
          </div>

          <!-- Add Property Form -->
          <div class="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl space-y-4">
            <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Add Custom Property</h4>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Key</label>
                <input
                  type="text"
                  v-model="newPropKey"
                  placeholder="e.g., hw_disk_bus"
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Value</label>
                <input
                  type="text"
                  v-model="newPropVal"
                  placeholder="e.g., scsi"
                  class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div class="flex justify-end pt-1">
              <button
                @click="addProperty"
                :disabled="!newPropKey.trim() || !newPropVal.trim() || updating"
                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {{ updating ? 'Saving...' : 'Add Property' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Trash } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'
import type { Image } from '@/services/compute.service'
import DistroLogo from './DistroLogo.vue'

const props = defineProps<{
  show: boolean
  image: Image
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const computeStore = useComputeStore()
const activeTab = ref<'info' | 'metadata'>('info')
const updating = ref(false)

const newPropKey = ref('')
const newPropVal = ref('')

const tabs = [
  { value: 'info' as const, label: 'Standard Info' },
  { value: 'metadata' as const, label: 'Metadata Properties' }
]

const hasProperties = computed(() => {
  return props.image.properties && Object.keys(props.image.properties).length > 0
})

async function addProperty() {
  const k = newPropKey.value.trim()
  const v = newPropVal.value.trim()
  if (!k || !v) return

  updating.value = true
  try {
    // Glance JSON Patch syntax: op add on /<key>
    await computeStore.updateImageMetadata(props.image.id, [
      { op: 'add', path: `/${k}`, value: v }
    ])
    newPropKey.value = ''
    newPropVal.value = ''
  } catch (err: any) {
    alert('Failed to add metadata property: ' + (err.message || err))
  } finally {
    updating.value = false
  }
}

async function deleteProperty(key: string) {
  if (!confirm(`Are you sure you want to remove the "${key}" property?`)) return

  updating.value = true
  try {
    // Glance JSON Patch syntax: op remove on /<key>
    await computeStore.updateImageMetadata(props.image.id, [
      { op: 'remove', path: `/${key}` }
    ])
  } catch (err: any) {
    alert('Failed to remove metadata property: ' + (err.message || err))
  } finally {
    updating.value = false
  }
}
</script>
