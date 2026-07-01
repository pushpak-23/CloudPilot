<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight text-white">
          Network Control Plane
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Manage Neutron networks, routers, ports, and floating IPs with a
          topology view that shows what is connected to what.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          @click="openCreateNetworkModal"
          class="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm shadow-lg shadow-blue-500/10 cursor-pointer"
        >
          <span>+</span> Create Network
        </button>
        <button
          @click="showCreateRouterModal = true"
          class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm cursor-pointer"
        >
          <span>+</span> Create Router
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      <div
        class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between"
      >
        <div>
          <div
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
          >
            Networks
          </div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">
            {{ networkStore.totalNetworksCount }}
          </div>
        </div>
        <div
          class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400"
        >
          <NetworkIcon :size="20" />
        </div>
      </div>

      <div
        class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between"
      >
        <div>
          <div
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
          >
            Routers
          </div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">
            {{ networkStore.routers.length }}
          </div>
        </div>
        <div
          class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20"
        >
          <RouteIcon :size="18" class="text-emerald-400" />
        </div>
      </div>

      <div
        class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between"
      >
        <div>
          <div
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
          >
            External Networks
          </div>
          <div class="text-3xl font-extrabold mt-1.5 text-blue-400">
            {{ externalNetworks.length }}
          </div>
        </div>
        <div
          class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-blue-500/10 border-blue-500/20"
        >
          <Globe :size="18" class="text-blue-400" />
        </div>
      </div>

      <div
        class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between"
      >
        <div>
          <div
            class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
          >
            Ports
          </div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">
            {{ topologyPorts.length }}
          </div>
        </div>
        <div
          class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400"
        >
          <CableIcon :size="18" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
      <div class="space-y-6">
        <div
          class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
        >
          <div
            class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10"
          >
            <h2 class="font-semibold text-lg text-white">Networks</h2>
            <input
              v-model="searchQuery"
              placeholder="Filter networks..."
              class="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white w-full sm:w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-500"
            />
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none"
                >
                  <th class="p-4">Network Name</th>
                  <th class="p-4">Subnet</th>
                  <th class="p-4">Gateway</th>
                  <th class="p-4">Ports</th>
                  <th class="p-4">Router</th>
                  <th class="p-4">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-850 text-sm">
                <tr v-if="networkStore.loading">
                  <td colspan="6" class="p-8 text-center text-zinc-500">
                    <Loader class="animate-spin inline-block mr-2" :size="16" />
                    Loading Neutron resources...
                  </td>
                </tr>
                <tr v-else-if="filteredNetworks.length === 0">
                  <td colspan="6" class="p-8 text-center text-zinc-500">
                    No networks found.
                  </td>
                </tr>
                <tr
                  v-for="net in filteredNetworks"
                  :key="net.id"
                  class="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                  @click="openNetworkDetails(net)"
                >
                  <td class="p-4 font-semibold text-white">{{ net.name }}</td>
                  <td class="p-4 font-mono text-zinc-300">{{ net.subnet }}</td>
                  <td class="p-4 font-mono text-zinc-400">{{ net.gateway }}</td>
                  <td class="p-4 text-zinc-300">
                    {{ countPortsForNetwork(net.id) }}
                  </td>
                  <td class="p-4 text-zinc-300">
                    {{ routerNamesForNetwork(net.id) }}
                  </td>
                  <td class="p-4">
                    <button
                      @click.stop="openNetworkDetails(net)"
                      class="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 cursor-pointer"
                    >
                      Details
                    </button>
                    <button
                      @click.stop="openEditNetworkModal(net)"
                      class="ml-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-300 cursor-pointer"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div
          class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
        >
          <div
            class="p-5 border-b border-zinc-800 bg-zinc-900/10 flex items-center justify-between"
          >
            <h2 class="font-semibold text-lg text-white">Routers</h2>
            <button
              @click="refreshAll"
              class="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-200 cursor-pointer"
            >
              Refresh
            </button>
          </div>
          <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="router in networkStore.routers"
              :key="router.id"
              class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <div class="text-white font-semibold">{{ router.name }}</div>
                  <div class="text-xs text-zinc-500 font-mono">
                    {{ router.id }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded-full text-[11px] font-semibold border border-emerald-500/20 text-emerald-400 bg-emerald-500/10"
                  >
                    {{ router.status }}
                  </span>
                  <button
                    @click="openEditRouterModal(router)"
                    class="px-2.5 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-[11px] text-blue-300 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <div class="text-sm text-zinc-300 space-y-1">
                <div>
                  External:
                  {{
                    router.externalNetworkName ||
                    router.externalNetworkId ||
                    'None'
                  }}
                </div>
                <div>HA: {{ router.ha ? 'Enabled' : 'Disabled' }}</div>
                <div>Distributed: {{ router.distributed ? 'Yes' : 'No' }}</div>
              </div>
            </div>
            <div
              v-if="networkStore.routers.length === 0"
              class="md:col-span-2 p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl"
            >
              No routers created yet.
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div
          class="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 shadow-xl sticky top-6"
        >
          <div class="flex items-center justify-between gap-3 mb-4">
            <h2 class="font-semibold text-lg text-white">Topological View</h2>
            <span class="text-xs text-zinc-500">Selected network</span>
          </div>

          <div v-if="selectedNetwork" class="space-y-4">
            <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div
                class="text-xs uppercase tracking-wider text-zinc-500 font-semibold"
              >
                Network
              </div>
              <div class="text-white font-semibold mt-1">
                {{ selectedNetwork.name }}
              </div>
              <div class="text-xs text-zinc-400 font-mono mt-1">
                {{ selectedNetwork.subnet }} | GW {{ selectedNetwork.gateway }}
              </div>
            </div>

            <div
              class="flex items-center justify-center py-2 text-xs text-zinc-500"
            >
              Connected Ports
            </div>

            <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
              <div
                v-for="port in topologyPorts"
                :key="port.id"
                class="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3"
              >
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <div class="text-white font-semibold text-sm">
                      {{ portLabel(port) }}
                    </div>
                    <div class="text-xs text-zinc-500 font-mono">
                      {{ port.id }}
                    </div>
                  </div>
                  <span
                    class="text-[11px] px-2 py-0.5 rounded-full border"
                    :class="portTypeClass(port)"
                    >{{ portTypeLabel(port) }}</span
                  >
                </div>
                <div class="text-xs text-zinc-400 space-y-1">
                  <div>Device: {{ port.device_owner || 'unknown' }}</div>
                  <div>Instance: {{ instanceNameForPort(port) }}</div>
                  <div>MAC: {{ port.mac_address || 'n/a' }}</div>
                  <div>IP(s): {{ fixedIpsForPort(port) }}</div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 pt-2">
              <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div
                  class="text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-2"
                >
                  Connected Routers
                </div>
                <div v-if="connectedRouters.length > 0" class="space-y-2">
                  <div
                    v-for="router in connectedRouters"
                    :key="router.id"
                    class="flex items-center justify-between text-sm text-zinc-200"
                  >
                    <span>{{ router.name }}</span>
                    <span class="text-xs text-emerald-400">{{
                      router.status
                    }}</span>
                  </div>
                </div>
                <div v-else class="text-sm text-zinc-500">
                  No router interface attached.
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="p-6 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl"
          >
            Select a network to inspect ports, router links, and attached
            instances.
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4"
      >
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">
          Create Network
        </h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >Network Name</label
            >
            <input
              v-model="newNetName"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
              placeholder="e.g., app-net"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase"
                >Subnet CIDR</label
              >
              <input
                v-model="newNetSubnet"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
                placeholder="10.0.10.0/24"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase"
                >Gateway IP</label
              >
              <input
                v-model="newNetGateway"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
                placeholder="10.0.10.1"
              />
            </div>
          </div>
          <div class="flex items-center gap-6 pt-2 select-none">
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="newNetShared"
                class="accent-blue-500 h-4 w-4"
              />
              Shared Network
            </label>
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="newNetExternal"
                class="accent-blue-500 h-4 w-4"
              />
              External Gateway
            </label>
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
            @click="submitCreateNetwork"
            :disabled="
              !newNetName.trim() ||
              !newNetSubnet.trim() ||
              !newNetGateway.trim()
            "
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Create Network
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateRouterModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showCreateRouterModal = false"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4"
      >
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">
          Create Router
        </h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >Router Name</label
            >
            <input
              v-model="newRouterName"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
              placeholder="e.g., edge-router"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >External Network</label
            >
            <select
              v-model="newRouterExternalNetworkId"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">None</option>
              <option
                v-for="net in externalNetworks"
                :key="net.id"
                :value="net.id"
              >
                {{ net.name }}
              </option>
            </select>
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >Attach Subnet</label
            >
            <select
              v-model="newRouterAttachSubnetId"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">No interface yet</option>
              <option
                v-for="net in networkStore.networks"
                :key="net.id"
                :value="net.subnetId || ''"
                :disabled="!net.subnetId"
              >
                {{ net.name }} ({{ net.subnet }})
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showCreateRouterModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitCreateRouter"
            :disabled="!newRouterName.trim()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Create Router
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEditNetworkModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showEditNetworkModal = false"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4"
      >
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">
          Edit Network
        </h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >Network Name</label
            >
            <input
              v-model="editNetworkName"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase"
                >Subnet</label
              >
              <input
                :value="
                  networkStore.networks.find((n) => n.id === editNetworkId)
                    ?.subnet || ''
                "
                disabled
                class="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase"
                >Gateway</label
              >
              <input
                :value="
                  networkStore.networks.find((n) => n.id === editNetworkId)
                    ?.gateway || ''
                "
                disabled
                class="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
          <div class="flex items-center gap-6 pt-2 select-none">
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer"
              ><input
                type="checkbox"
                v-model="editNetworkShared"
                class="accent-blue-500 h-4 w-4"
              />
              Shared Network</label
            >
            <label
              class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer"
              ><input
                type="checkbox"
                v-model="editNetworkExternal"
                class="accent-blue-500 h-4 w-4"
              />
              External Gateway</label
            >
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showEditNetworkModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitEditNetwork"
            :disabled="!editNetworkName.trim()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showEditRouterModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showEditRouterModal = false"
    >
      <div
        class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4"
      >
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3">
          Edit Router
        </h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >Router Name</label
            >
            <input
              v-model="editRouterName"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase"
              >External Network</label
            >
            <select
              v-model="editRouterExternalNetworkId"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">None</option>
              <option
                v-for="net in externalNetworks"
                :key="net.id"
                :value="net.id"
              >
                {{ net.name }}
              </option>
            </select>
          </div>
          <label
            class="flex items-center gap-2 text-xs font-medium text-zinc-400 cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="editRouterAdminStateUp"
              class="accent-emerald-500 h-4 w-4"
            />
            Admin State Up
          </label>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showEditRouterModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitEditRouter"
            :disabled="!editRouterName.trim()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailsModal && detailNetwork"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto"
      @click.self="closeDetailsModal"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div
          class="p-6 border-b border-zinc-800 flex items-start justify-between gap-4"
        >
          <div>
            <h2 class="text-2xl font-bold text-white tracking-tight">
              {{ detailNetwork.name }}
            </h2>
            <div class="text-xs text-zinc-500 font-mono mt-1">
              {{ detailNetwork.id }}
            </div>
          </div>
          <button
            @click="closeDetailsModal"
            class="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded-lg"
          >
            <X :size="24" />
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div
                class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
              >
                Subnet
              </div>
              <div class="text-sm text-zinc-200 font-mono">
                {{ detailNetwork.subnet }}
              </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div
                class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
              >
                Gateway
              </div>
              <div class="text-sm text-zinc-200 font-mono">
                {{ detailNetwork.gateway }}
              </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div
                class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
              >
                Shared
              </div>
              <div class="text-sm text-zinc-200">
                {{ detailNetwork.shared ? 'Yes' : 'No' }}
              </div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div
                class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
              >
                External
              </div>
              <div class="text-sm text-zinc-200">
                {{ detailNetwork.external ? 'Yes' : 'No' }}
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div
              class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <div
                class="p-5 border-b border-zinc-800 flex items-center justify-between"
              >
                <h3 class="font-semibold text-white">Ports on this Network</h3>
                <span class="text-xs text-zinc-500"
                  >{{ selectedNetworkPorts.length }} ports</span
                >
              </div>
              <div
                v-if="selectedNetworkPorts.length > 0"
                class="divide-y divide-zinc-800"
              >
                <div
                  v-for="port in selectedNetworkPorts"
                  :key="port.id"
                  class="p-4 space-y-2"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold text-white">
                        {{ portLabel(port) }}
                      </div>
                      <div class="text-xs text-zinc-500 font-mono">
                        {{ port.id }}
                      </div>
                    </div>
                    <span
                      class="text-[11px] px-2 py-0.5 rounded-full border"
                      :class="portTypeClass(port)"
                      >{{ portTypeLabel(port) }}</span
                    >
                  </div>
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-400"
                  >
                    <div>Instance: {{ instanceNameForPort(port) }}</div>
                    <div>MAC: {{ port.mac_address || 'n/a' }}</div>
                    <div class="sm:col-span-2">
                      IPs: {{ fixedIpsForPort(port) }}
                    </div>
                    <div class="sm:col-span-2">
                      Device owner: {{ port.device_owner || 'unknown' }}
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="p-8 text-center text-zinc-500">
                No ports currently attached to this network.
              </div>
            </div>

            <div
              class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <div
                class="p-5 border-b border-zinc-800 flex items-center justify-between"
              >
                <h3 class="font-semibold text-white">Topology</h3>
                <button
                  @click="refreshSelectedNetwork"
                  class="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-xs text-zinc-200 cursor-pointer"
                >
                  Refresh
                </button>
              </div>
              <div class="p-5 space-y-4">
                <div class="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div
                    class="text-xs uppercase tracking-wider text-zinc-500 font-semibold"
                  >
                    Network
                  </div>
                  <div class="text-white font-semibold mt-1">
                    {{ selectedNetwork.name }}
                  </div>
                </div>

                <div class="space-y-3">
                  <div
                    class="text-xs uppercase tracking-wider text-zinc-500 font-semibold"
                  >
                    Ports to Instances
                  </div>
                  <div
                    v-for="port in vmPortsForSelectedNetwork"
                    :key="port.id"
                    class="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                  >
                    <div
                      class="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <div class="text-xs text-zinc-500">Port</div>
                      <div class="text-sm text-white font-mono truncate">
                        {{ port.id }}
                      </div>
                    </div>
                    <div class="text-xs text-zinc-500 px-2">→</div>
                    <div
                      class="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <div class="text-xs text-zinc-500">Instance</div>
                      <div class="text-sm text-white truncate">
                        {{ instanceNameForPort(port) }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="vmPortsForSelectedNetwork.length === 0"
                    class="text-sm text-zinc-500 italic"
                  >
                    No VM ports on this network.
                  </div>
                </div>

                <div class="space-y-3">
                  <div
                    class="text-xs uppercase tracking-wider text-zinc-500 font-semibold"
                  >
                    Router Links
                  </div>
                  <div
                    v-for="router in connectedRouters"
                    :key="router.id"
                    class="grid grid-cols-[1fr_auto_1fr] items-center gap-3"
                  >
                    <div
                      class="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <div class="text-xs text-zinc-500">Network</div>
                      <div class="text-sm text-white">
                        {{ selectedNetwork.name }}
                      </div>
                    </div>
                    <div class="text-xs text-zinc-500 px-2">→</div>
                    <div
                      class="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3"
                    >
                      <div class="text-xs text-emerald-400">Router</div>
                      <div class="text-sm text-white">{{ router.name }}</div>
                    </div>
                  </div>
                  <div
                    v-if="connectedRouters.length === 0"
                    class="text-sm text-zinc-500 italic"
                  >
                    No router interface attached to this network.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  Globe,
  Loader,
  Network as NetworkIcon,
  Route as RouteIcon,
  Cable as CableIcon,
  X,
} from 'lucide-vue-next'
import { useNetworkStore } from '@/stores/network'
import { computeService } from '@/services/compute.service'
import {
  networkService,
  type NetworkConfig,
  type NetworkRouter,
} from '@/services/network.service'

const networkStore = useNetworkStore()

const searchQuery = ref('')
const showCreateModal = ref(false)
const showCreateRouterModal = ref(false)
const showDetailsModal = ref(false)
const selectedNetwork = ref<NetworkConfig | null>(null)
const detailNetwork = ref<NetworkConfig | null>(null)
const selectedNetworkPorts = ref<any[]>([])
const allNetworkPorts = ref<Record<string, any[]>>({})
const instances = ref<any[]>([])

const newNetName = ref('')
const newNetSubnet = ref('10.0.5.0/24')
const newNetGateway = ref('10.0.5.1')
const newNetShared = ref(false)
const newNetExternal = ref(false)

const newRouterName = ref('')
const newRouterExternalNetworkId = ref('')
const newRouterAttachSubnetId = ref('')

const showEditNetworkModal = ref(false)
const editNetworkId = ref('')
const editNetworkName = ref('')
const editNetworkShared = ref(false)
const editNetworkExternal = ref(false)

const showEditRouterModal = ref(false)
const editRouterId = ref('')
const editRouterName = ref('')
const editRouterAdminStateUp = ref(true)
const editRouterExternalNetworkId = ref('')

const filteredNetworks = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return networkStore.networks.filter(
    (network) =>
      network.name.toLowerCase().includes(q) ||
      network.subnet.toLowerCase().includes(q) ||
      network.gateway.toLowerCase().includes(q)
  )
})

