<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <ShieldIcon :style="{ color: 'var(--accent)' }" :size="32" /> Load Balancer Control Plane
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Manage tenant load balancers, listeners, and backend member pools. Scale your infrastructure dynamically with high availability.
        </p>
      </div>

      <div class="flex flex-wrap gap-2.5">
        <button
          @click="openCreateModal"
          class="btn-primary"
        >
          <PlusIcon :size="16" /> Create Load Balancer
        </button>
        <button
          @click="refreshAll(true)"
          class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-200 font-semibold px-4.5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm cursor-pointer active:scale-95"
        >
          <RefreshIcon :size="16" :class="{ 'animate-spin': loadStore.loading }" /> Refresh
        </button>
      </div>
    </div>

    <!-- Quick Stats Panel -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Total LBs -->
      <div class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/3 flex flex-col justify-between h-36">
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Total Load Balancers</span>
          <ShieldIcon class="text-zinc-500 group-hover:text-blue-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-blue-400 transition-colors">
            {{ loadStore.loadbalancers.length }}
          </div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Octavia load balancing instances
          </div>
        </div>
      </div>

      <!-- Active LBs -->
      <div class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/3 flex flex-col justify-between h-36">
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Active Instances</span>
          <ActivityIcon class="text-zinc-500 group-hover:text-emerald-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
            {{ activeCount }}
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-450 animate-ping opacity-75 inline-block"></span>
          </div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Running in healthy status
          </div>
        </div>
      </div>

      <!-- Total Listeners -->
      <div class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/3 flex flex-col justify-between h-36">
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Protocol Listeners</span>
          <ShuffleIcon class="text-zinc-500 group-hover:text-purple-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-purple-400 transition-colors">
            {{ loadStore.listeners.length }}
          </div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Octavia listeners configured
          </div>
        </div>
      </div>

      <!-- Pools -->
      <div class="group bg-zinc-900/60 border border-zinc-800/80 hover:border-blue-500/30 rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/3 flex flex-col justify-between h-36">
        <div class="flex justify-between items-start">
          <span class="text-sm font-semibold text-zinc-400 group-hover:text-zinc-300">Backend Pools</span>
          <LayersIcon class="text-zinc-500 group-hover:text-amber-500 transition-colors" :size="20" />
        </div>
        <div class="mt-4">
          <div class="text-4xl font-black text-white group-hover:text-amber-400 transition-colors">
            {{ loadStore.pools.length }}
          </div>
          <div class="text-[11px] text-zinc-500 mt-1">
            Member groupings configured
          </div>
        </div>
      </div>
    </div>

    <!-- Main Workspace Section -->
    <div class="w-full animate-in fade-in duration-300">
      <!-- Load Balancers List -->
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
        <!-- Table Header / Filter -->
        <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-955/20">
          <h2 class="font-semibold text-lg text-white">Load Balancers</h2>
          <input
            v-model="searchQuery"
            placeholder="Filter by name or VIP..."
            class="form-input sm:w-64"
          />
        </div>

        <!-- Table Container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider bg-zinc-900/80 select-none">
                <th class="p-4">Name</th>
                <th class="p-4">VIP Address</th>
                <th class="p-4">Provider</th>
                <th class="p-4">Provisioning Status</th>
                <th class="p-4">Operating Status</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-850 text-sm">
              <!-- Loading State -->
              <tr v-if="loadStore.loading && loadStore.loadbalancers.length === 0">
                <td colspan="6" class="p-8 text-center text-zinc-500">
                  <LoaderIcon class="animate-spin inline-block mr-2" :size="16" /> Loading load balancing services...
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-else-if="filteredLBs.length === 0">
                <td colspan="6" class="p-8 text-center text-zinc-500">
                  No load balancers found. Click "Create Load Balancer" to launch a new instance.
                </td>
              </tr>
              <!-- Data Rows -->
              <tr
                v-for="lb in filteredLBs"
                :key="lb.id"
                @click="selectedLb = lb"
                class="even:bg-zinc-900/20 odd:bg-zinc-900/10 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                :class="selectedLb?.id === lb.id ? 'bg-blue-955/20 border-l-2 border-blue-500 bg-blue-500/5' : ''"
              >
                <td class="p-4 font-semibold text-white">
                  <button class="text-left text-blue-400 hover:text-blue-300 outline-none font-bold">
                    {{ lb.name }}
                  </button>
                  <div class="text-[10px] text-zinc-500 font-mono mt-0.5 truncate max-w-[180px]">{{ lb.id }}</div>
                </td>
                <td class="p-4 font-mono text-zinc-300">{{ lb.vipAddress || '-' }}</td>
                <td class="p-4 text-xs font-semibold text-zinc-400 uppercase">{{ lb.provider }}</td>
                <td class="p-4">
                  <span
                    class="px-2.5 py-0.5 rounded border text-xs font-semibold uppercase tracking-wider inline-block"
                    :class="provisioningStatusClass(lb.provisioningStatus)"
                  >
                    {{ lb.provisioningStatus }}
                  </span>
                </td>
                <td class="p-4">
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="w-1.5 h-1.5 rounded-full" :class="operatingStatusColor(lb.operatingStatus)"></span>
                    <span class="font-semibold text-zinc-300 uppercase">{{ lb.operatingStatus }}</span>
                  </div>
                </td>
                <td class="p-4 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <button @click="openEditModal(lb)" class="btn-table">
                      Edit
                    </button>
                    <button @click="confirmDelete(lb)" class="btn-table-danger">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Sliding Properties Inspector Drawer -->
    <LoadBalancerInspector
      :selected-lb="selectedLb"
      :listeners="lbListeners"
      :pools="lbPools"
      :members-by-pool="loadStore.membersByPool"
      :stats="selectedLb ? (loadStore.statsByLb[selectedLb.id] || null) : null"
      @close="selectedLb = null"
      @add-listener="openAddListenerModal"
      @add-pool="openAddPoolModal"
      @add-monitor="openAddMonitorModal"
      @add-member="openAddMemberModal"
      @delete-member="handleDeleteMember"
      @failover="handleFailover"
    />

    <!-- Modal: Create Load Balancer Wizard with Real-time visualizer -->
    <LoadBalancerWizard
      :show="showCreateModal"
      :loading="actionLoading"
      :error="actionError"
      :networks="networkStore.networks"
      :instances="computeStore.instances"
      @close="showCreateModal = false"
      @submit="handleCreate"
    />

    <!-- Modal: Edit Load Balancer -->
    <LoadBalancerEditModal
      :show="showEditModal"
      :lb="selectedLb"
      :loading="actionLoading"
      :error="actionError"
      @close="showEditModal = false"
      @submit="handleEditSubmit"
    />

    <!-- Modal: Add Listener dynamically to existing LB -->
    <div v-if="showAddListenerModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="showAddListenerModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <ShuffleIcon class="text-purple-500" :size="20" /> Add Listener to {{ selectedLb?.name }}
          </h2>
          <button @click="showAddListenerModal = false" class="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl outline-none">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddListener" class="p-6 space-y-4 text-left">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Listener Name</label>
            <input v-model="listenerForm.name" required placeholder="e.g. web-port-80" class="form-input" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Protocol</label>
              <select v-model="listenerForm.protocol" class="form-input">
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="TERMINATED_HTTPS">TERMINATED_HTTPS</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Port</label>
              <input type="number" v-model.number="listenerForm.protocolPort" required class="form-input" />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Max Connections (Connection Limit)</label>
            <input type="number" v-model.number="listenerForm.connectionLimit" placeholder="-1 for unlimited" class="form-input" />
            <span class="text-[10px] text-zinc-500">Defines the maximum number of simultaneous active connections. Set to -1 for unlimited.</span>
          </div>

          <div v-if="actionError" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
            <span class="break-words">{{ actionError }}</span>
          </div>
        </form>

        <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
          <button type="button" @click="showAddListenerModal = false" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" @click="handleAddListener" :disabled="actionLoading" class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
            <LoaderIcon v-if="actionLoading" class="animate-spin" :size="14" />
            <span>Create Listener</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add Pool dynamically to existing LB -->
    <div v-if="showAddPoolModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="showAddPoolModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <LayersIcon class="text-amber-500" :size="20" /> Add Pool to {{ selectedLb?.name }}
          </h2>
          <button @click="showAddPoolModal = false" class="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl outline-none">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddPool" class="p-6 space-y-4 text-left">
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Pool Name</label>
            <input v-model="poolForm.name" required placeholder="e.g. frontend-servers" class="form-input" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Protocol</label>
              <select v-model="poolForm.protocol" class="form-input">
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Algorithm</label>
              <select v-model="poolForm.lbAlgorithm" class="form-input">
                <option value="ROUND_ROBIN">ROUND_ROBIN</option>
                <option value="LEAST_CONNECTIONS">LEAST_CONNECTIONS</option>
                <option value="SOURCE_IP">SOURCE_IP</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Associate with Listener (Optional)</label>
            <select v-model="poolForm.listenerId" class="form-input">
              <option value="">Direct Load Balancer association</option>
              <option v-for="lis in lbListeners" :key="lis.id" :value="lis.id">
                {{ lis.name }} ({{ lis.protocol }}:{{ lis.protocolPort }})
              </option>
            </select>
          </div>

          <div v-if="actionError" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
            <span class="break-words">{{ actionError }}</span>
          </div>
        </form>

        <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
          <button type="button" @click="showAddPoolModal = false" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" @click="handleAddPool" :disabled="actionLoading" class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
            <LoaderIcon v-if="actionLoading" class="animate-spin" :size="14" />
            <span>Create Pool</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add Health Monitor dynamically to Pool -->
    <div v-if="showAddMonitorModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="showAddMonitorModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <HeartIcon class="text-emerald-500" :size="20" /> Add Health Monitor
          </h2>
          <button @click="showAddMonitorModal = false" class="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl outline-none">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddMonitor" class="p-6 space-y-4 text-left">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Monitor Type</label>
              <select v-model="monitorForm.type" class="form-input">
                <option value="HTTP">HTTP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="PING">PING</option>
                <option value="TCP">TCP</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Delay Interval</label>
              <input type="number" v-model.number="monitorForm.delay" required class="form-input" />
            </div>
          </div>

          <!-- HTTP/HTTPS Specific parameters -->
          <div v-if="monitorForm.type === 'HTTP' || monitorForm.type === 'HTTPS'" class="p-4 bg-zinc-955/40 border border-zinc-800 rounded-lg grid grid-cols-3 gap-4 animate-in slide-in-from-top-2 duration-150">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">HTTP Method</label>
              <select v-model="monitorForm.httpMethod" class="form-input">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="HEAD">HEAD</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">URL Path</label>
              <input v-model="monitorForm.urlPath" placeholder="e.g. /healthz" class="form-input" />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Expected Status Codes</label>
              <input v-model="monitorForm.expectedCodes" placeholder="e.g. 200,202" class="form-input" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Connection Timeout</label>
              <input type="number" v-model.number="monitorForm.timeout" required class="form-input" />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Max Retries</label>
              <input type="number" v-model.number="monitorForm.maxRetries" required class="form-input" />
            </div>
          </div>

          <div v-if="actionError" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
            <span class="break-words">{{ actionError }}</span>
          </div>
        </form>

        <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
          <button type="button" @click="showAddMonitorModal = false" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" @click="handleAddMonitor" :disabled="actionLoading" class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
            <LoaderIcon v-if="actionLoading" class="animate-spin" :size="14" />
            <span>Create Monitor</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Add Pool Member (Server) dynamically to Pool -->
    <div v-if="showAddMemberModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-xs" @click.self="showAddMemberModal = false">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        <div class="p-6 border-b border-zinc-855 flex items-center justify-between bg-zinc-955/20">
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <ServerIcon class="text-blue-500" :size="20" /> Add Server Member to Pool
          </h2>
          <button @click="showAddMemberModal = false" class="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl outline-none">
            &times;
          </button>
        </div>

        <form @submit.prevent="handleAddMember" class="p-6 space-y-4 text-left">
          <!-- Member Source Selection -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Server Member Source</label>
            <select v-model="memberForm.sourceType" class="form-input">
              <option value="instance">Choose from active Compute VM instances</option>
              <option value="custom">Custom IP address entry</option>
            </select>
          </div>

          <!-- VM dropdown list -->
          <div v-if="memberForm.sourceType === 'instance'" class="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
            <label class="text-xs font-bold text-zinc-400 uppercase">Compute Instance</label>
            <select v-model="memberForm.instanceId" required class="form-input">
              <option value="" disabled>Select an instance...</option>
              <option v-for="inst in computeStore.instances" :key="inst.id" :value="inst.id">
                {{ inst.name }} (IP: {{ inst.ip || 'no private IP' }})
              </option>
            </select>
          </div>

          <!-- IP Address Input -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Server IP Address</label>
            <input v-model="memberForm.address" required placeholder="e.g. 192.168.101.40" class="form-input" :disabled="memberForm.sourceType === 'instance'" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Port -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Protocol Port</label>
              <input type="number" v-model.number="memberForm.protocolPort" required placeholder="e.g. 80" class="form-input" />
            </div>

            <!-- Weight -->
            <div class="space-y-1.5">
              <label class="text-xs font-bold text-zinc-400 uppercase">Weight Priority</label>
              <input type="number" v-model.number="memberForm.weight" placeholder="1" class="form-input" />
            </div>
          </div>

          <!-- Subnet Selector -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase">Subnet Scope</label>
            <select v-model="memberForm.subnetId" required class="form-input">
              <option value="" disabled>Select Subnet...</option>
              <option v-for="net in networkStore.networks" :key="net.id" :value="net.subnetId">
                {{ net.name }} ({{ net.subnet }})
              </option>
            </select>
          </div>

          <div v-if="actionError" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertCircleIcon :size="14" class="shrink-0 mt-0.5" />
            <span class="break-words">{{ actionError }}</span>
          </div>
        </form>

        <div class="p-6 border-t border-zinc-855 bg-zinc-955/20 flex justify-end gap-3">
          <button type="button" @click="showAddMemberModal = false" class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer">
            Cancel
          </button>
          <button type="submit" @click="handleAddMember" :disabled="actionLoading" class="px-5.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer">
            <LoaderIcon v-if="actionLoading" class="animate-spin" :size="14" />
            <span>Add Server</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  Shield as ShieldIcon,
  Activity as ActivityIcon,
  Shuffle as ShuffleIcon,
  Layers as LayersIcon,
  Loader as LoaderIcon,
  Plus as PlusIcon,
  RefreshCw as RefreshIcon,
  AlertCircle as AlertCircleIcon,
  Heart as HeartIcon,
  Server as ServerIcon,
  Trash2 as TrashIcon,
} from 'lucide-vue-next'
import CopyButton from '@/components/CopyButton.vue'
import { useLoadBalancerStore } from '@/stores/loadbalancer'
import { useNetworkStore } from '@/stores/network'
import { useComputeStore } from '@/stores/compute'
import type { LoadBalancer } from '@/services/loadbalancer.service'

