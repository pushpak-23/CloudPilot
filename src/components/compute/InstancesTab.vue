<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total VMs</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">{{ computeStore.totalInstancesCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400"><Server :size="18" /></div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Active</div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">{{ computeStore.runningCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20"><Play :size="16" class="text-emerald-400" /></div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stopped</div>
          <div class="text-3xl font-extrabold mt-1.5 text-zinc-400">{{ computeStore.stoppedCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400"><Square :size="16" /></div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Deploying</div>
          <div class="text-3xl font-extrabold mt-1.5 text-blue-400 animate-pulse">{{ computeStore.provisioningCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-blue-500/10 border-blue-500/20"><Loader :size="16" class="text-blue-400" :class="{ 'animate-spin': computeStore.provisioningCount > 0 }" /></div>
      </div>
    </div>

    <!-- Bulk Actions Panel -->
    <div v-if="selectedVmIds.length > 0" class="flex flex-wrap items-center justify-between gap-4 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/35">
          {{ selectedVmIds.length }} selected
        </span>
        <span class="text-zinc-300 text-xs">Bulk Operations Available</span>
      </div>
      
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="bulkStart"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <Play :size="12" /> Start
        </button>
        <button
          @click="bulkStop"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <Square :size="12" /> Stop
        </button>
        <button
          @click="bulkReboot"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <RefreshCw :size="12" /> Reboot
        </button>
        <button
          @click="bulkDelete"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/25 bg-red-950/10 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold cursor-pointer"
        >
          <Trash :size="12" /> Terminate
        </button>

        <div class="h-5 w-px bg-zinc-800 mx-2"></div>

        <!-- Security Groups associations -->
        <div class="flex items-center gap-1.5 select-none">
          <select
            v-model="bulkSg"
            class="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="" disabled>-- Security Group --</option>
            <option v-for="sg in sgList" :key="sg.id || sg.name" :value="sg.name">{{ sg.name }}</option>
          </select>
          <button
            @click="bulkAddSg"
            :disabled="!bulkSg"
            class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer"
          >
            Add SG
          </button>
          <button
            @click="bulkRemoveSg"
            :disabled="!bulkSg"
            class="px-2.5 py-1 rounded border border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-xs font-bold transition-all cursor-pointer"
          >
            Remove SG
          </button>
        </div>
      </div>
    </div>

    <!-- Instances List Table -->
    <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl max-h-[80vh] overflow-y-auto shadow-xl">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">All Active Instances</h2>
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            placeholder="Search instances..."
            class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
          />
          <button
            @click="$emit('launch')"
            class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
          >
            + Launch VM
          </button>
        </div>
      </div>

      <div class="overflow-x-auto overflow-visible">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
              <th class="p-4 w-12 text-center">
                <input type="checkbox" v-model="selectAll" class="h-4 w-4 text-cyan-600 bg-zinc-800 border border-cyan-600 rounded focus:ring-2 focus:ring-cyan-500" />
              </th>
              <th class="p-4">VM Name</th>
              <th class="p-4">Status</th>
              <th class="p-4">IP Address</th>
              <th class="p-4">Flavor</th>
              <th class="p-4">OS Image</th>
              <th class="p-4">Host Node</th>
              <th class="p-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="computeStore.loading">
              <td colspan="8" class="p-8 text-center text-zinc-500">
                <Loader class="animate-spin inline-block mr-2" :size="16" /> Querying compute instances...
              </td>
            </tr>
            <tr v-else-if="filteredVms.length === 0">
              <td colspan="8" class="p-8 text-center text-zinc-500">No instances found.</td>
            </tr>
            <tr
              v-for="vm in filteredVms"
              :key="vm.id"
              :class="[
                'hover:bg-zinc-900/30 transition-colors',
                selectedVmIds.includes(vm.id) ? 'bg-blue-600/5' : ''
              ]"
            >
              <td class="p-4 text-center">
                <input type="checkbox" :value="vm.id" v-model="selectedVmIds" class="h-4 w-4 text-cyan-600 bg-zinc-800 border border-cyan-600 rounded focus:ring-2 focus:ring-cyan-500" />
              </td>
              <td class="p-4 font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors" @click="$emit('open-details', vm.id)">
                {{ vm.name }}
              </td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border" :class="vm.statusClass">
                  <span class="w-1.5 h-1.5 rounded-full" :class="[vm.bulletClass, vm.status === 'Provisioning' || vm.status === 'Rebuilding' || vm.status === 'Resizing' || vm.status === 'Migrating' ? 'animate-ping' : '']"></span>
                  {{ vm.status }}
                </span>
              </td>
              <td class="p-4 font-mono text-xs text-zinc-300">{{ vm.ip }}</td>
              <td class="p-4 text-zinc-400 font-mono text-xs">{{ vm.flavor }}</td>
              <td class="p-4 text-zinc-400">
                <div class="flex items-center gap-1.5">
                  <DistroLogo :name="vm.image" size="xs" />
                  <span>{{ vm.image }}</span>
                </div>
              </td>
              <td class="p-4 text-zinc-500 font-mono text-xs">{{ vm.host }}</td>
              <td class="p-4 text-right relative">
                <div class="flex justify-end gap-1.5">
                  <button
                    v-if="vm.status === 'Active'"
                    @click="computeStore.stopInstance(vm.id)"
                    class="btn-table p-1.5"
                    title="Shut Down"
                  >
                    <Square :size="14" />
                  </button>
                  <button
                    v-if="vm.status === 'Shutoff'"
                    @click="computeStore.startInstance(vm.id)"
                    class="btn-table p-1.5"
                    title="Power On"
                  >
                    <Play :size="14" />
                  </button>
                  <button
                    @click.stop="openOperationsDropdown(vm.id)"
                    class="btn-table flex items-center gap-1"
                  >
                    Configure <ChevronDown :size="12" />
                  </button>
                  <button
                    @click="computeStore.terminateInstance(vm.id)"
                    class="btn-table-danger p-1.5"
                    title="Terminate Instance"
                  >
                    <Trash :size="14" />
                  </button>
                </div>

                <!-- Operations Floating Menu Overlay -->
                <div
                  v-if="activeOperationsVm === vm.id"
                  class="fixed right-4 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-30 text-left space-y-0.5"
                >
                  <div class="px-2 py-1 text-[10px] font-bold text-zinc-500 uppercase border-b border-zinc-800/80 mb-1 select-none">
                    Hypervisor Lifecycle Actions
                  </div>
                  <button
                    v-if="vm.status === 'Active'"
                    @click="triggerReboot(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw :size="12" /> Soft Reboot
                  </button>
                  <button
                    v-if="vm.status === 'Active'"
                    @click="triggerPause(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Pause :size="12" /> Pause Instance
                  </button>
                  <button
                    v-if="vm.status === 'Paused'"
                    @click="computeStore.unpauseInstance(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Play :size="12" /> Unpause Instance
                  </button>
                  <button
                    v-if="vm.status === 'Active'"
                    @click="triggerSuspend(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Pause :size="12" /> Suspend Instance
                  </button>
                  <button
                    v-if="vm.status === 'Suspended'"
                    @click="computeStore.resumeInstance(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Play :size="12" /> Resume Instance
                  </button>
                  <button
                    v-if="vm.status === 'Active'"
                    @click="triggerShelve(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Layers :size="12" /> Shelve VM
                  </button>
                  <button
                    v-if="vm.status === 'Shelved'"
                    @click="computeStore.unshelveInstance(vm.id)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Layers :size="12" /> Unshelve VM
                  </button>
                  <hr class="border-zinc-800 my-1" />
                  <button
                    @click="triggerResizeModal(vm)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Settings :size="12" /> Resize Instance
                  </button>
                  <button
                    @click="triggerRebuildModal(vm)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <RefreshCw :size="12" /> Rebuild Image
                  </button>
                  <button
                    v-if="vm.status === 'Active'"
                    @click="triggerMigrateModal(vm)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Globe :size="12" /> Live Migration
                  </button>
                  <button
                    @click="triggerSnapshotModal(vm)"
                    class="w-full flex items-center gap-2 rounded px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Server :size="12" /> Take Snapshot
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Live Migration Target Modal -->
    <div v-if="showMigrateModal && migrateTargetVm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" @click.self="showMigrateModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">Live Migrate VM: {{ migrateTargetVm.name }}</h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Destination Hypervisor</label>
            <select v-model="migrateDestinationHost" class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500">
              <option v-for="h in availableHostsForMigration" :key="h.name" :value="h.name">{{ h.name }} (Status: {{ h.status }}, VMs: {{ h.vmsCount }})</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button @click="showMigrateModal = false" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer">Cancel</button>
          <button @click="submitMigration" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer">Migrate VM</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Server, Play, Square, Pause, RefreshCw, Trash, Layers, Globe, ChevronDown, Settings, Loader } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'
import { networkService } from '@/services/network.service'
import DistroLogo from './DistroLogo.vue'

const emit = defineEmits<{
  (e: 'launch'): void
  (e: 'open-details', id: string): void
}>()

const computeStore = useComputeStore()
const searchQuery = ref('')
const activeOperationsVm = ref<string | null>(null)

// Bulk actions state
const selectedVmIds = ref<string[]>([])
const bulkSg = ref('')
const sgList = ref<any[]>([])

const filteredVms = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return computeStore.instances.filter(
    vm => vm.name.toLowerCase().includes(q) || vm.flavor.toLowerCase().includes(q)
  )
})

// Select All computed property
const selectAll = computed({
  get() {
    return filteredVms.value.length > 0 && selectedVmIds.value.length === filteredVms.value.length
  },
  set(val) {
    if (val) {
      selectedVmIds.value = filteredVms.value.map(vm => vm.id)
    } else {
      selectedVmIds.value = []
    }
  }
})

// Bulk handlers
async function bulkStart() {
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  await Promise.all(ids.map(id => computeStore.startInstance(id)))
}

async function bulkStop() {
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  await Promise.all(ids.map(id => computeStore.stopInstance(id)))
}

async function bulkReboot() {
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  await Promise.all(ids.map(id => computeStore.rebootInstance(id)))
}

async function bulkDelete() {
  if (!confirm(`Are you sure you want to terminate these ${selectedVmIds.value.length} VM instances?`)) return
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  await Promise.all(ids.map(id => computeStore.terminateInstance(id)))
}

async function bulkAddSg() {
  if (!bulkSg.value) return
  const sg = bulkSg.value
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  try {
    await Promise.all(ids.map(id => computeStore.addSecurityGroupToInstance(id, sg)))
    alert(`Security group "${sg}" added to selected instances.`)
  } catch (err: any) {
    alert('Failed to associate security group: ' + (err.message || err))
  }
}

async function bulkRemoveSg() {
  if (!bulkSg.value) return
  const sg = bulkSg.value
  const ids = [...selectedVmIds.value]
  selectedVmIds.value = []
  try {
    await Promise.all(ids.map(id => computeStore.removeSecurityGroupFromInstance(id, sg)))
    alert(`Security group "${sg}" removed from selected instances.`)
  } catch (err: any) {
    alert('Failed to disassociate security group: ' + (err.message || err))
  }
}

function openOperationsDropdown(vmId: string) {
  activeOperationsVm.value = activeOperationsVm.value === vmId ? null : vmId
}

function closeDropdowns() {
  activeOperationsVm.value = null
}

// Lifecycle action wrappers
function triggerReboot(id: string) {
  computeStore.rebootInstance(id)
  closeDropdowns()
}
function triggerPause(id: string) {
  computeStore.pauseInstance(id)
  closeDropdowns()
}
function triggerSuspend(id: string) {
  computeStore.suspendInstance(id)
  closeDropdowns()
}
function triggerShelve(id: string) {
  computeStore.shelveInstance(id)
  closeDropdowns()
}
function triggerResizeModal(vm: any) {
  const nextFlav = computeStore.flavors.find(f => f.name !== vm.flavor)?.name || vm.flavor
  if (confirm(`Do you want to resize VM ${vm.name} to ${nextFlav}?`)) {
    computeStore.resizeInstance(vm.id, nextFlav)
  }
  closeDropdowns()
}
function triggerRebuildModal(vm: any) {
  const nextImg = computeStore.images.find(i => i.name !== vm.image)?.name || vm.image
  if (confirm(`Do you want to rebuild VM ${vm.name} using image ${nextImg}?`)) {
    computeStore.rebuildInstance(vm.id, nextImg)
  }
  closeDropdowns()
}
function triggerSnapshotModal(vm: any) {
  const snapName = prompt('Enter a name for the image snapshot:', `snap-${vm.name}`)
  if (snapName) {
    computeStore.takeSnapshot(vm.id, snapName)
    alert(`Snapshot "${snapName}" creation initiated. Check OS Images tab.`);
  }
  closeDropdowns()
}

// Live migration
const showMigrateModal = ref(false)
const migrateTargetVm = ref<any>(null)
const migrateDestinationHost = ref('')

const availableHostsForMigration = computed(() => {
  if (!migrateTargetVm.value) return []
  return computeStore.hypervisors.filter(
    h => h.name !== migrateTargetVm.value.host && h.status === 'Up'
  )
})

function triggerMigrateModal(vm: any) {
  migrateTargetVm.value = vm
  const hostOpts = availableHostsForMigration.value
  if (hostOpts.length > 0) {
    migrateDestinationHost.value = hostOpts[0]?.name || ''
    showMigrateModal.value = true
  } else {
    alert('No alternative active compute hypervisors available for live migration.')
  }
  closeDropdowns()
}

function submitMigration() {
  if (migrateTargetVm.value && migrateDestinationHost.value) {
    computeStore.liveMigrateInstance(migrateTargetVm.value.name, migrateDestinationHost.value)
    showMigrateModal.value = false
    migrateTargetVm.value = null
  }
}

onMounted(async () => {
  window.addEventListener('click', closeDropdowns)
  try {
    const sgs = await networkService.getSecurityGroups()
    sgList.value = sgs
  } catch (e) {
    console.warn('Failed to load security groups in bulk operations list:', e)
  }
})

onUnmounted(() => {
  window.removeEventListener('click', closeDropdowns)
})
</script>