const externalNetworks = computed(() =>
  networkStore.networks.filter((network) => network.external)
)

const topologyPorts = computed(() => selectedNetworkPorts.value)

const vmPortsForSelectedNetwork = computed(() =>
  selectedNetworkPorts.value.filter((port) => isVmPort(port))
)

const connectedRouters = computed(() => {
  if (!selectedNetwork.value) return []
  return connectedRoutersForNetwork(selectedNetwork.value.id)
})

const routerNamesForNetwork = (networkId: string) => {
  const routers = connectedRoutersForNetwork(networkId)
  return routers.length > 0
    ? routers.map((router) => router.name).join(', ')
    : '-'
}

function countPortsForNetwork(networkId: string): number {
  return allNetworkPorts.value[networkId]?.length || 0
}

function networkForDetails() {
  return detailNetwork.value || selectedNetwork.value
}

function portsForNetwork(networkId: string): any[] {
  return allNetworkPorts.value[networkId] || []
}

function connectedRoutersForNetwork(networkId: string): NetworkRouter[] {
  const routerIds = new Set(
    portsForNetwork(networkId)
      .filter((port) => String(port.device_owner || '').includes('router'))
      .map((port) => port.device_id)
  )

  return networkStore.routers.filter((router) => routerIds.has(router.id))
}

