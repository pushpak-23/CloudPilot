<template>
  <div class="space-y-6">
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">Glance OS Images</h2>
      </div>
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
            <th class="p-4">Image ID</th>
            <th class="p-4">OS Name</th>
            <th class="p-4">Disk Format</th>
            <th class="p-4">Min RAM / Disk</th>
            <th class="p-4">Image Size</th>
            <th class="p-4">Visibility</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-850">
          <tr v-for="img in computeStore.images" :key="img.id" class="hover:bg-zinc-900/30 transition-colors">
            <td class="p-4 font-mono text-xs text-zinc-500">{{ img.id.slice(0, 8) }}...</td>
            <td class="p-4">
              <div class="flex items-center gap-2">
                <DistroLogo :name="img.name" size="xs" />
                <button
                  @click="openDetails(img)"
                  class="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-all cursor-pointer text-left"
                >
                  {{ img.name }}
                </button>
              </div>
            </td>
            <td class="p-4 text-zinc-400 font-mono text-xs">{{ img.diskFormat }}</td>
            <td class="p-4 text-zinc-300">{{ img.minRam }} MB RAM / {{ img.minDisk }} GB Disk</td>
            <td class="p-4 text-zinc-300 font-mono">{{ img.size }}</td>
            <td class="p-4 text-zinc-400">{{ img.visibility }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Image Details Modal -->
    <ImageDetailsModal
      v-if="selectedImage"
      :show="showModal"
      :image="selectedImage"
      @close="closeDetails"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComputeStore } from '@/stores/compute'
import type { Image } from '@/services/compute.service'
import DistroLogo from './DistroLogo.vue'
import ImageDetailsModal from './ImageDetailsModal.vue'

const computeStore = useComputeStore()
const selectedImage = ref<Image | null>(null)
const showModal = ref(false)

function openDetails(img: Image) {
  selectedImage.value = img
  showModal.value = true
}

function closeDetails() {
  selectedImage.value = null
  showModal.value = false
}
</script>
