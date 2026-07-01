<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden relative">
      <!-- Top accent -->
      <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-500"></div>

      <!-- Wizard Header -->
      <div class="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20 select-none">
        <div>
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <Server :size="20" class="text-blue-500" /> Launch Compute Instance Wizard
          </h2>
          <p class="text-zinc-500 text-xs mt-0.5">Configure provisioning parameters, block storage mappings, and network groups.</p>
        </div>
        <span class="text-xs text-zinc-400 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 font-semibold">
          Step {{ launchStep }} of 6: {{ stepNames[launchStep - 1] }}
        </span>
      </div>

      <!-- Wizard Body -->
      <div class="flex-1 flex overflow-hidden">
        <!-- Left Sidebar Stepper Indicators -->
        <div class="w-64 border-r border-zinc-800 bg-zinc-950/40 p-4 space-y-1 hidden md:block select-none">
          <button
            v-for="(stepName, index) in stepNames"
            :key="index"
            @click="goToStep(index + 1)"
            :class="[
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-left transition-colors cursor-pointer',
              launchStep === index + 1
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-zinc-500 hover:text-zinc-350 hover:bg-zinc-900/40'
            ]"
          >
            <span
              class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border font-bold"
              :class="[
                launchStep === index + 1
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : launchStep > index + 1
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-800 text-zinc-500 bg-zinc-900'
              ]"
            >
              <Check v-if="launchStep > index + 1" :size="10" />
              <span v-else>{{ index + 1 }}</span>
            </span>
            {{ stepName }}
          </button>
        </div>

        <!-- Right Content Pane -->
        <div class="flex-1 p-6 overflow-y-auto bg-zinc-900/10 space-y-4">
          <!-- Step 1: Details -->
          <div v-if="launchStep === 1" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Instance Name *</label>
              <input
                v-model="launchName"
                placeholder="e.g., prod-web-vm-01"
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder-zinc-700"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Description</label>
              <textarea
                v-model="launchDescription"
                placeholder="Describe the purpose of this VM instance..."
                rows="3"
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg p-3 text-sm text-white outline-none placeholder-zinc-700"
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Availability Zone</label>
                <select
                  v-model="launchAz"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option v-for="az in computeStore.availabilityZones" :key="az" :value="az">
                    {{ az }}
                  </option>
                </select>
                <p class="text-[10px] text-zinc-600 mt-0.5">
                  {{ computeStore.availabilityZones.length }} zone(s) discovered
                </p>
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">VM Instance Count</label>
                <input
                  type="number"
                  v-model.number="launchCount"
                  min="1"
                  max="50"
                  class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <!-- Step 2: Source -->
          <div v-if="launchStep === 2" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Boot Source Type</label>
              <select
                v-model="launchBootSource"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Image">Glance OS Image</option>
                <option value="Snapshot">Instance Image Snapshot</option>
                <option value="Volume">Cinder Storage Volume</option>
              </select>
            </div>

            <!-- Interactive Images/Volumes List selection -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Boot Source *</label>
              <div class="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-850 max-h-48 overflow-y-auto">
                <div
                  v-for="item in selectableBootSources"
                  :key="item.id"
                  @click="launchSelectedImage = item.id"
                  :class="[
                    'p-3 flex items-center justify-between text-xs cursor-pointer transition-colors select-none',
                    launchSelectedImage === item.id ? 'bg-blue-600/10 text-blue-400 font-semibold' : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                  ]"
                >
                  <div class="flex items-center gap-2">
                    <DistroLogo :name="item.name" size="xs" />
                    <span>{{ item.name }} ({{ item.diskFormat ? 'Format: ' + item.diskFormat : 'Cinder Volume' }}, Size: {{ item.size }})</span>
                  </div>
                  <Check v-if="launchSelectedImage === item.id" :size="12" class="text-blue-500" />
                </div>
                <div v-if="selectableBootSources.length === 0" class="p-4 text-center text-xs text-zinc-500 italic">
                  No boot sources available for the selected type.
                </div>
              </div>
            </div>

            <!-- Storage settings -->
            <div class="bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl space-y-3 select-none">
              <label class="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer">
                <input type="checkbox" v-model="launchCreateVolume" class="accent-blue-500 h-4 w-4" />
                Create New Volume (Cinder Backend)
              </label>
              <div v-if="launchCreateVolume" class="grid grid-cols-2 gap-4 pt-2">
                <div class="space-y-1">
                  <label class="text-[9px] font-bold text-zinc-500 uppercase">Volume Size (GB)</label>
                  <input type="number" v-model.number="launchVolumeSize" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white outline-none" />
                </div>
                <div class="flex items-center pt-5">
                  <label class="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 cursor-pointer">
                    <input type="checkbox" v-model="launchDeleteOnTerminate" class="accent-blue-500 h-4 w-4" />
                    Delete Volume on VM Termination
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 3: Flavor & Quotas -->
          <div v-if="launchStep === 3" class="space-y-4">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Flavor Profile *</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                <div
                  v-for="flav in computeStore.flavors"
                  :key="flav.id"
                  @click="launchSelectedFlavor = flav.id"
                  :class="[
                    'p-3 border rounded-xl cursor-pointer text-left transition-all select-none',
                    launchSelectedFlavor === flav.id
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-md'
                      : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-zinc-400'
                  ]"
                >
                  <div class="font-bold text-xs">{{ flav.name }}</div>
                  <div class="text-[10px] text-zinc-500 mt-1">
                    {{ flav.vcpus }} Cores / {{ (flav.ram/1024).toFixed(1) }} GB RAM / {{ flav.disk }} GB Disk
                  </div>
                </div>
              </div>
            </div>

            <!-- Quota impact analyzer dashboard -->
            <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 class="font-bold text-xs text-white uppercase tracking-wider border-b border-zinc-800 pb-2 flex items-center gap-2 select-none">
                <Activity :size="12" /> Projected Project Quotas Impact
              </h3>
              <div class="space-y-3 text-xs">
                <!-- CPU cores quota gauge -->
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">vCPU Cores</span>
                    <span :class="coresProjectedExceeded ? 'text-red-500 font-bold' : 'text-zinc-300'">
                      {{ coresAllocatedCurrent }} + <span class="font-bold text-blue-500 font-mono">+{{ coresAllocatedWizard }}</span> / {{ (computeStore.quotas?.cores?.limit ?? 20) < 0 ? 'Unlimited' : `${computeStore.quotas?.cores?.limit} Cores Max` }}
                    </span>
                  </div>
                  <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850 flex">
                    <div class="bg-zinc-700 h-full" :style="{ width: (computeStore.quotas?.cores?.limit ?? 20) < 0 ? '0%' : `${(coresAllocatedCurrent / computeStore.quotas.cores.limit) * 100}%` }"></div>
                    <div :class="coresProjectedExceeded ? 'bg-red-500' : 'bg-blue-600'" class="h-full" :style="{ width: (computeStore.quotas?.cores?.limit ?? 20) < 0 ? '0%' : `${(coresAllocatedWizard / computeStore.quotas.cores.limit) * 100}%` }"></div>
                  </div>
                </div>

                <!-- RAM quota gauge -->
                <div class="space-y-1">
                  <div class="flex justify-between">
                    <span class="text-zinc-500">RAM Size</span>
                    <span :class="ramProjectedExceeded ? 'text-red-500 font-bold' : 'text-zinc-300'">
                      {{ (ramAllocatedCurrent/1024).toFixed(1) }} GB + <span class="font-bold text-blue-500 font-mono">+{{ (ramAllocatedWizard/1024).toFixed(1) }} GB</span> / {{ (computeStore.quotas?.ram?.limit ?? 51200) < 0 ? 'Unlimited' : `${((computeStore.quotas?.ram?.limit ?? 51200)/1024).toFixed(0)} GB Max` }}
                    </span>
                  </div>
                  <div class="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850 flex">
                    <div class="bg-zinc-700 h-full" :style="{ width: (computeStore.quotas?.ram?.limit ?? 51200) < 0 ? '0%' : `${(ramAllocatedCurrent / computeStore.quotas.ram.limit) * 100}%` }"></div>
                    <div :class="ramProjectedExceeded ? 'bg-red-500' : 'bg-blue-600'" class="h-full" :style="{ width: (computeStore.quotas?.ram?.limit ?? 51200) < 0 ? '0%' : `${(ramAllocatedWizard / computeStore.quotas.ram.limit) * 100}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Step 4: Networks -->
          <div v-if="launchStep === 4" class="space-y-4">
            <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Allocate Network Interfaces *</label>
            <p class="text-zinc-550 text-xs mt-1">Select overlay networks to map network cards (NICs) to this instance.</p>
            
            <div class="space-y-2 select-none">
              <label
                v-for="net in networkStore.networks"
                :key="net.id"
                class="flex items-center justify-between p-3.5 border rounded-xl cursor-pointer hover:bg-zinc-950/40 transition-colors"
                :class="launchSelectedNetworks.includes(net.id) ? 'bg-zinc-950/70 border-blue-500/35 text-white' : 'bg-zinc-950 border-zinc-850 text-zinc-400'"
              >
                <div class="flex items-center gap-3">
                  <input type="checkbox" :value="net.id" v-model="launchSelectedNetworks" class="accent-blue-500 h-4.5 w-4.5 cursor-pointer" />
                  <div>
                    <div class="font-bold text-xs text-white">{{ net.name }}</div>
                    <div class="text-[10px] text-zinc-500 mt-0.5 font-mono">Subnet: {{ net.subnet }} (Gateway: {{ net.gateway }})</div>
                  </div>
                </div>
                <span class="text-[10px] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 uppercase font-mono">{{ net.external ? 'External' : 'Internal' }}</span>
              </label>
            </div>
          </div>

          <!-- Step 5: Security Groups & SSH Keypairs -->
          <div v-if="launchStep === 5" class="space-y-4">
            <!-- Keypair select & create -->
            <div class="space-y-3">
              <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">SSH Public Keypair *</label>
                <div class="flex gap-2">
                  <select
                    v-model="launchSelectedKeypair"
                    class="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="" disabled>-- Select Keypair --</option>
                    <option v-for="k in computeStore.keypairs" :key="k.name" :value="k.name">{{ k.name }}</option>
                  </select>
                  <button
                    type="button"
                    @click="showCreateKeypairInline = !showCreateKeypairInline"
                    class="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {{ showCreateKeypairInline ? 'Cancel' : '+ New Key' }}
                  </button>
                </div>
              </div>

              <!-- Inline creation form -->
              <div v-if="showCreateKeypairInline || computeStore.keypairs.length === 0" class="p-3.5 bg-zinc-950/40 border border-zinc-850/60 rounded-xl space-y-3">
                <div class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Create SSH Keypair</div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    v-model="newKeypairName"
                    placeholder="e.g. ops-key"
                    class="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    @click="handleCreateKeypairInline"
                    :disabled="!newKeypairName.trim() || creatingKeypairInline"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    {{ creatingKeypairInline ? 'Creating...' : 'Create' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Security groups list select -->
            <div class="space-y-1.5 select-none">
              <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Assign Security Policies</label>
              <div class="space-y-2">
                <label
                  v-for="sg in securityGroupsList"
                  :key="sg.id || sg.name"
                  class="flex items-center gap-3 p-3 border border-zinc-850 rounded-xl hover:bg-zinc-950/30 cursor-pointer"
                >
                  <input type="checkbox" :value="sg.name" v-model="launchSelectedSecurityGroups" class="accent-blue-500 h-4 w-4 cursor-pointer" />
                  <div>
                    <div class="text-xs font-semibold text-white">{{ sg.name }}</div>
                    <div class="text-[10px] text-zinc-500">{{ sg.description || 'Enable default ports and traffic access templates' }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Step 6: Configuration & Cloud-Init -->
          <div v-if="launchStep === 6" class="space-y-5">
            <!-- Mode toggle -->
            <div class="flex items-center gap-3">
              <button
                v-for="mode in cloudInitModes"
                :key="mode.value"
                @click="activeCloudInitMode = mode.value"
                :class="[
                  'px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border',
                  activeCloudInitMode === mode.value
                    ? 'bg-blue-600/15 text-blue-400 border-blue-500/30'
                    : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
                ]"
              >
                {{ mode.label }}
              </button>
            </div>

            <!-- Dual panel layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Left: Quick Setup Form -->
              <div class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-4">
                <div class="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Settings :size="14" class="text-blue-400" />
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Quick Setup</span>
                </div>
                <div class="space-y-3">
                  <div class="space-y-1.5">
                    <label class="text-[10px] font-semibold text-zinc-400 uppercase">Instance Password</label>
                    <input
                      type="password"
                      v-model="cloudInitPassword"
                      placeholder="Set root/user password..."
                      class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                      <input type="checkbox" v-model="cloudInitSshPwAuth" class="accent-blue-500 h-4 w-4" />
                      Enable SSH Password Authentication
                    </label>
                    <label class="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                      <input type="checkbox" v-model="cloudInitExpirePassword" class="accent-blue-500 h-4 w-4" />
                      Force Password Change on First Login
                    </label>
                  </div>
                  <div class="text-[10px] text-zinc-600 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-850 font-mono leading-relaxed">
                    Preview:<br/>
                    <span class="text-emerald-500">#cloud-config</span><br/>
                    <span v-if="cloudInitPassword" class="text-zinc-400">password: <span class="text-amber-400">{{ cloudInitPassword }}</span></span><br v-if="cloudInitPassword"/>
                    <span class="text-zinc-400">chpasswd: { expire: <span class="text-cyan-400">{{ cloudInitExpirePassword ? 'True' : 'False' }}</span> }</span><br/>
                    <span class="text-zinc-400">ssh_pwauth: <span class="text-cyan-400">{{ cloudInitSshPwAuth ? 'True' : 'False' }}</span></span>
                  </div>
                  <button
                    type="button"
                    @click="applyQuickSetupToRaw"
                    class="w-full px-3 py-1.5 bg-blue-600/15 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-600/25 transition-colors"
                  >
                    Apply to Raw Editor →
                  </button>
                </div>
              </div>

              <!-- Right: Raw Cloud-Init Editor -->
              <div class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-3 flex flex-col">
                <div class="flex items-center gap-2 border-b border-zinc-800 pb-2">
                  <Terminal :size="14" class="text-emerald-400" />
                  <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Raw Cloud-Init / User-Data</span>
                </div>
                <textarea
                  v-model="launchCloudInit"
                  :placeholder="rawEditorPlaceholder"
                  rows="12"
                  class="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                ></textarea>
                <p class="text-[10px] text-zinc-600">
                  Supports <code class="text-zinc-400">#cloud-config</code> YAML or <code class="text-zinc-400">#!/bin/bash</code> shell scripts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wizard Footer buttons -->
      <div class="p-6 border-t border-zinc-800 bg-zinc-950/20 flex items-center justify-between select-none">
        <button
          @click="$emit('close')"
          class="px-4.5 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
        >
          Cancel Wizard
        </button>
        
        <div class="flex gap-2">
          <button
            v-if="launchStep > 1"
            @click="launchStep--"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors bg-zinc-900 cursor-pointer"
          >
            Back
          </button>
          <button
            v-if="launchStep < 6"
            @click="launchStep++"
            :disabled="!isCurrentStepValid"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Next Step
          </button>
          <button
            v-else
            @click="submitLaunch"
            :disabled="!isWizardFormValid"
            class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            Launch Instance
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Server, Check, Activity, Settings, Terminal } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'
import { useNetworkStore } from '@/stores/network'
import { useStorageStore } from '@/stores/storage'
import { networkService } from '@/services/network.service'
import DistroLogo from './DistroLogo.vue'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const computeStore = useComputeStore()
const networkStore = useNetworkStore()
const storageStore = useStorageStore()

// Step state
const launchStep = ref(1)
const stepNames = ['Details', 'Boot Source', 'Flavor', 'Networks', 'Security & Keys', 'Configuration']

// Step 1
const launchName = ref('')
const launchDescription = ref('')
const launchAz = ref('nova')
const launchCount = ref(1)

// Step 2
const launchBootSource = ref('Image')
const launchSelectedImage = ref('')
const launchCreateVolume = ref(true)
const launchVolumeSize = ref(40)
const launchDeleteOnTerminate = ref(true)

// Step 3
const launchSelectedFlavor = ref('')

// Step 4
const launchSelectedNetworks = ref<string[]>([])

// Step 5
const launchSelectedSecurityGroups = ref<string[]>(['default'])
const launchSelectedKeypair = ref('')
const showCreateKeypairInline = ref(false)
const newKeypairName = ref('')
const creatingKeypairInline = ref(false)
const securityGroupsList = ref<any[]>([])

// Step 6 - Cloud Init dual panel
const launchCloudInit = ref('')
const cloudInitPassword = ref('')
const cloudInitSshPwAuth = ref(true)
const cloudInitExpirePassword = ref(false)
const activeCloudInitMode = ref<'quick' | 'raw'>('quick')

const cloudInitModes = [
  { value: 'quick' as const, label: 'Quick Setup' },
  { value: 'raw' as const, label: 'Raw Editor' }
]

const rawEditorPlaceholder = `#cloud-config
password: mypasswd
chpasswd: { expire: False }
ssh_pwauth: True

# Or use a shell script:
#!/bin/bash
apt-get update && apt-get install -y nginx`

function applyQuickSetupToRaw() {
  let config = '#cloud-config\n'
  if (cloudInitPassword.value) {
    config += `password: ${cloudInitPassword.value}\n`
  }
  config += `chpasswd: { expire: ${cloudInitExpirePassword.value ? 'True' : 'False'} }\n`
  config += `ssh_pwauth: ${cloudInitSshPwAuth.value ? 'True' : 'False'}\n`
  launchCloudInit.value = config
}

// Keypair inline creation
async function handleCreateKeypairInline() {
  if (!newKeypairName.value.trim()) return
  try {
    creatingKeypairInline.value = true
    await computeStore.addKeypair(newKeypairName.value.trim())
    launchSelectedKeypair.value = newKeypairName.value.trim()
    newKeypairName.value = ''
    showCreateKeypairInline.value = false
  } catch (err: any) {
    alert('Failed to create keypair: ' + (err.message || err))
  } finally {
    creatingKeypairInline.value = false
  }
}

// Boot sources
const selectableBootSources = computed(() => {
  if (launchBootSource.value === 'Image') {
    return computeStore.images.filter(img => !img.name.toLowerCase().includes('snap'))
  } else if (launchBootSource.value === 'Snapshot') {
    return computeStore.images.filter(img => img.name.toLowerCase().includes('snap'))
  } else if (launchBootSource.value === 'Volume') {
    return storageStore.volumes
      .filter(vol => vol.status === 'Available')
      .map(vol => ({
        id: vol.id,
        name: vol.name,
        diskFormat: 'volume',
        size: vol.size
      }))
  }
  return computeStore.images
})

// Navigation
function goToStep(step: number) {
  if (step > 0 && step <= 6) {
    let valid = true
    if (step > 1 && !isStepValid(1)) valid = false
    if (step > 2 && !isStepValid(2)) valid = false
    if (step > 3 && !isStepValid(3)) valid = false
    if (step > 4 && !isStepValid(4)) valid = false
    if (step > 5 && !isStepValid(5)) valid = false

    if (valid || step < launchStep.value) {
      launchStep.value = step
    }
  }
}

function isStepValid(step: number): boolean {
  if (step === 1) return launchName.value.trim() !== '' && launchCount.value > 0
  if (step === 2) return launchSelectedImage.value !== ''
  if (step === 3) return launchSelectedFlavor.value !== '' && !coresProjectedExceeded.value && !ramProjectedExceeded.value
  if (step === 4) return launchSelectedNetworks.value.length > 0
  if (step === 5) return launchSelectedKeypair.value !== ''
  return true
}

const isCurrentStepValid = computed(() => isStepValid(launchStep.value))
const isWizardFormValid = computed(() => {
  return isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4) && isStepValid(5)
})