// Import Sub-components
import LoadBalancerWizard from '@/components/network/LoadBalancerWizard.vue'
import LoadBalancerInspector from '@/components/network/LoadBalancerInspector.vue'
import LoadBalancerEditModal from '@/components/network/LoadBalancerEditModal.vue'

const loadStore = useLoadBalancerStore()
const networkStore = useNetworkStore()
const computeStore = useComputeStore()

// State
const searchQuery = ref('')
const selectedLb = ref<LoadBalancer | null>(null)

// Modals State
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showAddListenerModal = ref(false)
const showAddPoolModal = ref(false)
const showAddMonitorModal = ref(false)
const showAddMemberModal = ref(false)

const actionLoading = ref(false)
const actionError = ref('')

// Dynamic Addition Forms
const listenerForm = ref({
  name: '',
  protocol: 'HTTP',
  protocolPort: 80,
  connectionLimit: -1,
  loadbalancerId: '',
})

const poolForm = ref({
  name: '',
  protocol: 'HTTP',
  lbAlgorithm: 'ROUND_ROBIN',
  loadbalancerId: '',
  listenerId: '',
})
const monitorForm = ref({
  poolId: '',
  type: 'HTTP',
  delay: 5,
  timeout: 5,
  maxRetries: 3,
  httpMethod: 'GET',
  urlPath: '/',
  expectedCodes: '200',
})

