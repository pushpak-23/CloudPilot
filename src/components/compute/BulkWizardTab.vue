<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Wizard Config Panel (Left) -->
    <div class="lg:col-span-1 bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
      <h2 class="font-bold text-lg text-white border-b border-zinc-800 pb-3">OpenTofu Bulk Wizard</h2>
      
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Instance Base Name</label>
          <input
            v-model="wizardBaseName"
            placeholder="e.g., node-vm"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Deploy Count</label>
          <input
            type="number"
            v-model.number="wizardCount"
            min="1"
            max="200"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Flavor</label>
            <select
              v-model="wizardFlavor"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="f in computeStore.flavors" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </div>
          <div class="space-y-1">
            <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">OS Image</label>
            <select
              v-model="wizardImage"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option v-for="img in computeStore.images" :key="img.name" :value="img.name">{{ img.name }}</option>
            </select>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SSH Keypair</label>
          <select
            v-model="wizardKeypair"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option v-for="k in computeStore.keypairs" :key="k.name" :value="k.name">{{ k.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="space-y-1">
            <label class="text-[9px] font-bold text-zinc-500 uppercase">Boot (GB)</label>
            <input type="number" v-model.number="wizardBootGb" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white" />
          </div>
          <div class="space-y-1">
            <label class="text-[9px] font-bold text-zinc-500 uppercase">Data (GB)</label>
            <input type="number" v-model.number="wizardDataGb" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white" />
          </div>
          <div class="space-y-1">
            <label class="text-[9px] font-bold text-zinc-500 uppercase">Logs (GB)</label>
            <input type="number" v-model.number="wizardLogsGb" class="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white" />
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cloud-Init Configuration Script</label>
          <textarea
            v-model="wizardCloudInit"
            rows="4"
            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          ></textarea>
        </div>
      </div>

      <button
        @click="submitBulkLaunch"
        :disabled="computeStore.bulkDeploying || !wizardBaseName.trim()"
        class="w-full disabled:opacity-50 text-white py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors mt-4 cursor-pointer"
        :style="{ backgroundColor: 'var(--accent)', boxShadow: 'var(--accent-shadow)' }"
      >
        {{ computeStore.bulkDeploying ? 'Deploying...' : 'Deploy OpenTofu Infrastructure' }}
      </button>
    </div>

    <!-- Code generation & terminal consoles (Right) -->
    <div class="lg:col-span-2 flex flex-col gap-6">
      <!-- OpenTofu Code display -->
      <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 flex-1 flex flex-col">
        <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
          <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText :size="12" /> Generated OpenTofu Config (main.tf)
          </span>
          <div class="flex items-center gap-2">
            <button
              @click="copyCode"
              class="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] rounded transition-all cursor-pointer font-semibold flex items-center gap-1"
            >
              <component :is="copied ? Check : Copy" :size="10" :class="copied ? 'text-emerald-400' : ''" />
              <span>{{ copied ? 'Copied' : 'Copy' }}</span>
            </button>
            <button
              @click="downloadCode"
              class="px-2 py-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-[10px] rounded transition-all cursor-pointer font-semibold flex items-center gap-1"
            >
              <Download :size="10" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <pre class="flex-1 font-mono text-[11px] text-emerald-500 bg-zinc-950/40 rounded-lg p-4 border border-zinc-850 overflow-auto select-all max-h-72">
{{ generatedOpenTofuCode }}
        </pre>
      </div>

      <!-- Terminal scrolling logs console -->
      <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 h-64 flex flex-col relative overflow-hidden">
        <!-- Top progress line indicator -->
        <div
          v-if="computeStore.bulkDeploying"
          class="absolute top-0 left-0 h-1 transition-all duration-300"
          :style="{ width: `${computeStore.bulkDeployProgress}%`, backgroundColor: 'var(--accent)' }"
        ></div>

        <div class="flex items-center justify-between border-b border-zinc-800/80 pb-2 mb-3">
          <span class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal :size="12" /> Infrastructure Log output
            <span v-if="computeStore.bulkDeploying" class="text-[10px] text-zinc-500 font-semibold lowercase">
              ({{ computeStore.bulkDeployProgress }}% completed)
            </span>
          </span>
          <span v-if="computeStore.bulkDeploying" class="w-1.5 h-1.5 rounded-full animate-ping bg-blue-500"></span>
        </div>
        <div class="flex-1 bg-zinc-955/60 rounded-lg p-4 font-mono text-[10px] text-zinc-300 border border-zinc-850 overflow-y-auto space-y-1.5">
          <div v-for="(log, idx) in computeStore.bulkDeployLogs" :key="idx">
            {{ log }}
          </div>
          <div v-if="computeStore.bulkDeployLogs.length === 0" class="text-zinc-650 italic">
            Launch Wizard terminal idle. Apply a deployment plan to output execution logs.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Terminal, Copy, Download, Check } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'

const computeStore = useComputeStore()
const copied = ref(false)

function copyCode() {
  navigator.clipboard.writeText(generatedOpenTofuCode.value)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function downloadCode() {
  const blob = new Blob([generatedOpenTofuCode.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'main.tf'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const wizardBaseName = ref('node-vm')
const wizardCount = ref(10)
const wizardFlavor = ref('m1.xlarge')
const wizardImage = ref('Ubuntu 22.04 LTS')
const wizardKeypair = ref('ops-admin-ssh')
const wizardBootGb = ref(100)
const wizardDataGb = ref(500)
const wizardLogsGb = ref(2048)
const wizardCloudInit = ref(`#/bin/bash
# Enable passwordless root authentication
sed -i 's/#PermitRootLogin.*/PermitRootLogin yes/g' /etc/ssh/sshd_config
service ssh restart
echo "CloudPilot bulk initialized."`)

const generatedOpenTofuCode = computed(() => {
  return `# CloudPilot Dynamic OpenTofu Provisioning Script
# Autoscaled for Count: ${wizardCount.value} Instances

provider "openstack" {
  auth_url    = "https://identity.cloudpilot.internal:5000/v3"
  tenant_name = "Production-Env"
}

resource "openstack_compute_instance_v2" "cp_instances" {
  count           = ${wizardCount.value}
  name            = "${wizardBaseName.value}-\${count.index + 1}"
  image_name      = "${wizardImage.value}"
  flavor_name     = "${wizardFlavor.value}"
  key_pair        = "${wizardKeypair.value}"
  security_groups = ["default"]

  block_device {
    uuid                  = "uuid-cinder-boot"
    source_type           = "image"
    volume_size           = ${wizardBootGb.value}
    destination_type      = "volume"
    boot_index            = 0
    delete_on_termination = true
  }

  block_device {
    uuid                  = "uuid-cinder-data"
    source_type           = "blank"
    volume_size           = ${wizardDataGb.value}
    destination_type      = "volume"
    boot_index            = -1
    delete_on_termination = true
  }

  user_data = <<EOF
${wizardCloudInit.value}
EOF

  network {
    name = "internal-net"
  }
}`
})

function submitBulkLaunch() {
  if (wizardBaseName.value.trim() && wizardCount.value > 0) {
    computeStore.deployBulk({
      baseName: wizardBaseName.value.trim(),
      count: wizardCount.value,
      flavor: wizardFlavor.value,
      image: wizardImage.value,
      bootSize: wizardBootGb.value,
      dataSize: wizardDataGb.value,
      logsSize: wizardLogsGb.value,
      network: 'internal-net',
      securityGroup: 'default',
      cloudInit: wizardCloudInit.value
    })
  }
}
</script>
