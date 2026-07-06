<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <Layers :style="{ color: 'var(--accent)' }" :size="32" /> Heat Orchestration Plane
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Automate cloud infrastructure provisioning using declarative OpenStack Heat Orchestration Templates (HOT).
        </p>
      </div>

      <button
        @click="openLaunchWizard"
        class="btn-primary"
      >
        <span>+</span> Launch Stack
      </button>
    </div>

    <!-- Main Workspace Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Stacks List Panel (Left/Center) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
          <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/20">
            <h2 class="font-semibold text-lg text-white">Active Stacks</h2>
            <input
              v-model="searchQuery"
              placeholder="Filter stacks..."
              class="form-input sm:w-64"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/80 select-none">
                  <th class="p-4">Stack Name</th>
                  <th class="p-4">Template Engine</th>
                  <th class="p-4">Status</th>
                  <th class="p-4">Created Time</th>
                  <th class="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-850 text-sm">
                <tr v-if="orchestrationStore.loading && orchestrationStore.stacks.length === 0">
                  <td colspan="5" class="p-8 text-center text-zinc-500">
                    <Loader class="animate-spin inline-block mr-2" :size="16" /> Querying Heat API resources...
                  </td>
                </tr>
                <tr v-else-if="filteredStacks.length === 0">
                  <td colspan="5" class="p-8 text-center text-zinc-500">
                    No stacks deployed.
                  </td>
                </tr>
                <tr
                  v-for="stack in filteredStacks"
                  :key="stack.id"
                  class="even:bg-zinc-900/20 odd:bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                  :class="selectedStack?.id === stack.id ? 'bg-blue-955/20 border-l-2 border-blue-500 bg-blue-500/5' : ''"
                  @click="selectStack(stack)"
                >
                  <td class="p-4 font-semibold text-white">
                    <div class="text-blue-400 hover:underline flex items-center gap-1.5">
                      {{ stack.name }}
                    </div>
                    <div class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ stack.id }}</div>
                  </td>
                  <td class="p-4"><span class="text-xs uppercase px-2.5 py-0.5 rounded border border-zinc-700 bg-zinc-900 text-zinc-400">{{ stack.templateType }}</span></td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border" :class="stack.statusClass">
                      <span class="w-1.5 h-1.5 rounded-full" :class="stack.bulletClass"></span>
                      {{ stack.status }}
                    </span>
                  </td>
                  <td class="p-4 text-zinc-400 font-mono text-xs">{{ formatDate(stack.createdAt) }}</td>
                  <td class="p-4 text-right" @click.stop>
                    <button
                      @click="handleDeleteStack(stack)"
                      class="btn-table-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Selected Stack Details card component -->
        <StackDetailsCard
          v-if="selectedStack"
          :stack="selectedStack"
          :events="orchestrationStore.events"
        >
          <template #topology>
            <!-- Topology visual map component -->
            <StackTopologyMap
              :topology="selectedStack.topology"
              :stackName="selectedStack.name"
            />
          </template>
        </StackDetailsCard>
      </div>

      <!-- Domain Quota side stats (Right) -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 self-start">
        <h3 class="font-bold text-lg text-white border-b border-zinc-800 pb-3">Heat Stack Policies</h3>
        <p class="text-xs text-zinc-400 leading-relaxed">
          OpenStack Orchestration coordinates resource launches in parallel. Changes deployed via templates are applied incrementally to avoid service disruption.
        </p>

        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg">
              <Check :size="16" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white uppercase">State Engine</h4>
              <p class="text-[10px] text-zinc-500">Convergence provisioning enabled</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              <Check :size="16" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white uppercase">Rolling Updates</h4>
              <p class="text-[10px] text-zinc-500">Incremental stack replacement support</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
              <Check :size="16" />
            </div>
            <div class="text-left">
              <h4 class="text-xs font-bold text-white uppercase">Quota Guard</h4>
              <p class="text-[10px] text-zinc-500">Pre-apply limits validation check</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Launch Stack Wizard Modal component -->
    <LaunchStackModal
      :show="showWizardModal"
      :deploying="orchestrationStore.deploying"
      :samples="templateSamples"
      @close="showWizardModal = false"
      @launch="handleLaunchStack"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Layers,
  Loader,
  Check,
} from 'lucide-vue-next'
import { useOrchestrationStore } from '@/stores/orchestration'