const memberForm = ref({
  poolId: '',
  sourceType: 'instance',
  instanceId: '',
  address: '',
  protocolPort: 80,
  weight: 1,
  subnetId: '',
})

// Lifecycle
onMounted(() => {
  refreshAll()
})

async function refreshAll(force = false) {
  try {
    const promises: Promise<any>[] = [
      loadStore.loadLoadBalancers(force),
      loadStore.loadListeners(force),
      loadStore.loadPools(force),
      networkStore.loadNetworks(),
      computeStore.loadAllComputeData(),
    ]
    if (selectedLb.value?.id) {
      promises.push(loadStore.loadLoadBalancerStats(selectedLb.value.id))
    }
    await Promise.allSettled(promises)
    // Maintain selection if still exists
    if (selectedLb.value) {
      const match = loadStore.loadbalancers.find((lb) => lb.id === selectedLb.value?.id)
      selectedLb.value = match || null
    }
  } catch (e) {
    console.error('Failed to load page resources:', e)
  }
}



// Computeds
const filteredLBs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = loadStore.loadbalancers || []
  if (!query) return list
  return list.filter((lb) => {
    if (!lb) return false
    const name = (lb.name || '').toLowerCase()
    const id = (lb.id || '').toLowerCase()
    const vip = (lb.vipAddress || '').toLowerCase()
    return name.includes(query) || id.includes(query) || vip.includes(query)
  })
})

