<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <FolderKanban :style="{ color: 'var(--accent)' }" :size="32" /> Identity & Access (Keystone)
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">Manage project spaces, domain quotas, user accounts, and credentials policy.</p>
      </div>
      <button
        @click="openCreateModal"
        class="btn-primary animate-pulse-slow"
      >
        <span>+</span> Create Project
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Projects</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">{{ identityStore.totalProjectsCount }}</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <FolderKanban :size="20" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Users</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">14</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <Users :size="20" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Custom Roles</div>
          <div class="text-3xl font-extrabold mt-1.5 text-blue-400">4</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-blue-500/10 border-blue-500/20">
          <Fingerprint :size="18" class="text-blue-400" />
        </div>
      </div>
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">API Keys Active</div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">12</div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20">
          <Key :size="18" class="text-emerald-400" />
        </div>
      </div>
    </div>

    <!-- Active Projects & Allocated Quota Sliders -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Projects Table -->
      <div class="lg:col-span-2 bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
          <h2 class="font-semibold text-lg text-white">All Projects</h2>
          <input
            v-model="searchQuery"
            placeholder="Filter projects..."
            class="form-input sm:w-64"
          />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
                <th class="p-4">Project Name</th>
                <th class="p-4">Description</th>
                <th class="p-4">Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-850 text-sm">
              <tr v-if="identityStore.loading">
                <td colspan="4" class="p-8 text-center text-zinc-500">
                  <Loader class="animate-spin inline-block mr-2" :size="16" /> Loading identities from Keystone API...
                </td>
              </tr>
              <tr v-else-if="filteredProjects.length === 0">
                <td colspan="4" class="p-8 text-center text-zinc-500">
                  No projects found.
                </td>
              </tr>
              <tr v-for="proj in filteredProjects" :key="proj.name" class="hover:bg-zinc-900/30 transition-colors">
                <td class="p-4 font-semibold text-white">{{ proj.name }}</td>
                <td class="p-4 text-zinc-400 max-w-xs truncate">{{ proj.description }}</td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium border" :class="proj.statusClass">
                    {{ proj.status }}
                  </span>
                </td>
                <td class="p-4 text-right">
                  <button @click="openQuotasModal(proj)" class="btn-table">
                    Edit Quotas
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resource Quotas usage breakdown component -->
      <DefaultDomainQuotasCard
        :cores="quotaCores"
        :ram="quotaRam"
        :disk="quotaDisk"
      />
    </div>

    <!-- Create Project Modal component -->
    <CreateProjectModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @create="handleCreateProject"
    />

    <!-- Edit Quotas Modal component -->
    <EditQuotasModal
      :show="showQuotasModal"
      :project="selectedProject"
      :current-cores="quotaCores"
      :current-ram="quotaRam"
      :current-disk="quotaDisk"
      @close="showQuotasModal = false"
      @update="handleUpdateQuotas"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { FolderKanban, Users, Fingerprint, Key, Loader } from 'lucide-vue-next'
import { useIdentityStore } from '@/stores/identity'

// Small modular sub-components
import CreateProjectModal from '@/components/identity/CreateProjectModal.vue'
import EditQuotasModal from '@/components/identity/EditQuotasModal.vue'
import DefaultDomainQuotasCard from '@/components/identity/DefaultDomainQuotasCard.vue'

const identityStore = useIdentityStore()
const searchQuery = ref('')

// Domain global quotas tracking state
const quotaCores = ref(128)
const quotaRam = ref(256)
const quotaDisk = ref(10240) // 10 TB

// Modal triggers
const showCreateModal = ref(false)
const showQuotasModal = ref(false)
const selectedProject = ref<any>(null)

// Form states
const newProjName = ref('')
const newProjDesc = ref('')
const newProjEnabled = ref(true)

const filteredProjects = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return identityStore.projects.filter(
    p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
  )
})

function openCreateModal() {
  newProjName.value = ''
  newProjDesc.value = ''
  newProjEnabled.value = true
  showCreateModal.value = true
}

async function handleCreateProject(data: { name: string; description: string; enabled: boolean }) {
  try {
    await identityStore.createProject(data.name, data.description, data.enabled)
    showCreateModal.value = false
    alert(`Keystone project "${data.name}" successfully provisioned.`)
  } catch (err: any) {
    alert('Failed to provision project: ' + (err.message || err))
  }
}

function openQuotasModal(proj: any) {
  selectedProject.value = proj
  showQuotasModal.value = true
}

function handleUpdateQuotas(data: { cores: number; ram: number; disk: number }) {
  quotaCores.value = data.cores
  quotaRam.value = data.ram
  quotaDisk.value = data.disk
  showQuotasModal.value = false
  alert(`Domain quotas successfully updated for project "${selectedProject.value.name}".`)
}

onMounted(() => {
  identityStore.loadProjects()
})
</script>

