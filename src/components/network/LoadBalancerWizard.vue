<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
      <!-- Title bar -->
      <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <ShieldIcon class="text-blue-500" :size="20" /> Create Load Balancer Wizard
        </h2>
        <span class="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded font-mono">
          Step {{ createStep }} of 5
        </span>
      </div>

      <div class="flex-1 flex overflow-hidden min-h-0">
        <!-- Left side: Form Step controls (58%) -->
        <div class="w-7/12 p-6 overflow-y-auto border-r border-zinc-855/60 space-y-5 text-left">
          <!-- Step Indicators -->
          <div class="flex items-center gap-2 select-none pb-2">
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 1 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 2 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 3 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 4 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
            <div class="flex-1 h-1.5 rounded-full transition-all duration-300" :class="createStep >= 5 ? 'bg-blue-600' : 'bg-zinc-800'"></div>
          </div>

          <!-- STEP 1: Load Balancer Info -->
          <div v-if="createStep === 1" class="space-y-4 animate-in fade-in duration-200">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Load Balancer Name</label>
              <input
                v-model="createForm.name"
                required
                placeholder="e.g. web-traffic-lb"
                class="form-input"
              />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Description</label>
              <textarea
                v-model="createForm.description"
                rows="2"
                placeholder="Enter description explaining this service distribution..."
                class="form-input"
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">VIP Subnet</label>
                <select
                  v-model="createForm.vipSubnetId"
                  required
                  class="form-input"
                >
                  <option value="" disabled>Select VIP Network Subnet...</option>
                  <option
                    v-for="net in networks"
                    :key="net.id"
                    :value="net.subnetId || ''"
                  >
                    {{ net.name }} ({{ net.subnet || 'no CIDR' }})
                  </option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">VIP IP Address (Optional)</label>
                <input
                  v-model="createForm.vipAddress"
                  placeholder="e.g. 10.0.0.45 (or auto-assign)"
                  class="form-input"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Provider Driver</label>
                <select
                  v-model="createForm.provider"
                  class="form-input font-semibold"
                >
                  <option value="amphora">Amphora (HA Octavia Driver)</option>
                  <option value="ovn">OVN Driver (Lightweight SDN)</option>
                </select>
              </div>

              <div class="flex items-center gap-2 pt-6">
                <input type="checkbox" v-model="createForm.adminStateUp" id="wizAdminStateUp" class="accent-blue-500 h-4 w-4" />
                <label for="wizAdminStateUp" class="text-xs font-bold text-zinc-300 uppercase cursor-pointer select-none">
                  Admin State UP
                </label>
              </div>
            </div>
          </div>

          <!-- STEP 2: Protocol Listener -->
          <div v-if="createStep === 2" class="space-y-4 animate-in fade-in duration-200">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Protocol Listener Configuration</h3>
              <span class="text-[10px] text-zinc-500 font-semibold italic">Can skip by leaving values default / optional</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Listener Name</label>
              <input
                v-model="createForm.listenerName"
                placeholder="e.g. http-port-80"
                class="form-input"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Protocol</label>
                <select
                  v-model="createForm.listenerProtocol"
                  class="form-input"
                >
                  <option value="HTTP">HTTP (Proxy Port)</option>
                  <option value="HTTPS">HTTPS (SSL Pass-through)</option>
                  <option value="TERMINATED_HTTPS">TERMINATED_HTTPS (SSL Offload)</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Protocol Port</label>
                <input
                  type="number"
                  v-model.number="createForm.listenerPort"
                  placeholder="e.g. 80"
                  class="form-input"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Max Connections (Connection Limit)</label>
              <input
                type="number"
                v-model.number="createForm.listenerConnectionLimit"
                placeholder="-1 for unlimited"
                class="form-input"
              />
              <span class="text-[10px] text-zinc-500">Defines the maximum number of simultaneous active connections allowed on this listener. Set to -1 for unlimited.</span>
            </div>
          </div>

          <!-- STEP 3: Backend Member Pool -->
          <div v-if="createStep === 3" class="space-y-4 animate-in fade-in duration-200">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Backend Member Pool Configuration</h3>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Pool Name</label>
              <input
                v-model="createForm.poolName"
                placeholder="e.g. application-servers-pool"
                class="form-input"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Pool Protocol</label>
                <select
                  v-model="createForm.poolProtocol"
                  class="form-input"
                >
                  <option value="HTTP">HTTP</option>
                  <option value="HTTPS">HTTPS</option>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold text-zinc-400 uppercase">Load Balancing Algorithm</label>
                <select
                  v-model="createForm.poolAlgorithm"
                  class="form-input"
                >
                  <option value="ROUND_ROBIN">ROUND_ROBIN (Standard Alternating)</option>
                  <option value="LEAST_CONNECTIONS">LEAST_CONNECTIONS (Optimal Load)</option>
                  <option value="SOURCE_IP">SOURCE_IP (Sticky Session)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- STEP 4: Pool Members -->
          <div v-if="createStep === 4" class="space-y-4 animate-in fade-in duration-200">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider">Configure Pool Members</h3>
            <p class="text-xs text-zinc-400">Select running VM instances as backend servers, or manually add custom IP members.</p>

            <!-- Instance Selector Table (Available Members) -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-zinc-400 uppercase">Available Compute Instances</label>
              <div class="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-955/30 max-h-40 overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-zinc-800 text-zinc-400 font-bold uppercase bg-zinc-900/50">
                      <th class="p-2">Name</th>
                      <th class="p-2">IP Address</th>
                      <th class="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-850">
                    <tr v-if="instances.length === 0">
                      <td colspan="3" class="p-4 text-center text-zinc-500 italic">No compute instances found</td>
                    </tr>
                    <tr v-for="inst in instances" :key="inst.id" class="hover:bg-zinc-900/20">
                      <td class="p-2 font-semibold text-white truncate max-w-[120px]">{{ inst.name }}</td>
                      <td class="p-2 font-mono text-zinc-400">{{ inst.ip || 'no private IP' }}</td>
                      <td class="p-2 text-right">
                        <button
                          type="button"
                          @click="addInstanceToWizard(inst)"
                          :disabled="isAlreadyAdded(inst.ip)"
                          class="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-[10px] font-semibold text-white transition-colors cursor-pointer border-0"
                        >
                          {{ isAlreadyAdded(inst.ip) ? 'Added' : '+ Add' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Custom IP Add Option -->
            <div class="flex items-center justify-between gap-3 pt-1">
              <span class="text-[10px] text-zinc-500 italic">Instance missing? Add a manual IP server.</span>
              <button type="button" @click="addManualWizardMember" class="px-2 py-1 border border-zinc-800 rounded text-[10px] text-zinc-300 hover:bg-zinc-800 transition-colors bg-transparent cursor-pointer">
                + Add Manual IP Member
              </button>
            </div>

            <!-- Selected Members Config -->
            <div class="space-y-2">
              <label class="text-xs font-bold text-zinc-400 uppercase">Selected Members ({{ createForm.members.length }})</label>
              <div class="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-955/30 max-h-44 overflow-y-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-zinc-800 text-zinc-400 font-bold uppercase bg-zinc-900/50">
                      <th class="p-2">Name / IP</th>
                      <th class="p-2 w-20">Port</th>
                      <th class="p-2 w-16">Weight</th>
                      <th class="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-850">
                    <tr v-if="createForm.members.length === 0">
                      <td colspan="4" class="p-4 text-center text-zinc-500 italic">No members selected yet. Add servers from the table above.</td>
                    </tr>
                    <tr v-for="(m, idx) in createForm.members" :key="idx" class="hover:bg-zinc-900/20">
                      <td class="p-2 font-semibold">
                        <div class="text-white truncate max-w-[130px]">{{ m.instanceName || 'Manual IP' }}</div>
                        <div class="text-[10px] font-mono text-zinc-500">{{ m.address }}</div>
                      </td>
                      <td class="p-2">
                        <input type="number" v-model.number="m.protocolPort" min="1" max="65535" required class="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-1 text-center font-mono text-xs focus:border-blue-500 outline-none" />
                      </td>
                      <td class="p-2">
                        <input type="number" v-model.number="m.weight" min="1" required class="w-full bg-zinc-900 border border-zinc-800 text-white rounded p-1 text-center font-mono text-xs focus:border-blue-500 outline-none" />
                      </td>
                      <td class="p-2 text-right">
                        <button type="button" @click="createForm.members.splice(idx, 1)" class="p-1 hover:bg-rose-955/40 border-0 text-rose-455 rounded transition-all cursor-pointer bg-transparent">
                          Remove
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- STEP 5: Health Monitor -->
          <div v-if="createStep === 5" class="space-y-4 animate-in fade-in duration-200">
            <div class="flex justify-between items-center">
              <h3 class="text-sm font-bold text-white uppercase tracking-wider">Health Monitor Configuration</h3>
              <label class="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                <input type="checkbox" v-model="enableHealthMonitor" class="accent-blue-500 h-4 w-4" />
                Enable Monitor
              </label>
            </div>

            <div v-if="enableHealthMonitor" class="space-y-4 animate-in slide-in-from-top-2 duration-150">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">Monitor Type</label>
                  <select
                    v-model="createForm.monitorType"
                    class="form-input"
                  >
                    <option value="HTTP">HTTP URL check</option>
                    <option value="HTTPS">HTTPS secure check</option>
                    <option value="PING">ICMP Ping check</option>
                    <option value="TCP">TCP port probe</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">Delay Interval (Seconds)</label>
                  <input
                    type="number"
                    v-model.number="createForm.monitorDelay"
                    placeholder="e.g. 5"
                    class="form-input"
                  />
                </div>
              </div>

              <!-- HTTP/HTTPS Specific parameters -->
              <div v-if="createForm.monitorType === 'HTTP' || createForm.monitorType === 'HTTPS'" class="p-4 bg-zinc-955/40 border border-zinc-800/80 rounded-lg grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-150">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">HTTP Method</label>
                  <select v-model="createForm.monitorHttpMethod" class="form-input">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="HEAD">HEAD</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">URL Path</label>
                  <input v-model="createForm.monitorUrlPath" placeholder="e.g. /healthz" class="form-input" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">Expected Status Codes</label>
                  <input v-model="createForm.monitorExpectedCodes" placeholder="e.g. 200,202" class="form-input" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">Connection Timeout (Seconds)</label>
                  <input
                    type="number"
                    v-model.number="createForm.monitorTimeout"
                    placeholder="e.g. 5"
                    class="form-input"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-zinc-400 uppercase">Max Retries Failure Limit</label>
                  <input
                    type="number"
                    v-model.number="createForm.monitorMaxRetries"
                    placeholder="e.g. 3"
                    class="form-input"
                  />
                </div>
              </div>
            </div>
            <div v-else class="p-8 text-center text-zinc-555 border border-dashed border-zinc-800 rounded-xl">
              Health monitoring is disabled. Backend members will not be automatically marked offline in case of failure.
            </div>

            <!-- Error Alert -->
            <div v-if="error" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
              <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
              <span class="break-words">{{ error }}</span>
            </div>
          </div>
        </div>

        <!-- Right side: Realtime Logical Preview Diagram (42%) -->
        <div class="w-5/12 p-6 bg-zinc-955/40 flex flex-col justify-center items-center space-y-6 select-none animate-in fade-in duration-300">
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-500 text-center">
            Real-time LB Preview
          </h3>

          <!-- Topology Stack Preview -->
          <div class="w-full flex flex-col items-center space-y-3.5">
            <!-- Load Balancer Node -->
            <div
              class="w-48 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="createForm.name.trim() ? 'bg-blue-600/10 border-blue-500 shadow-md shadow-blue-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <ShieldIcon :size="20" class="transition-colors" :class="createForm.name.trim() ? 'text-blue-400' : 'text-zinc-655'" />
              <span class="text-xs font-bold mt-1.5 truncate max-w-full">
                {{ createForm.name.trim() ? createForm.name : 'New Load Balancer' }}
              </span>
              <span class="text-[9px] font-mono mt-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-855/65" :class="createForm.vipSubnetId ? 'text-blue-300 border-blue-500/20' : 'text-zinc-600 border-transparent'">
                Subnet: {{ selectedSubnetCidr || 'Select subnet...' }}
              </span>
            </div>

            <!-- Connection Arrow 1 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="createStep >= 2 ? 'border-purple-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Listener Node -->
            <div
              class="w-48 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="createStep >= 2 ? 'bg-purple-600/10 border-purple-500 shadow-md shadow-purple-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <ShuffleIcon :size="20" class="transition-colors" :class="createStep >= 2 ? 'text-purple-400' : 'text-zinc-655'" />
              <span class="text-xs font-bold mt-1.5 truncate max-w-full">
                {{ createForm.listenerName.trim() ? createForm.listenerName : 'Default Listener' }}
              </span>
              <span class="text-[9px] font-mono mt-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-855/65" :class="createStep >= 2 ? 'text-purple-300 border-purple-500/20' : 'text-zinc-600 border-transparent'">
                {{ createForm.listenerProtocol }}:{{ createForm.listenerPort || 'Port' }}
              </span>
            </div>

            <!-- Connection Arrow 2 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="createStep >= 3 ? 'border-amber-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Pool Node -->
            <div
              class="w-48 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="createStep >= 3 ? 'bg-amber-600/10 border-amber-500 shadow-md shadow-amber-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <LayersIcon :size="20" class="transition-colors" :class="createStep >= 3 ? 'text-amber-400' : 'text-zinc-655'" />
              <span class="text-xs font-bold mt-1.5 truncate max-w-full">
                {{ createForm.poolName.trim() ? createForm.poolName : 'Backend Pool' }}
              </span>
              <span class="text-[9px] font-mono mt-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-855/65" :class="createStep >= 3 ? 'text-amber-300 border-amber-500/20' : 'text-zinc-600 border-transparent'">
                {{ createForm.poolAlgorithm }}
              </span>

              <!-- Wizard Members Preview inside pool card -->
              <div v-if="createStep >= 4 && createForm.members.length > 0" class="mt-2 pt-2 border-t border-amber-500/10 w-full text-left space-y-1 text-[9px] text-zinc-405">
                <div v-for="(m, idx) in createForm.members.slice(0, 3)" :key="idx" class="truncate flex justify-between gap-1">
                  <span>• {{ m.instanceName || m.address }}</span>
                  <span class="font-mono text-amber-300">:{{ m.protocolPort }}</span>
                </div>
                <div v-if="createForm.members.length > 3" class="text-center text-[8px] text-zinc-500 italic">
                  + {{ createForm.members.length - 3 }} more servers
                </div>
              </div>
            </div>

            <!-- Connection Arrow 3 -->
            <div
              class="h-6 w-0.5 border-l-2 border-dashed transition-colors duration-300"
              :class="createStep >= 5 && enableHealthMonitor ? 'border-emerald-500/60' : 'border-zinc-800'"
            ></div>

            <!-- Health Monitor Node -->
            <div
              class="w-48 p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 text-center"
              :class="createStep >= 5 && enableHealthMonitor ? 'bg-emerald-600/10 border-emerald-500 shadow-md shadow-emerald-500/10 text-white' : 'bg-zinc-950/30 border-zinc-850 text-zinc-650'"
            >
              <HeartIcon :size="20" class="transition-colors" :class="createStep >= 5 && enableHealthMonitor ? 'text-emerald-400' : 'text-zinc-655'" />
              <span class="text-xs font-bold mt-1.5 truncate max-w-full">
                Health Monitor
              </span>
              <span class="text-[9px] font-mono mt-1 px-2 py-0.5 rounded bg-zinc-950 border border-zinc-855/65" :class="createStep >= 5 && enableHealthMonitor ? 'text-emerald-300 border-emerald-500/20' : 'text-zinc-600 border-transparent'">
                {{ enableHealthMonitor ? `${createForm.monitorType} (${createForm.monitorDelay}s)` : 'Disabled' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Wizard buttons -->
      <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-between gap-3">
        <button
          v-if="createStep > 1"
          @click="createStep--"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-300 hover:text-white transition-colors cursor-pointer bg-transparent"
        >
          Back
        </button>
        <button
          v-else
          @click="emit('close')"
          class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer bg-transparent"
        >
          Cancel
        </button>

        <button
          v-if="createStep < 5"
          @click="nextWizardStep"
          :disabled="isNextDisabled"
          class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer border-0"
        >
          Next Step
        </button>
        <button
          v-else
          @click="handleSubmit"
          :disabled="loading"
          class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer flex items-center gap-2 border-0"
        >
          <LoaderIcon v-if="loading" class="animate-spin" :size="14" />
          <span>Create Configuration</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Shield as ShieldIcon,
  Shuffle as ShuffleIcon,
  Layers as LayersIcon,
  Heart as HeartIcon,
  Loader as LoaderIcon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-vue-next'
import type { NetworkConfig } from '@/services/network.service'

const props = defineProps<{
  show: boolean
  loading: boolean
  error: string
  networks: NetworkConfig[]
  instances: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: any): void
}>()

const createStep = ref(1)
const enableHealthMonitor = ref(true)

const createForm = ref({
  name: '',
  description: '',
  vipSubnetId: '',
  vipAddress: '',
  provider: 'amphora',
  adminStateUp: true,

  // Listener Step
  listenerName: '',
  listenerProtocol: 'HTTP',
  listenerPort: 80,
  listenerConnectionLimit: -1,

  // Pool Step
  poolName: '',
  poolProtocol: 'HTTP',
  poolAlgorithm: 'ROUND_ROBIN',

  // Members Step
  members: [] as { address: string; protocolPort: number; weight: number; subnetId: string; instanceName?: string }[],

  // Health Monitor Step
  monitorType: 'HTTP',
  monitorDelay: 5,
  monitorTimeout: 5,
  monitorMaxRetries: 3,
  monitorHttpMethod: 'GET',
  monitorUrlPath: '/',
  monitorExpectedCodes: '200',
})

// Sync form details automatically
watch(() => createForm.value.name, (val) => {
  if (val && typeof val === 'string' && val.trim()) {
    createForm.value.listenerName = `${val.trim()}-listener`
    createForm.value.poolName = `${val.trim()}-pool`
  }
})

watch(() => createForm.value.listenerProtocol, (val) => {
  if (val === 'TERMINATED_HTTPS' || val === 'HTTPS') {
    createForm.value.poolProtocol = 'HTTP'
    createForm.value.listenerPort = 443
  } else {
    createForm.value.poolProtocol = val
    if (val === 'HTTP') createForm.value.listenerPort = 80
  }
})

watch(() => props.show, (isOpen) => {
  if (isOpen) {
    createStep.value = 1
    enableHealthMonitor.value = true
    createForm.value = {
      name: '',
      description: '',
      vipSubnetId: '',
      vipAddress: '',
      provider: 'amphora',
      adminStateUp: true,
      listenerName: '',
      listenerProtocol: 'HTTP',
      listenerPort: 80,
      listenerConnectionLimit: -1,
      poolName: '',
      poolProtocol: 'HTTP',
      poolAlgorithm: 'ROUND_ROBIN',
      members: [],
      monitorType: 'HTTP',
      monitorDelay: 5,
      monitorTimeout: 5,
      monitorMaxRetries: 3,
      monitorHttpMethod: 'GET',
      monitorUrlPath: '/',
      monitorExpectedCodes: '200',
    }
    // Default to first subnet
    const valid = props.networks.find((n) => n.subnetId)
    if (valid) {
      createForm.value.vipSubnetId = valid.subnetId || ''
    }
  }
})

const selectedSubnetCidr = computed(() => {
  if (!createForm.value.vipSubnetId) return ''
  const net = props.networks.find((n) => n.subnetId === createForm.value.vipSubnetId)
  return net ? net.subnet : ''
})

const isNextDisabled = computed(() => {
  if (createStep.value === 1) {
    return !createForm.value.name.trim() || !createForm.value.vipSubnetId
  }
  if (createStep.value === 2) {
    return !createForm.value.listenerProtocol || !createForm.value.listenerPort
  }
  if (createStep.value === 3) {
    return !createForm.value.poolProtocol || !createForm.value.poolAlgorithm
  }
  return false
})

function nextWizardStep() {
  if (createStep.value < 5) {
    createStep.value++
  }
}

function isAlreadyAdded(ip: string) {
  if (!ip) return false
  return createForm.value.members.some((m) => m.address === ip)
}

function addInstanceToWizard(inst: any) {
  if (!inst.ip) return
  if (isAlreadyAdded(inst.ip)) return
  createForm.value.members.push({
    address: inst.ip,
    protocolPort: createForm.value.listenerPort || 80,
    weight: 1,
    subnetId: createForm.value.vipSubnetId,
    instanceName: inst.name,
  })
}

function addManualWizardMember() {
  const ip = prompt('Enter backend server IP address:')
  if (!ip) return
  const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/
  if (!ipRegex.test(ip.trim())) {
    alert('Please enter a valid IP address.')
    return
  }
  createForm.value.members.push({
    address: ip.trim(),
    protocolPort: createForm.value.listenerPort || 80,
    weight: 1,
    subnetId: createForm.value.vipSubnetId,
    instanceName: 'Manual IP member',
  })
}

function handleSubmit() {
  const payload: any = {
    name: createForm.value.name.trim(),
    description: createForm.value.description.trim(),
    vipSubnetId: createForm.value.vipSubnetId,
    vipAddress: createForm.value.vipAddress.trim() || undefined,
    provider: createForm.value.provider,
    adminStateUp: createForm.value.adminStateUp,

    listenerName: createForm.value.listenerName.trim() || undefined,
    listenerProtocol: createForm.value.listenerProtocol || undefined,
    listenerPort: createForm.value.listenerPort || undefined,
    listenerConnectionLimit: createForm.value.listenerConnectionLimit && createForm.value.listenerConnectionLimit > 0 ? createForm.value.listenerConnectionLimit : undefined,

    poolName: createForm.value.poolName.trim() || undefined,
    poolProtocol: createForm.value.poolProtocol || undefined,
    poolAlgorithm: createForm.value.poolAlgorithm || undefined,

    members: createForm.value.members.length > 0 ? createForm.value.members : undefined,
  }

  if (enableHealthMonitor.value && createForm.value.monitorType) {
    payload.monitorType = createForm.value.monitorType
    payload.monitorDelay = createForm.value.monitorDelay
    payload.monitorTimeout = createForm.value.monitorTimeout
    payload.monitorMaxRetries = createForm.value.monitorMaxRetries
    if (createForm.value.monitorType === 'HTTP' || createForm.value.monitorType === 'HTTPS') {
      payload.monitorHttpMethod = createForm.value.monitorHttpMethod
      payload.monitorUrlPath = createForm.value.monitorUrlPath
      payload.monitorExpectedCodes = createForm.value.monitorExpectedCodes
    }
  }

  emit('submit', payload)
}
</script>