const activeCount = computed(() => {
  const list = loadStore.loadbalancers || []
  return list.filter((lb) => lb && (lb.provisioningStatus || '').toUpperCase() === 'ACTIVE').length
})

const lbListeners = computed(() => {
  if (!selectedLb.value) return []
  const list = loadStore.listeners || []
  return list.filter((lis) =>
    lis && lis.loadbalancers && Array.isArray(lis.loadbalancers) && lis.loadbalancers.some((lbRef) => lbRef && lbRef.id === selectedLb.value?.id)
  )
})

const lbPools = computed(() => {
  if (!selectedLb.value) return []
  const list = loadStore.pools || []
  return list.filter((pool) =>
    pool && pool.loadbalancers && Array.isArray(pool.loadbalancers) && pool.loadbalancers.some((lbRef) => lbRef && lbRef.id === selectedLb.value?.id)
  )
})

// Watcher to load pool members for selected Load Balancer's pools
watch(() => lbPools.value, (newPools) => {
  if (Array.isArray(newPools)) {
    newPools.forEach((pool) => {
      if (pool && pool.id) {
        loadStore.loadPoolMembers(pool.id)
      }
    })
  }
}, { immediate: true })

// Watcher for VM instance selection in Add Member form
watch(() => memberForm.value.instanceId, (newInstanceId) => {
  if (memberForm.value.sourceType === 'instance') {
    const instances = computeStore.instances || []
    const inst = instances.find((i) => i && i.id === newInstanceId)
    if (inst) {
      memberForm.value.address = inst.ip || ''
    }
  }
})

