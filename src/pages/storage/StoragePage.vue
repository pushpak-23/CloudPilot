<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white">Storage Volumes</h1>
        <p class="text-zinc-400 mt-1">Manage and provision block storage volumes powered by Ceph storage clusters.</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4.5 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
      >
        <span>+</span> Create Volume
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Volumes</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">{{ storageStore.totalVolumesCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <HardDrive :size="20" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">In-Use</div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">{{ storageStore.attachedCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20">
          <LinkIcon :size="18" class="text-emerald-400" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Available</div>
          <div class="text-3xl font-extrabold mt-1.5 text-blue-400">{{ storageStore.availableCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-blue-500/10 border-blue-500/20">
          <Unlock :size="18" class="text-blue-400" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Capacity</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">
            {{ (storageStore.totalAllocatedGb / 1024).toFixed(1) }} TB
          </div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <Database :size="20" />
        </div>
      </div>
    </div>

    <!-- Quota Visual representation -->
    <div class="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-3">
      <div class="flex justify-between items-center text-sm font-semibold">
        <span class="text-zinc-400">Ceph Pool Storage Quota</span>
        <span class="text-white">{{ (storageStore.totalAllocatedGb / 1024).toFixed(2) }} TB Allocated / 10.0 TB Max Limit</span>
      </div>
      <div class="w-full bg-zinc-950 rounded-full h-3 overflow-hidden border border-zinc-850 flex p-0.5">
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-1000"
          :style="{ width: `${(storageStore.totalAllocatedGb / (10 * 1024)) * 100}%` }"
        ></div>
      </div>
      <div class="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
        <span>Current usage: {{ ((storageStore.totalAllocatedGb / (10 * 1024)) * 100).toFixed(1) }}%</span>
        <span>Remaining: {{ (10 - storageStore.totalAllocatedGb / 1024).toFixed(2) }} TB available</span>
      </div>
    </div>

    <!-- Volumes Table -->
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">All Volumes</h2>
        <input
          v-model="searchQuery"
          placeholder="Filter volumes..."
          class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
              <th class="p-4">Volume Name</th>
              <th class="p-4">Status</th>
              <th class="p-4">Size</th>
              <th class="p-4">Ceph Backend Pool</th>
              <th class="p-4">Attached Resource</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="storageStore.loading">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                <Loader class="animate-spin inline-block mr-2" :size="16" /> Loading volumes from Cinder API...
              </td>
            </tr>
            <tr v-else-if="filteredVolumes.length === 0">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                No storage volumes found.
              </td>
            </tr>
            <tr v-for="vol in filteredVolumes" :key="vol.name" class="hover:bg-zinc-900/30 transition-colors">
              <td class="p-4 font-semibold text-white">{{ vol.name }}</td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border" :class="vol.statusClass">
                  <span class="w-1.5 h-1.5 rounded-full" :class="vol.bulletClass"></span>
                  {{ vol.status }}
                </span>
              </td>
              <td class="p-4 font-mono text-zinc-300">{{ vol.size }}</td>
              <td class="p-4 text-zinc-400 font-mono text-xs">{{ vol.type }}</td>
              <td class="p-4 text-zinc-400">
                <span v-if="vol.attachedTo && vol.attachedTo !== 'None (Unattached)'" class="text-blue-400 flex items-center gap-1.5">
                  <Server :size="12" /> {{ vol.attachedTo }}
                </span>
                <span v-else class="text-zinc-650 italic">Unattached</span>
              </td>
              <td class="p-4 text-right">
                <button
                  @click="storageStore.deleteVolume(vol.name)"
                  class="text-xs px-2.5 py-1 rounded border border-red-500/25 bg-red-950/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Volume Dialog Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">Create Block Storage Volume</h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Volume Name</label>
            <input
              v-model="newVolName"
              placeholder="e.g., vol-data-store"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Size (GB)</label>
              <input
                type="number"
                v-model.number="newVolSize"
                min="10"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Ceph Pool / Type</label>
              <select
                v-model="newVolType"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ceph-rbd (SSD)">ceph-rbd (SSD)</option>
                <option value="ceph-ec (HDD)">ceph-ec (HDD)</option>
                <option value="fast-nvme (NVMe)">fast-nvme (NVMe)</option>
              </select>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showCreateModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitCreate"
            :disabled="!newVolName.trim() || newVolSize < 1"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Create Volume
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { HardDrive, Link as LinkIcon, Unlock, Database, Loader } from 'lucide-vue-next'
import { useStorageStore } from '@/stores/storage'

const storageStore = useStorageStore()
const searchQuery = ref('')
const showCreateModal = ref(false)
const newVolName = ref('')
const newVolSize = ref(100)
const newVolType = ref('ceph-rbd (SSD)')

const filteredVolumes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return storageStore.volumes.filter(
    v => v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)
  )
})

function submitCreate() {
  if (newVolName.value.trim() && newVolSize.value > 0) {
    storageStore.createVolume(newVolName.value.trim(), newVolSize.value, newVolType.value)
    newVolName.value = ''
    newVolSize.value = 100
    showCreateModal.value = false
  }
}

onMounted(() => {
  storageStore.loadVolumes()
})
</script>