function isVmPort(port: any): boolean {
  return String(port.device_owner || '').includes('compute')
}

function portLabel(port: any): string {
  if (isVmPort(port)) {
    return instanceNameForPort(port)
  }
  if (String(port.device_owner || '').includes('router')) {
    return `Router Port: ${port.device_id || port.id}`
  }
  return port.name || port.device_id || 'Unassigned Port'
}

function portTypeLabel(port: any): string {
  if (isVmPort(port)) return 'Instance'
  if (String(port.device_owner || '').includes('router')) return 'Router'
  return 'Other'
}

function portTypeClass(port: any): string {
  if (isVmPort(port)) return 'text-blue-400 border-blue-500/20 bg-blue-500/10'
  if (String(port.device_owner || '').includes('router'))
    return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
  return 'text-zinc-400 border-zinc-700 bg-zinc-800/80'
}

function fixedIpsForPort(port: any): string {
  const ips = (port.fixed_ips || [])
    .map((ip: any) => ip.ip_address)
    .filter(Boolean)
  return ips.length > 0 ? ips.join(', ') : 'n/a'
}

function instanceNameForPort(port: any): string {
  const instance = instances.value.find((vm) => vm.id === port.device_id)
  return instance?.name || port.device_id || 'n/a'
}

async function refreshAll() {
  await Promise.all([
    networkStore.loadNetworks(true),
    networkStore.loadRouters(true),
    (async () => {
      instances.value = await computeService.getInstances()
    })(),
  ])

  const portEntries = await Promise.all(
    networkStore.networks.map(async (network) => [
      network.id,
      await networkService.getPortsForNetwork(network.id),
    ])
  )
  allNetworkPorts.value = Object.fromEntries(portEntries)

  if (!selectedNetwork.value && networkStore.networks.length > 0) {
    selectedNetwork.value = networkStore.networks[0]
    await refreshSelectedNetwork()
  } else if (
    selectedNetwork.value &&
    !networkStore.networks.find((n) => n.id === selectedNetwork.value?.id) &&
    networkStore.networks.length > 0
  ) {
    selectedNetwork.value = networkStore.networks[0]
    await refreshSelectedNetwork()
  }
}