// Watcher to fetch load balancer traffic stats on selection
watch(() => selectedLb.value?.id, (newId) => {
  if (newId) {
    loadStore.loadLoadBalancerStats(newId)
  }
})

async function handleFailover(id: string) {
  const lb = loadStore.loadbalancers.find((l) => l.id === id)
  if (!lb) return
  if (confirm(`⚠️ WARNING: Triggering failover will rebuild the Active/Standby Amphora VM instances for "${lb.name}". The service status will transition to PENDING_UPDATE. Are you sure you want to proceed?`)) {
    actionLoading.value = true
    actionError.value = ''
    try {
      await loadStore.failoverLoadBalancer(id)
      triggerPolling()
    } catch (err: any) {
      alert(err.message || 'Failed to trigger failover')
    } finally {
      actionLoading.value = false
    }
  }
}

// UI Helper Methods
function provisioningStatusClass(status: string) {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5'
    case 'PENDING_CREATE':
    case 'PENDING_UPDATE':
      return 'border-blue-500/20 text-blue-400 bg-blue-500/5'
    case 'ERROR':
      return 'border-rose-500/20 text-rose-400 bg-rose-500/5'
    default:
      return 'border-zinc-700 text-zinc-400 bg-zinc-900'
  }
}

function operatingStatusColor(status: string) {
  switch (status.toUpperCase()) {
    case 'ONLINE':
      return 'bg-emerald-500'
    case 'OFFLINE':
      return 'bg-rose-500'
    case 'DEGRADED':
      return 'bg-amber-500'
    default:
      return 'bg-zinc-655'
  }
}