// Quotas
const coresAllocatedCurrent = computed(() => computeStore.quotas?.cores?.inUse ?? 0)
const ramAllocatedCurrent = computed(() => computeStore.quotas?.ram?.inUse ?? 0)

const coresAllocatedWizard = computed(() => {
  const flav = computeStore.flavors.find(f => f.id === launchSelectedFlavor.value)
  return flav ? flav.vcpus * launchCount.value : 0
})

const ramAllocatedWizard = computed(() => {
  const flav = computeStore.flavors.find(f => f.id === launchSelectedFlavor.value)
  return flav ? flav.ram * launchCount.value : 0
})

const coresProjectedExceeded = computed(() => {
  const limit = computeStore.quotas?.cores?.limit ?? 20
  if (limit < 0) return false
  return (coresAllocatedCurrent.value + coresAllocatedWizard.value) > limit
})

const ramProjectedExceeded = computed(() => {
  const limit = computeStore.quotas?.ram?.limit ?? 51200
  if (limit < 0) return false
  return (ramAllocatedCurrent.value + ramAllocatedWizard.value) > limit
})

// Submit
function submitLaunch() {
  if (isWizardFormValid.value) {
    computeStore.launchInstanceAdvanced({
      name: launchName.value.trim(),
      count: launchCount.value,
      flavor: launchSelectedFlavor.value,
      image: launchSelectedImage.value,
      bootSource: launchBootSource.value,
      volumeSize: launchCreateVolume.value ? launchVolumeSize.value : 0,
      deleteOnTerminate: launchDeleteOnTerminate.value,
      networks: launchSelectedNetworks.value,
      securityGroups: launchSelectedSecurityGroups.value,
      keypair: launchSelectedKeypair.value,
      cloudInit: launchCloudInit.value,
      availabilityZone: launchAz.value
    })

    // Reset state
    launchStep.value = 1
    launchName.value = ''
    launchDescription.value = ''
    launchCount.value = 1
    emit('close')
  }
}