async function openCreateNetworkModal() {
  showCreateModal.value = true
}

function closeDetailsModal() {
  showDetailsModal.value = false
  detailNetwork.value = null
  selectedNetworkPorts.value = []
}

async function openNetworkDetails(network: NetworkConfig) {
  selectedNetwork.value = network
  detailNetwork.value = network
  showDetailsModal.value = true
  await refreshSelectedNetwork()
}

async function refreshSelectedNetwork() {
  if (!selectedNetwork.value) return

  const networkId = selectedNetwork.value.id
  selectedNetworkPorts.value =
    allNetworkPorts.value[networkId] ||
    (await networkService.getPortsForNetwork(networkId))
  allNetworkPorts.value[networkId] = selectedNetworkPorts.value
}

async function submitCreateNetwork() {
  if (
    !newNetName.value.trim() ||
    !newNetSubnet.value.trim() ||
    !newNetGateway.value.trim()
  )
    return

  await networkStore.createNetwork({
    name: newNetName.value.trim(),
    subnet: newNetSubnet.value.trim(),
    gateway: newNetGateway.value.trim(),
    shared: newNetShared.value,
    external: newNetExternal.value,
  })

  newNetName.value = ''
  newNetSubnet.value = '10.0.5.0/24'
  newNetGateway.value = '10.0.5.1'
  newNetShared.value = false
  newNetExternal.value = false
  showCreateModal.value = false
}

