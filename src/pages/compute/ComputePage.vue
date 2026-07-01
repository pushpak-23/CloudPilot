<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1
          class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent"
        >
          Compute Control Plane
        </h1>
        <p class="text-zinc-400 mt-1">
          Manage virtual machines, flavors, Glance images, hypervisors, and bulk
          automated deployments.
        </p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer',
            activeTab === tab.value
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
              : 'bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <InstancesTab
      v-if="activeTab === 'instances'"
      @launch="showLaunchModal = true"
      @open-details="openServerDetails"
    />
    <FlavorsTab
      v-if="activeTab === 'flavors'"
      @create-flavor="showCreateFlavorModal = true"
    />
    <ImagesTab v-if="activeTab === 'images'" />
    <HypervisorsTab v-if="activeTab === 'hypervisors'" />
    <KeypairsTab
      v-if="activeTab === 'keypairs'"
      @create-keypair="showCreateKeyModal = true"
    />
    <BulkWizardTab v-if="activeTab === 'wizard'" />

    <!-- Modals -->
    <LaunchWizardModal
      :show="showLaunchModal"
      @close="showLaunchModal = false"
    />
    <CreateFlavorModal
      :show="showCreateFlavorModal"
      @close="showCreateFlavorModal = false"
    />
    <CreateKeypairModal
      :show="showCreateKeyModal"
      @close="showCreateKeyModal = false"
    />
    <ServerDetailsModal
      :show="serverDetailsModal"
      :id="selectedServerId"
      @close="serverDetailsModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useComputeStore } from '@/stores/compute'
import { useNetworkStore } from '@/stores/network'
import { useStorageStore } from '@/stores/storage'

// Tab Components
import InstancesTab from '@/components/compute/InstancesTab.vue'
import FlavorsTab from '@/components/compute/FlavorsTab.vue'
import ImagesTab from '@/components/compute/ImagesTab.vue'
import HypervisorsTab from '@/components/compute/HypervisorsTab.vue'
import KeypairsTab from '@/components/compute/KeypairsTab.vue'
import BulkWizardTab from '@/components/compute/BulkWizardTab.vue'

// Modal Components
import LaunchWizardModal from '@/components/compute/LaunchWizardModal.vue'
import CreateFlavorModal from '@/components/compute/CreateFlavorModal.vue'
import CreateKeypairModal from '@/components/compute/CreateKeypairModal.vue'
import ServerDetailsModal from '@/components/compute/ServerDetailsModal.vue'

const computeStore = useComputeStore()
const networkStore = useNetworkStore()
const storageStore = useStorageStore()

const activeTab = ref<
  'instances' | 'flavors' | 'images' | 'hypervisors' | 'keypairs' | 'wizard'
>('instances')

const tabs = [
  { value: 'instances', label: 'Instances' },
  { value: 'flavors', label: 'Flavors' },
  { value: 'images', label: 'OS Images' },
  { value: 'hypervisors', label: 'Hypervisors' },
  { value: 'keypairs', label: 'SSH Keys' },
  { value: 'wizard', label: 'Bulk Deploy' },
] as const

// Modal visibility states
const showLaunchModal = ref(false)
const showCreateFlavorModal = ref(false)
const showCreateKeyModal = ref(false)
const serverDetailsModal = ref(false)
const selectedServerId = ref('')

function openServerDetails(id: string) {
  selectedServerId.value = id
  serverDetailsModal.value = true
}

// Initialize data on mount
onMounted(() => {
  computeStore.loadAllComputeData(true)
  networkStore.loadNetworks(true)
  storageStore.loadVolumes(true)
})
</script>