// Watchers for auto-selection
watch(
  () => computeStore.loading,
  (loading) => {
    if (!loading) {
      if (selectableBootSources.value.length > 0 && !launchSelectedImage.value) {
        launchSelectedImage.value = selectableBootSources.value[0]?.id || ''
      }
      if (computeStore.flavors.length > 0 && !launchSelectedFlavor.value) {
        const found = computeStore.flavors.find(f => f.name === 'm1.small') || computeStore.flavors[1] || computeStore.flavors[0]
        launchSelectedFlavor.value = found?.id || ''
      }
      if (computeStore.keypairs.length > 0 && !launchSelectedKeypair.value) {
        launchSelectedKeypair.value = computeStore.keypairs[0]?.name || ''
      }
    }
  }
)

watch(
  () => networkStore.loading,
  (loading) => {
    if (!loading && networkStore.networks.length > 0 && launchSelectedNetworks.value.length === 0) {
      const privateNet = networkStore.networks.find(n => n.name.toLowerCase().includes('private') || n.name.toLowerCase().includes('internal')) || networkStore.networks[0]
      launchSelectedNetworks.value = privateNet?.id ? [privateNet.id] : []
    }
  }
)

watch(launchBootSource, () => {
  launchSelectedImage.value = ''
  if (selectableBootSources.value.length > 0) {
    launchSelectedImage.value = selectableBootSources.value[0]?.id || ''
  }
})

watch(
  () => computeStore.availabilityZones,
  (zones) => {
    if (zones && zones.length > 0 && (!launchAz.value || launchAz.value === 'nova')) {
      launchAz.value = zones[0] || 'nova'
    }
  },
  { immediate: true }
)

// Load security groups on mount
onMounted(async () => {
  try {
    const sgs = await networkService.getSecurityGroups()
    securityGroupsList.value = sgs
    if (sgs.length > 0) {
      launchSelectedSecurityGroups.value = [sgs[0].name]
    }
  } catch (e) {
    console.warn('Failed to load security groups:', e)
    securityGroupsList.value = [{ name: 'default', description: 'Default Security Group' }]
    launchSelectedSecurityGroups.value = ['default']
  }
})
</script>