// Modal Handlers
function openCreateModal() {
  actionError.value = ''
  showCreateModal.value = true
}

async function handleCreate(payload: any) {
  actionLoading.value = true
  actionError.value = ''
  try {
    const newLb = await loadStore.createLoadBalancer(payload)
    showCreateModal.value = false
    selectedLb.value = newLb
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to create load balancer'
  } finally {
    actionLoading.value = false
  }
}

function openEditModal(lb: LoadBalancer) {
  selectedLb.value = lb
  actionError.value = ''
  showEditModal.value = true
}

async function handleEditSubmit(payload: { name: string; description: string; adminStateUp: boolean }) {
  if (!selectedLb.value) return
  actionLoading.value = true
  actionError.value = ''
  try {
    const updated = await loadStore.updateLoadBalancer(selectedLb.value.id, {
      name: payload.name,
      description: payload.description,
      adminStateUp: payload.adminStateUp,
    })
    showEditModal.value = false
    if (selectedLb.value?.id === updated.id) {
      selectedLb.value = { ...selectedLb.value, ...updated }
    }
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to update load balancer'
  } finally {
    actionLoading.value = false
  }
}

async function confirmDelete(lb: LoadBalancer) {
  if (confirm(`Are you sure you want to delete load balancer "${lb.name}"?`)) {
    try {
      await loadStore.deleteLoadBalancer(lb.id)
      if (selectedLb.value?.id === lb.id) {
        selectedLb.value = null
      }
      triggerPolling()
    } catch (err: any) {
      alert(err.message || 'Failed to delete load balancer')
    }
  }
}

// Dynamic modular actions handlers
function openAddListenerModal() {
  if (!selectedLb.value) return
  listenerForm.value = {
    name: `${selectedLb.value.name}-listener`,
    protocol: 'HTTP',
    protocolPort: 80,
    connectionLimit: -1,
    loadbalancerId: selectedLb.value.id,
  }
  actionError.value = ''
  showAddListenerModal.value = true
}

async function handleAddListener() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await loadStore.createListener({
      name: listenerForm.value.name.trim(),
      protocol: listenerForm.value.protocol,
      protocolPort: listenerForm.value.protocolPort,
      connectionLimit: listenerForm.value.connectionLimit && listenerForm.value.connectionLimit > 0 ? listenerForm.value.connectionLimit : undefined,
      loadbalancerId: listenerForm.value.loadbalancerId,
    })
    showAddListenerModal.value = false
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to add listener'
  } finally {
    actionLoading.value = false
  }
}

function openAddPoolModal() {
  if (!selectedLb.value) return
  poolForm.value = {
    name: `${selectedLb.value.name}-pool`,
    protocol: 'HTTP',
    lbAlgorithm: 'ROUND_ROBIN',
    loadbalancerId: selectedLb.value.id,
    listenerId: '',
  }
  if (lbListeners.value.length > 0 && lbListeners.value[0]) {
    poolForm.value.listenerId = lbListeners.value[0].id
  }
  actionError.value = ''
  showAddPoolModal.value = true
}