// Small modular sub-components
import LaunchStackModal from '@/components/orchestration/LaunchStackModal.vue'
import StackDetailsCard from '@/components/orchestration/StackDetailsCard.vue'
import StackTopologyMap from '@/components/orchestration/StackTopologyMap.vue'

const orchestrationStore = useOrchestrationStore()
const searchQuery = ref('')

// Selected Stack for Inspector
const selectedStack = ref<any>(null)

// Wizard dialog triggers
const showWizardModal = ref(false)

const filteredStacks = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return orchestrationStore.stacks.filter(
    s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
})

const templateSamples = {
  ha_web: {
    title: 'HA Web Server',
    params: {
      web_port: '8080',
      flavor: 'm1.medium',
      image: 'Ubuntu 22.04 LTS',
      min_nodes: '2',
      max_nodes: '10'
    },
    yaml: `heat_template_version: 2018-08-31
description: Auto-scaling HA web server cluster behind haproxy load balancer.

parameters:
  web_port:
    type: number
    default: 8080
  flavor:
    type: string
    default: m1.medium
  image:
    type: string
    default: Ubuntu 22.04 LTS

resources:
  public-net:
    type: OS::Neutron::Net
  sec-group-web:
    type: OS::Neutron::SecurityGroup
  web-server-group:
    type: OS::Heat::AutoScalingGroup
  haproxy-lb:
    type: OS::Octavia::LoadBalancer`
  },
  pg_pool: {
    title: 'PostgreSQL Pool',
    params: {
      db_name: 'cloudpilot_db',
      db_user: 'pg_owner',
      replica_count: '2',
      volume_size: '250GB'
    },
    yaml: `heat_template_version: 2018-08-31
description: Multi-replica PostgreSQL cluster with volumes attached to backup store.

parameters:
  db_name:
    type: string
  db_user:
    type: string
  replica_count:
    type: number
  volume_size:
    type: string

resources:
  db-network:
    type: OS::Neutron::Net
  pg-primary:
    type: OS::Nova::Server
  pg-replicas:
    type: OS::Heat::ResourceGroup`
  },
  custom: {
    title: 'Custom Template',
    params: {},
    yaml: `heat_template_version: 2018-08-31
description: Paste custom heat orchestration HOT layout parameters here...
resources:
  my-custom-node:
    type: OS::Nova::Server`
  }
}

function openLaunchWizard() {
  showWizardModal.value = true
}

async function selectStack(stack: any) {
  selectedStack.value = stack
  await Promise.allSettled([
    orchestrationStore.loadEvents(stack.id),
    orchestrationStore.loadStackResources(stack.id)
  ])
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString()
  } catch (e) {
    return dateStr
  }
}

async function handleLaunchStack(data: { name: string; templateType: string; parameters: Record<string, string>; yaml: string }) {
  try {
    await orchestrationStore.launchStack({
      name: data.name,
      templateType: data.templateType,
      parameters: data.parameters,
      templateYaml: data.yaml
    })
    showWizardModal.value = false
    alert(`Heat stack "${data.name}" deployment initiated successfully.`)
    if (orchestrationStore.stacks.length > 0) {
      await selectStack(orchestrationStore.stacks[0])
    }
  } catch (err: any) {
    alert('Failed to deploy stack: ' + (err.message || err))
  }
}

async function handleDeleteStack(stack: any) {
  if (confirm(`Are you sure you want to delete stack "${stack.name}"?`)) {
    try {
      await orchestrationStore.deleteStack(stack.id)
      if (selectedStack.value?.id === stack.id) {
        selectedStack.value = null
      }
    } catch (err: any) {
      alert('Failed to delete stack: ' + (err.message || err))
    }
  }
}

onMounted(async () => {
  await orchestrationStore.loadStacks()
  if (orchestrationStore.stacks.length > 0) {
    await selectStack(orchestrationStore.stacks[0])
  }
})
</script>