async function submitCreateRouter() {
  if (!newRouterName.value.trim()) return

  await networkStore.createRouter({
    name: newRouterName.value.trim(),
    externalNetworkId: newRouterExternalNetworkId.value || null,
    attachSubnetId: newRouterAttachSubnetId.value || null,
  })

  newRouterName.value = ''
  newRouterExternalNetworkId.value = ''
  newRouterAttachSubnetId.value = ''
  showCreateRouterModal.value = false
}

function openEditNetworkModal(network: NetworkConfig) {
  editNetworkId.value = network.id
  editNetworkName.value = network.name
  editNetworkShared.value = network.shared
  editNetworkExternal.value = network.external
  showEditNetworkModal.value = true
}

function openEditRouterModal(router: NetworkRouter) {
  editRouterId.value = router.id
  editRouterName.value = router.name
  editRouterAdminStateUp.value = router.adminStateUp
  editRouterExternalNetworkId.value = router.externalNetworkId || ''
  showEditRouterModal.value = true
}

async function submitEditNetwork() {
  if (!editNetworkId.value || !editNetworkName.value.trim()) return

  await networkStore.updateNetwork(editNetworkId.value, {
    name: editNetworkName.value.trim(),
    shared: editNetworkShared.value,
    external: editNetworkExternal.value,
  })
  showEditNetworkModal.value = false
  await refreshAll()
}

async function submitEditRouter() {
  if (!editRouterId.value || !editRouterName.value.trim()) return

  await networkStore.updateRouter(editRouterId.value, {
    name: editRouterName.value.trim(),
    adminStateUp: editRouterAdminStateUp.value,
    externalNetworkId: editRouterExternalNetworkId.value || null,
  })
  showEditRouterModal.value = false
  await refreshAll()
}

onMounted(async () => {
  await refreshAll()
})
</script>