async function handleAddPool() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await loadStore.createPool({
      name: poolForm.value.name.trim(),
      protocol: poolForm.value.protocol,
      lbAlgorithm: poolForm.value.lbAlgorithm,
      loadbalancerId: poolForm.value.loadbalancerId,
      listenerId: poolForm.value.listenerId || undefined,
    })
    showAddPoolModal.value = false
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to add pool'
  } finally {
    actionLoading.value = false
  }
}

function openAddMonitorModal(poolId: string) {
  monitorForm.value = {
    poolId,
    type: 'HTTP',
    delay: 5,
    timeout: 5,
    maxRetries: 3,
    httpMethod: 'GET',
    urlPath: '/',
    expectedCodes: '200',
  }
  actionError.value = ''
  showAddMonitorModal.value = true
}

async function handleAddMonitor() {
  actionLoading.value = true
  actionError.value = ''
  try {
    const payload: any = {
      poolId: monitorForm.value.poolId,
      type: monitorForm.value.type,
      delay: monitorForm.value.delay,
      timeout: monitorForm.value.timeout,
      maxRetries: monitorForm.value.maxRetries,
    }
    if (monitorForm.value.type === 'HTTP' || monitorForm.value.type === 'HTTPS') {
      payload.httpMethod = monitorForm.value.httpMethod
      payload.urlPath = monitorForm.value.urlPath
      payload.expectedCodes = monitorForm.value.expectedCodes
    }
    await loadStore.createHealthMonitor(payload)
    showAddMonitorModal.value = false
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to add health monitor'
  } finally {
    actionLoading.value = false
  }
}

function openAddMemberModal(poolId: string) {
  memberForm.value = {
    poolId,
    sourceType: 'instance',
    instanceId: '',
    address: '',
    protocolPort: 80,
    weight: 1,
    subnetId: '',
  }
  // Try to default to first VM instance
  if (computeStore.instances.length > 0 && computeStore.instances[0]) {
    memberForm.value.instanceId = computeStore.instances[0].id
    memberForm.value.address = computeStore.instances[0].ip || ''
  }
  // Try to default to LB subnet
  if (selectedLb.value?.vipSubnetId) {
    memberForm.value.subnetId = selectedLb.value.vipSubnetId
  } else if (networkStore.networks.length > 0 && networkStore.networks[0]) {
    memberForm.value.subnetId = networkStore.networks[0].subnetId || ''
  }
  actionError.value = ''
  showAddMemberModal.value = true
}

async function handleAddMember() {
  actionLoading.value = true
  actionError.value = ''
  try {
    await loadStore.createPoolMember(memberForm.value.poolId, {
      address: memberForm.value.address.trim(),
      protocolPort: memberForm.value.protocolPort,
      weight: memberForm.value.weight,
      subnetId: memberForm.value.subnetId,
    })
    showAddMemberModal.value = false
    triggerPolling()
  } catch (err: any) {
    actionError.value = err.message || 'Failed to add backend server member'
  } finally {
    actionLoading.value = false
  }
}

async function handleDeleteMember(poolId: string, memberId: string) {
  if (confirm('Are you sure you want to remove this backend server member?')) {
    try {
      await loadStore.deletePoolMember(poolId, memberId)
      triggerPolling()
    } catch (err: any) {
      alert(err.message || 'Failed to remove member')
    }
  }
}

// Simple polling loop helper when resources are changing status
function triggerPolling() {
  let count = 0
  const interval = setInterval(async () => {
    count++
    await refreshAll(true)
    // Stop polling after 5 tries or when everything stabilizes
    const isStable = loadStore.loadbalancers.every(
      (lb) => lb.provisioningStatus === 'ACTIVE' || lb.provisioningStatus === 'ERROR'
    )
    if (isStable || count >= 5) {
      clearInterval(interval)
    }
  }, 3000)
}
</script>
