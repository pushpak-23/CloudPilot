<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 lg:p-8 overflow-y-auto"
  >
    <div
      class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header -->
      <div
        class="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/80 relative overflow-hidden"
      >
        <div
          class="absolute inset-0 opacity-20 pointer-events-none"
          style="
            background: radial-gradient(
              circle at 10% 20%,
              rgba(59, 130, 246, 0.4) 0%,
              transparent 60%
            );
          "
        ></div>

        <div class="flex items-center gap-4 relative z-10">
          <div
            class="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center min-w-13.5 min-h-13.5"
          >
            <DistroLogo
              v-if="imageInfo && imageInfo.name"
              :name="imageInfo.name"
              size="md"
            />
            <Server v-else :size="28" class="text-blue-400" />
          </div>
          <div>
            <h2 class="text-2xl font-bold text-white tracking-tight">
              {{ detail?.name || 'Server Details' }}
            </h2>
            <div
              class="text-xs text-zinc-500 font-mono mt-1 flex items-center gap-2"
            >
              <span class="uppercase font-semibold tracking-wider text-zinc-400"
                >ID:</span
              >
              <span
                class="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
                >{{ id }}</span
              >
              <CopyButton :text="id" class="p-0.5 border-0 bg-transparent" />
            </div>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-zinc-500 hover:text-white transition-colors relative z-10 p-1 hover:bg-zinc-800 rounded-lg"
        >
          <X :size="24" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="px-6 border-b border-zinc-800 bg-zinc-900/20 flex gap-4">
        <button
          @click="activeModalTab = 'overview'"
          :class="
            activeModalTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          "
          class="px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
        >
          Overview &amp; Actions
        </button>
        <button
          @click="activeModalTab = 'monitoring'"
          :class="
            activeModalTab === 'monitoring'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          "
          class="px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
        >
          Monitoring
        </button>
        <button
          @click="activeModalTab = 'networks'"
          :class="
            activeModalTab === 'networks'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          "
          class="px-4 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
        >
          Interfaces &amp; Storage
        </button>
      </div>

      <!-- Content Area -->
      <div class="overflow-y-auto flex-1 bg-zinc-950/50">
        <div
          v-if="loading && !detail"
          class="py-24 flex flex-col justify-center items-center text-zinc-500 gap-4"
        >
          <Loader class="animate-spin text-blue-500" :size="36" />
          <p class="text-sm tracking-widest uppercase font-semibold">
            Loading properties...
          </p>
        </div>

        <div
          v-else-if="error"
          class="py-24 flex flex-col justify-center items-center text-red-400 gap-4"
        >
          <AlertCircle :size="36" />
          <p class="text-sm font-semibold">{{ error }}</p>
        </div>

        <div v-else-if="detail" class="p-6 lg:p-8 space-y-6 relative">
          <!-- Inner Loader for minor updates -->
          <div
            v-if="loading"
            class="absolute top-2 right-6 bg-zinc-900 border border-zinc-800 text-xs px-3 py-1 rounded-full text-zinc-400 flex items-center gap-2"
          >
            <Loader class="animate-spin text-blue-500" :size="12" /> Updating...
          </div>

          <!-- Status Banner -->
          <div
            class="flex items-center justify-between p-4 rounded-xl border animate-fade-in"
            :class="statusBannerClass"
          >
            <div class="flex items-center gap-3">
              <span
                class="w-3 h-3 rounded-full animate-pulse"
                :class="statusBulletClass"
              ></span>
              <span class="font-bold uppercase tracking-wider text-sm">{{
                detail.status
              }}</span>
            </div>
            <div
              class="flex items-center gap-4 text-xs font-semibold opacity-70"
            >
              <span
                v-if="detail['OS-EXT-STS:locked_by']"
                class="bg-red-950/30 text-red-400 border border-red-500/20 px-2 py-0.5 rounded flex items-center gap-1"
              >
                <Lock :size="10" /> Locked
              </span>
              <span
                >Power State:
                {{ mapPowerState(detail['OS-EXT-STS:power_state']) }}</span
              >
            </div>
          </div>

          <!-- TAB 1: OVERVIEW & ACTIONS -->
          <div
            v-if="activeModalTab === 'overview'"
            class="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <!-- Left Side: Basic Info & Specs -->
            <div class="lg:col-span-2 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div
                    class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
                  >
                    Host Node
                  </div>
                  <div class="text-sm text-zinc-200 font-medium font-mono">
                    {{ detail['OS-EXT-SRV-ATTR:host'] || detail.host || 'N/A' }}
                  </div>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div
                    class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
                  >
                    Availability Zone
                  </div>
                  <div class="text-sm text-zinc-200 font-medium font-mono">
                    {{
                      detail['OS-EXT-AZ:availability_zone'] ||
                      detail.availability_zone ||
                      'nova'
                    }}
                  </div>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div
                    class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
                  >
                    Created At
                  </div>
                  <div class="text-sm text-zinc-200 font-medium font-mono">
                    {{
                      detail.created
                        ? new Date(detail.created).toLocaleString()
                        : 'N/A'
                    }}
                  </div>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div
                    class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1"
                  >
                    Updated At
                  </div>
                  <div class="text-sm text-zinc-200 font-medium font-mono">
                    {{
                      detail.updated
                        ? new Date(detail.updated).toLocaleString()
                        : 'N/A'
                    }}
                  </div>
                </div>
              </div>

              <!-- Specifications -->
              <section
                class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4"
              >
                <h3
                  class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"
                >
                  <Cpu :size="16" class="text-zinc-500" /> Instance
                  Specifications
                </h3>
                <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <div
                      class="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1"
                    >
                      Flavor Details
                    </div>
                    <div v-if="flavorInfo" class="space-y-1.5 text-sm">
                      <div class="flex justify-between">
                        <span class="text-zinc-400">Name</span>
                        <span class="font-medium text-zinc-200">{{
                          flavorInfo.name
                        }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-zinc-400">VCPUs</span>
                        <span class="font-mono text-zinc-200"
                          >{{ flavorInfo.vcpus }} Cores</span
                        >
                      </div>
                      <div class="flex justify-between">
                        <span class="text-zinc-400">RAM</span>
                        <span class="font-mono text-zinc-200">
                          {{
                            flavorInfo.ram >= 1024
                              ? (flavorInfo.ram / 1024).toFixed(0) + ' GB'
                              : flavorInfo.ram + ' MB'
                          }}
                        </span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-zinc-400">Root Disk</span>
                        <span class="font-mono text-zinc-200"
                          >{{ flavorInfo.disk }} GB</span
                        >
                      </div>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <div
                      class="text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800 pb-1"
                    >
                      Source Image
                    </div>
                    <div v-if="imageInfo" class="space-y-1.5 text-sm">
                      <div class="flex justify-between">
                        <span class="text-zinc-400">Name</span>
                        <span
                          class="font-medium text-zinc-200 text-right truncate max-w-50"
                          :title="imageInfo.name"
                          >{{ imageInfo.name }}</span
                        >
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-zinc-400">Image ID</span>
                        <div class="flex items-center gap-1">
                          <span
                            class="font-mono text-xs text-zinc-500 truncate max-w-40"
                            :title="detail.image?.id"
                            >{{ detail.image?.id || 'N/A' }}</span
                          >
                          <CopyButton v-if="detail.image?.id" :text="detail.image.id" class="p-0.5 border-0 bg-transparent scale-90" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Identity IDs -->
              <section
                class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4"
              >
                <h3
                  class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"
                >
                  <Info :size="16" class="text-zinc-500" /> Administrative IDs
                </h3>
                <div
                  class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono"
                >
                  <div
                    class="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80 flex justify-between items-center"
                  >
                    <span
                      class="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]"
                      >Project ID</span
                    >
                    <div class="flex items-center gap-1.5">
                      <span class="text-zinc-300">{{ detail.tenant_id }}</span>
                      <CopyButton v-if="detail.tenant_id" :text="detail.tenant_id" class="p-0.5 border-0 bg-transparent" />
                    </div>
                  </div>
                  <div
                    class="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/80 flex justify-between items-center"
                  >
                    <span
                      class="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]"
                      >User ID</span
                    >
                    <div class="flex items-center gap-1.5">
                      <span class="text-zinc-300">{{ detail.user_id }}</span>
                      <CopyButton v-if="detail.user_id" :text="detail.user_id" class="p-0.5 border-0 bg-transparent" />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <!-- Right Side: Extensive Server Actions -->
            <div class="space-y-6">
              <section
                class="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4"
              >
                <h3
                  class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-3"
                >
                  <Settings :size="16" class="text-zinc-500" /> Server
                  Operations
                </h3>

                <div class="grid grid-cols-2 gap-2">
                  <!-- Edit Name -->
                  <button
                    @click="openRenameModal"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <FileText :size="12" /> Edit Name
                  </button>

                  <!-- Console VNC -->
                  <button
                    @click="openVncConsole"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Terminal :size="12" /> Console VNC
                  </button>

                  <!-- View Console Log -->
                  <button
                    @click="fetchConsoleLog"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <FileText :size="12" /> View Console Log Output
                  </button>

                  <!-- Floating IP -->
                  <button
                    @click="openFipModal"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <Globe :size="12" /> Associate Floating IP
                  </button>

                  <hr class="border-zinc-800 col-span-2 my-1" />

                  <!-- Lock / Unlock -->
                  <button
                    @click="toggleLock"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <component
                      :is="detail['OS-EXT-STS:locked_by'] ? Unlock : Lock"
                      :size="12"
                    />
                    {{
                      detail['OS-EXT-STS:locked_by']
                        ? 'Unlock Instance'
                        : 'Lock Instance'
                    }}
                  </button>

                  <!-- Rescue / Unrescue -->
                  <button
                    @click="
                      handleAction(
                        detail.status === 'RESCUE' || detail.status === 'Rescue'
                          ? 'unrescueInstance'
                          : 'rescueInstance'
                      )
                    "
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <component
                      :is="
                        detail.status === 'RESCUE' || detail.status === 'Rescue'
                          ? Check
                          : Activity
                      "
                      :size="12"
                    />
                    {{
                      detail.status === 'RESCUE' || detail.status === 'Rescue'
                        ? 'Unrescue VM'
                        : 'Rescue VM'
                    }}
                  </button>

                  <!-- Soft Reboot -->
                  <button
                    @click="handleAction('rebootInstance')"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw :size="12" /> Soft Reboot
                  </button>

                  <!-- Hard Reboot -->
                  <button
                    @click="handleAction('hardRebootInstance')"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw :size="12" class="text-amber-500 animate-spin" />
                    Hard Reboot
                  </button>

                  <hr class="border-zinc-800 col-span-2 my-1" />

                  <!-- Power On / Off -->
                  <button
                    v-if="
                      detail.status === 'SHUTOFF' || detail.status === 'Shutoff'
                    "
                    @click="handleAction('startInstance')"
                    class="flex items-center gap-2 px-3 py-2 bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Play :size="12" /> Power On
                  </button>

                  <button
                    v-else
                    @click="handleAction('stopInstance')"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-400 transition-colors cursor-pointer"
                  >
                    <Square :size="12" /> Shut Down
                  </button>

                  <!-- Pause / Resume -->
                  <button
                    @click="
                      handleAction(
                        detail.status === 'PAUSED' || detail.status === 'Paused'
                          ? 'unpauseInstance'
                          : 'pauseInstance'
                      )
                    "
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer"
                  >
                    <Pause :size="12" />
                    {{
                      detail.status === 'PAUSED' || detail.status === 'Paused'
                        ? 'Resume VM'
                        : 'Pause VM'
                    }}
                  </button>

                  <!-- Suspend / Resume (from suspend) -->
                  <button
                    @click="
                      handleAction(
                        detail.status === 'SUSPENDED' ||
                          detail.status === 'Suspended'
                          ? 'resumeInstance'
                          : 'suspendInstance'
                      )
                    "
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <Pause :size="12" class="text-purple-400" />
                    {{
                      detail.status === 'SUSPENDED' ||
                      detail.status === 'Suspended'
                        ? 'Resume Suspended'
                        : 'Suspend Instance'
                    }}
                  </button>

                  <!-- Shelve / Unshelve -->
                  <button
                    @click="
                      handleAction(
                        detail.status === 'SHELVED' ||
                          detail.status === 'SHELVED_OFFLOADED'
                          ? 'unshelveInstance'
                          : 'shelveInstance'
                      )
                    "
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <Layers :size="12" />
                    {{
                      detail.status === 'SHELVED' ||
                      detail.status === 'SHELVED_OFFLOADED'
                        ? 'Unshelve Instance'
                        : 'Shelve Instance'
                    }}
                  </button>

                  <!-- Rebuild VM -->
                  <button
                    @click="openRebuildModal"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <RefreshCw :size="12" /> Rebuild Image Configuration
                  </button>

                  <!-- Resize -->
                  <button
                    @click="openResizeModal"
                    class="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs text-zinc-300 transition-colors cursor-pointer col-span-2"
                  >
                    <Settings :size="12" /> Resize (Change Flavor)
                  </button>

                  <!-- Terminate VM -->
                  <button
                    @click="handleAction('terminateInstance')"
                    class="flex items-center gap-2 px-3 py-2 bg-red-950/20 border border-red-500/20 hover:border-red-500 hover:bg-red-500 hover:text-white text-red-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer col-span-2"
                  >
                    <Trash :size="12" /> Delete / Terminate Instance
                  </button>
                </div>
              </section>
            </div>
          </div>

          <!-- TAB 2: MONITORING -->
          <div v-if="activeModalTab === 'monitoring'" class="space-y-6">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div
                class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-3"
              >
                <div
                  class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  CPU Allocation
                </div>
                <div class="text-3xl font-black text-white font-mono">
                  {{ flavorInfo?.vcpus || 0 }}
                </div>
                <div class="text-[11px] text-zinc-500">
                  Allocated virtual cores
                </div>
              </div>

              <div
                class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-3"
              >
                <div
                  class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  CPU Usage
                </div>
                <div class="text-3xl font-black text-blue-400 font-mono">
                  {{
                    instanceMetrics?.cpuUtilizationPercent !== null &&
                    instanceMetrics?.cpuUtilizationPercent !== undefined
                      ? `${instanceMetrics.cpuUtilizationPercent}%`
                      : 'N/A'
                  }}
                </div>
                <div class="text-[11px] text-zinc-500">
                  {{
                    instanceMetrics?.source === 'gnocchi'
                      ? 'Live telemetry from Gnocchi'
                      : 'Telemetry unavailable, showing allocation only'
                  }}
                </div>
              </div>

              <div
                class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-3"
              >
                <div
                  class="text-xs font-semibold text-zinc-500 uppercase tracking-wider"
                >
                  Memory Usage
                </div>
                <div class="text-3xl font-black text-emerald-400 font-mono">
                  {{
                    instanceMetrics?.memoryUsedMb !== null &&
                    instanceMetrics?.memoryUsedMb !== undefined
                      ? `${instanceMetrics.memoryUsedMb} MB`
                      : 'N/A'
                  }}
                </div>
                <div class="text-[11px] text-zinc-500">
                  {{ flavorInfo?.ram || 0 }} MB allocated
                </div>
              </div>
            </div>

            <div
              class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-5"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3
                    class="text-sm font-bold text-white uppercase tracking-wider"
                  >
                    Allocated vs Actual
                  </h3>
                  <p class="text-xs text-zinc-500 mt-1">
                    This view uses Ceilometer/Gnocchi if your cloud exposes
                    telemetry, otherwise it falls back to allocation data.
                  </p>
                </div>
                <button
                  @click="refreshInstanceMetrics"
                  class="px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>

              <div
                v-if="metricsLoading"
                class="flex items-center gap-2 text-sm text-zinc-400"
              >
                <Loader class="animate-spin text-blue-500" :size="16" />
                Querying telemetry...
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3"
                >
                  <div
                    class="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500"
                  >
                    <span>CPU</span>
                    <span>{{ instanceMetrics?.source || 'allocation' }}</span>
                  </div>
                  <div class="flex items-end justify-between gap-4">
                    <div>
                      <div class="text-2xl font-black text-white font-mono">
                        {{ instanceMetrics?.cpuAllocatedCores || 0 }}
                      </div>
                      <div class="text-[11px] text-zinc-500">
                        Allocated cores
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-black text-blue-400 font-mono">
                        {{
                          instanceMetrics?.cpuUtilizationPercent !== null &&
                          instanceMetrics?.cpuUtilizationPercent !== undefined
                            ? `${instanceMetrics.cpuUtilizationPercent}%`
                            : 'N/A'
                        }}
                      </div>
                      <div class="text-[11px] text-zinc-500">Current load</div>
                    </div>
                  </div>
                </div>

                <div
                  class="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3"
                >
                  <div
                    class="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500"
                  >
                    <span>Memory</span>
                    <span>{{
                      instanceMetrics?.updatedAt
                        ? new Date(instanceMetrics.updatedAt).toLocaleString()
                        : 'Live'
                    }}</span>
                  </div>
                  <div class="flex items-end justify-between gap-4">
                    <div>
                      <div class="text-2xl font-black text-white font-mono">
                        {{
                          instanceMetrics?.memoryAllocatedMb ||
                          flavorInfo?.ram ||
                          0
                        }}
                        MB
                      </div>
                      <div class="text-[11px] text-zinc-500">Allocated</div>
                    </div>
                    <div class="text-right">
                      <div
                        class="text-2xl font-black text-emerald-400 font-mono"
                      >
                        {{
                          instanceMetrics?.memoryUsedMb !== null &&
                          instanceMetrics?.memoryUsedMb !== undefined
                            ? `${instanceMetrics.memoryUsedMb} MB`
                            : 'N/A'
                        }}
                      </div>
                      <div class="text-[11px] text-zinc-500">
                        Resident usage
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="flex items-center justify-between text-xs text-zinc-500"
              >
                <span
                  >Telemetry source:
                  {{ instanceMetrics?.source || 'unavailable' }}</span
                >
                <span>Auto refresh: 15s while open</span>
              </div>
            </div>
          </div>

          <!-- TAB 2: INTERFACES & STORAGE -->
          <div
            v-if="activeModalTab === 'networks'"
            class="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <!-- Left: Interfaces & Security Groups -->
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <h3
                  class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"
                >
                  <Network :size="16" class="text-zinc-500" /> Network
                  Interfaces
                </h3>
                <button
                  @click="showAttachInterfaceModal = true"
                  class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  + Attach Interface
                </button>
              </div>

              <div v-if="serverPorts.length > 0" class="space-y-4">
                <div
                  v-for="port in serverPorts"
                  :key="port.id"
                  class="bg-teal-900 border border-teal-800 rounded-xl overflow-hidden shadow-lg max-h-80 overflow-y-auto ports-scroll"
                >
                  <div
                    class="px-4 py-3 bg-zinc-800/40 border-b border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div
                        class="text-xs font-bold text-white flex items-center gap-1.5"
                      >
                        MAC:
                        <span class="font-mono text-zinc-400">{{
                          port.mac_address
                        }}</span>
                      </div>
                      <div class="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                        <span>Port ID: {{ port.id }}</span>
                        <CopyButton :text="port.id" class="p-0.5 border-0 bg-transparent scale-75" />
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <span
                        class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
                        :class="
                          isNetworkExternal(port.network_name)
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        "
                      >
                        {{
                          isNetworkExternal(port.network_name)
                            ? 'External'
                            : 'Internal'
                        }}
                      </span>
                      <button
                        @click="handleDetachInterface(port.id)"
                        class="text-zinc-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded transition-all cursor-pointer"
                        title="Detach Interface"
                      >
                        <Trash :size="12" />
                      </button>
                    </div>
                  </div>

                  <div class="p-4 space-y-3">
                    <!-- IPs -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div
                          class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5"
                        >
                          Fixed IPs (Internal)
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-for="ip in port.fixed_ips"
                            :key="ip.ip_address"
                            class="px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono text-blue-300"
                          >
                            {{ ip.ip_address }}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div
                          class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5"
                        >
                          Floating IP (External Access)
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                          <span
                            v-if="port.floating_ip"
                            class="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5"
                          >
                            <Globe :size="12" /> {{ port.floating_ip }}
                            <button
                              @click="
                                handleDisassociateFip(port.floating_ip_id)
                              "
                              class="text-zinc-500 hover:text-red-400 p-0.5 rounded cursor-pointer transition-colors"
                              title="Disassociate Floating IP"
                            >
                              <X :size="10" />
                            </button>
                          </span>
                          <span
                            v-else
                            class="text-xs text-zinc-650 italic flex items-center gap-1"
                          >
                            None Associated
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Security Groups inside Interface box -->
                    <div class="border-t border-zinc-800/60 pt-3 space-y-3">
                      <div
                        class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Shield :size="12" class="text-blue-400" /> Active
                        Security Groups
                      </div>

                      <div class="space-y-2">
                        <div
                          v-for="sgId in port.security_groups"
                          :key="sgId"
                          class="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-850/80 rounded-xl hover:border-zinc-700 transition-colors"
                        >
                          <div class="flex items-center gap-2.5">
                            <div
                              class="p-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg"
                            >
                              <Shield :size="14" />
                            </div>
                            <div>
                              <div class="text-xs font-bold text-zinc-200">
                                {{ getSgNameById(sgId) }}
                              </div>
                              <div class="text-[9px] text-zinc-500 font-mono">
                                ID: {{ sgId.substring(0, 8) }}...
                              </div>
                            </div>
                          </div>

                          <div class="flex items-center gap-2">
                            <button
                              @click="openManageRules(sgId)"
                              class="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-zinc-800 rounded-md text-[10px] font-semibold cursor-pointer transition-colors"
                            >
                              Manage Rules
                            </button>
                            <button
                              @click="removeSgFromPort(port.id, sgId)"
                              class="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md cursor-pointer transition-colors"
                              title="Remove Security Group"
                            >
                              <Trash :size="12" />
                            </button>
                          </div>
                        </div>

                        <!-- Dropdown to add SG -->
                        <div
                          class="flex gap-2 items-center bg-zinc-950/40 p-2 rounded-xl border border-zinc-850/60 mt-1"
                        >
                          <select
                            v-model="selectedSgToAdd[port.id]"
                            class="flex-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                          >
                            <option value="">
                              -- Associate Security Group --
                            </option>
                            <option
                              v-for="sg in getAvailableSgsForPort(port)"
                              :key="sg.id"
                              :value="sg.id"
                            >
                              {{ sg.name }}
                            </option>
                          </select>
                          <button
                            @click="addSgToPort(port.id, selectedSgToAdd[port.id]); selectedSgToAdd[port.id] = ''"
                            :disabled="!selectedSgToAdd[port.id]"
                            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="text-sm text-zinc-500 italic p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center"
              >
                No network interfaces attached.
              </div>
            </div>

            <!-- Right: Storage Volumes -->
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <h3
                  class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"
                >
                  <HardDrive :size="16" class="text-zinc-500" /> Block Storage
                  Volumes
                </h3>
                <button
                  @click="showAttachVolumeModal = true"
                  class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  + Attach Volume
                </button>
              </div>

              <div
                v-if="
                  detail['os-extended-volumes:volumes_attached']?.length > 0
                "
                class="space-y-3"
              >
                <div
                  v-for="vol in detail['os-extended-volumes:volumes_attached']"
                  :key="vol.id"
                  class="flex items-center justify-between p-3.5 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg"
                >
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="p-2 bg-zinc-950 rounded-lg border border-zinc-800 text-emerald-500"
                    >
                      <Database :size="14" />
                    </div>
                    <div class="min-w-0">
                      <div
                        class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider"
                      >
                        Volume ID
                      </div>
                      <div
                        class="text-xs text-zinc-300 font-mono truncate max-w-55 flex items-center gap-1.5"
                        :title="vol.id"
                      >
                        <span>{{ vol.id }}</span>
                        <CopyButton :text="vol.id" class="p-0.5 border-0 bg-transparent scale-75" />
                      </div>
                    </div>
                  </div>
                  <button
                    @click="handleDetachVolume(vol.id)"
                    class="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-850 rounded cursor-pointer"
                    title="Detach Volume"
                  >
                    <Trash :size="14" />
                  </button>
                </div>
              </div>
              <div
                v-else
                class="text-sm text-zinc-500 italic p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center"
              >
                No storage volumes attached.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-5 border-t border-zinc-800 bg-zinc-900/80 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg"
        >
          Close Details
        </button>
      </div>
    </div>

    <!-- OVERLAY SUB-MODALS -->

    <!-- Rename Modal -->
    <div
      v-if="showEditNameModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <h3 class="text-lg font-bold text-white">Rename Server</h3>
        <input
          v-model="newServerName"
          type="text"
          placeholder="New server name"
          class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 px-4 py-2 rounded text-zinc-200 outline-none font-mono text-sm"
        />
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="showEditNameModal = false"
            class="px-4 py-2 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitRename"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold cursor-pointer"
          >
            Save Rename
          </button>
        </div>
      </div>
    </div>

    <!-- Console Log Modal -->
    <div
      v-if="showConsoleLogModal"
      class="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div
          class="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50"
        >
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <Terminal :size="18" class="text-blue-400" /> Console Output Log
          </h3>
          <div class="flex items-center gap-3">
            <select
              v-model="consoleLogLines"
              @change="fetchConsoleLog"
              class="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded outline-none cursor-pointer"
            >
              <option :value="50">Last 50 lines</option>
              <option :value="100">Last 100 lines</option>
              <option :value="200">Last 200 lines</option>
              <option :value="500">Last 500 lines</option>
            </select>
            <button
              @click="showConsoleLogModal = false"
              class="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X :size="20" />
            </button>
          </div>
        </div>
        <div
          class="p-6 bg-zinc-950 font-mono text-xs text-zinc-300 overflow-y-auto flex-1 select-text selection:bg-blue-600/30"
        >
          <pre
            v-if="consoleLogText"
            class="whitespace-pre-wrap leading-relaxed"
            >{{ consoleLogText }}</pre>
          <div v-else class="text-zinc-650 italic">
            No output received from the hypervisor console.
          </div>
        </div>
        <div
          class="p-5 border-t border-zinc-800 bg-zinc-900/50 flex justify-end"
        >
          <button
            @click="showConsoleLogModal = false"
            class="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-sm cursor-pointer"
          >
            Close Log
          </button>
        </div>
      </div>
    </div>

    <!-- Attach Interface Modal -->
    <div
      v-if="showAttachInterfaceModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <h3 class="text-lg font-bold text-white">Attach Network Interface</h3>
        <div class="space-y-2">
          <label
            class="text-xs text-zinc-400 font-semibold uppercase tracking-wider"
            >Select Network</label
          >
          <select
            v-model="selectedNetworkToAttach"
            class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded text-zinc-200 outline-none cursor-pointer text-sm"
          >
            <option value="">-- Choose Network --</option>
            <option
              v-for="net in networkStore.networks"
              :key="net.id"
              :value="net.id"
            >
              {{ net.name }} (CIDR: {{ net.subnet }})
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="showAttachInterfaceModal = false"
            class="px-4 py-2 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleAttachInterface"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold cursor-pointer"
          >
            Attach Interface
          </button>
        </div>
      </div>
    </div>

    <!-- Attach Volume Modal -->
    <div
      v-if="showAttachVolumeModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <h3 class="text-lg font-bold text-white">
          Attach Block Storage Volume
        </h3>
        <div class="space-y-2">
          <label
            class="text-xs text-zinc-400 font-semibold uppercase tracking-wider"
            >Select Available Volume</label
          >
          <select
            v-model="selectedVolumeToAttach"
            class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded text-zinc-200 outline-none cursor-pointer text-sm"
          >
            <option value="">-- Choose Volume --</option>
            <option
              v-for="vol in availableVolumes"
              :key="vol.id"
              :value="vol.id"
            >
              {{ vol.name }} ({{ vol.size }}, Type: {{ vol.type }})
            </option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="showAttachVolumeModal = false"
            class="px-4 py-2 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleAttachVolume"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold cursor-pointer"
          >
            Attach Volume
          </button>
        </div>
      </div>
    </div>

    <!-- Associate Floating IP Modal -->
    <div
      v-if="showFipModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl"
      >
        <h3 class="text-lg font-bold text-white">Associate Floating IP</h3>

        <div class="space-y-3">
          <div class="space-y-1">
            <label
              class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
              >Select Floating IP</label
            >
            <select
              v-model="selectedFipId"
              class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded text-zinc-200 text-sm outline-none cursor-pointer"
            >
              <option value="">-- Choose IP Address --</option>
              <option
                v-for="fip in availableFloatingIps"
                :key="fip.id"
                :value="fip.id"
              >
                {{ fip.floating_ip_address }}
              </option>
            </select>
            <div
              v-if="availableFloatingIps.length === 0"
              class="text-[10px] text-zinc-500 mt-1"
            >
              No unassociated floating IPs found. Allocate FIPs in Network tab
              first.
            </div>
          </div>

          <div class="space-y-1">
            <label
              class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
              >Select Interface/Port</label
            >
            <select
              v-model="selectedPortForFip"
              class="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 px-3 py-2 rounded text-zinc-200 text-sm outline-none cursor-pointer"
            >
              <option value="">-- Choose VM Interface Port --</option>
              <option
                v-for="port in serverPorts"
                :key="port.id"
                :value="port.id"
              >
                Port ID: {{ port.id.substring(0, 8) }}... (IP:
                {{ port.fixed_ips?.[0]?.ip_address }})
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button
            @click="showFipModal = false"
            class="px-4 py-2 border border-zinc-800 rounded text-sm text-zinc-400 hover:text-white bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="handleAssociateFip"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold cursor-pointer"
          >
            Associate IP
          </button>
        </div>
      </div>
    </div>

    <!-- Security Rules Rules Editor Overlay Modal (Dynamic Rules Editing) -->
    <div
      v-if="editingSgGroup"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div
          class="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50"
        >
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <Shield :size="18" class="text-blue-400" />
            Edit Security Rules:
            <span class="text-zinc-400">{{ editingSgGroup.name }}</span>
          </h3>
          <button
            @click="editingSgGroup = null"
            class="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X :size="20" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto space-y-6 flex-1">
          <!-- Add New Rule Form -->
          <form
            @submit.prevent="handleAddRule"
            class="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4"
          >
            <div
              class="text-xs font-bold text-zinc-400 uppercase tracking-wider"
            >
              Add New Custom Firewall Rule
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div class="space-y-1">
                <label
                  class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
                  >Direction</label
                >
                <select
                  v-model="newRuleDirection"
                  class="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-2 rounded outline-none cursor-pointer"
                >
                  <option value="ingress">Inbound (Ingress)</option>
                  <option value="egress">Outbound (Egress)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label
                  class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
                  >Protocol</label
                >
                <select
                  v-model="newRuleProtocol"
                  class="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-2 rounded outline-none cursor-pointer"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                  <option value="icmp">ICMP</option>
                  <option value="any">Any Protocol</option>
                </select>
              </div>

              <div class="space-y-1">
                <label
                  class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
                  >Min Port</label
                >
                <input
                  v-model.number="newRulePortMin"
                  type="number"
                  placeholder="eg. 80"
                  class="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-2 rounded outline-none font-mono"
                />
              </div>

              <div class="space-y-1">
                <label
                  class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
                  >Max Port</label
                >
                <input
                  v-model.number="newRulePortMax"
                  type="number"
                  placeholder="eg. 80"
                  class="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-2 rounded outline-none font-mono"
                />
              </div>

              <div class="space-y-1">
                <label
                  class="text-[10px] text-zinc-500 font-bold uppercase tracking-wider"
                  >Source CIDR</label
                >
                <input
                  v-model="newRuleRemoteIp"
                  type="text"
                  placeholder="0.0.0.0/0"
                  class="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2.5 py-2 rounded outline-none font-mono"
                />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded font-semibold transition-colors cursor-pointer"
              >
                + Inject Firewall Rule
              </button>
            </div>
          </form>

          <!-- Rules list inside group -->
          <div
            class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div
              class="px-4 py-2.5 bg-zinc-850/40 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider"
            >
              Active Security Group Rules
            </div>

            <div class="divide-y divide-zinc-800/80">
              <div
                v-for="rule in editingSgGroup.security_group_rules"
                :key="rule.id"
                class="p-3.5 flex items-center justify-between text-xs hover:bg-zinc-950/20 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                    :class="
                      rule.direction === 'ingress'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    "
                  >
                    {{ rule.direction === 'ingress' ? 'Inbound' : 'Outbound' }}
                  </span>

                  <span
                    class="text-zinc-200 font-semibold uppercase font-mono"
                    >{{ rule.protocol || 'Any Proto' }}</span
                  >
                  <span class="text-zinc-500">&bull;</span>
                  <span class="text-zinc-300 font-mono">{{
                    formatRulePorts(rule)
                  }}</span>
                  <span class="text-zinc-500">&bull;</span>
                  <span class="text-zinc-400 font-mono"
                    >CIDR: {{ formatRuleRemote(rule) }}</span
                  >
                </div>

                <button
                  @click="handleDeleteRule(rule.id)"
                  class="text-zinc-500 hover:text-red-400 p-1 hover:bg-zinc-850 rounded cursor-pointer"
                  title="Remove Rule"
                >
                  <Trash :size="12" />
                </button>
              </div>

              <div
                v-if="
                  !editingSgGroup.security_group_rules ||
                  editingSgGroup.security_group_rules.length === 0
                "
                class="p-6 text-center text-zinc-500 italic"
              >
                No rules configured in this security group. Default rule rejects
                all traffic.
              </div>
            </div>
          </div>
        </div>

        <div
          class="p-5 border-t border-zinc-800 bg-zinc-900/50 flex justify-end"
        >
          <button
            @click="editingSgGroup = null"
            class="px-4 py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded text-sm cursor-pointer"
          >
            Done Editing
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import {
  Server,
  X,
  Loader,
  AlertCircle,
  Network,
  Shield,
  HardDrive,
  Database,
  Info,
  Cpu,
  Settings,
  Play,
  Square,
  Pause,
  RefreshCw,
  Trash,
  Key,
  FileText,
  Check,
  Lock,
  Unlock,
  Activity,
  Layers,
  Globe,
  Terminal,
} from 'lucide-vue-next'
import { computeService } from '@/services/compute.service'
import {
  monitoringService,
  type InstanceMetricSummary,
} from '@/services/monitoring.service'
import { useComputeStore } from '@/stores/compute'
import { useNetworkStore } from '@/stores/network'
import { useStorageStore } from '@/stores/storage'
import { networkService } from '@/services/network.service'
import DistroLogo from './DistroLogo.vue'
import CopyButton from '@/components/CopyButton.vue'

const computeStore = useComputeStore()
const networkStore = useNetworkStore()
const storageStore = useStorageStore()

const props = defineProps<{
  show: boolean
  id: string
}>()

const emit = defineEmits(['close'])

const loading = ref(false)
const error = ref('')
const detail = ref<any>(null)
const instanceMetrics = ref<InstanceMetricSummary | null>(null)
const metricsLoading = ref(false)
let metricsRefreshTimer: ReturnType<typeof setInterval> | null = null

// Extra loaded data from Neutron / Cinder
const allSecurityGroups = ref<any[]>([])
const serverPorts = ref<any[]>([])
const selectedSgToAdd = ref<Record<string, string>>({}) // map of portId -> selectedSgId

// Tabs: 'overview' | 'monitoring' | 'networks'
const activeModalTab = ref<'overview' | 'monitoring' | 'networks'>('overview')

// Dynamic sub-modal/overlay controls
const showEditNameModal = ref(false)
const newServerName = ref('')

const showConsoleLogModal = ref(false)
const consoleLogText = ref('')
const consoleLogLines = ref(100)

const showAttachInterfaceModal = ref(false)
const selectedNetworkToAttach = ref('')

const showAttachVolumeModal = ref(false)
const selectedVolumeToAttach = ref('')

const showFipModal = ref(false)
const allFloatingIps = ref<any[]>([])
const selectedFipId = ref('')
const selectedPortForFip = ref('')

// Rule Editor Overlay Controls
const editingSgGroup = ref<any>(null)
const newRuleDirection = ref<'ingress' | 'egress'>('ingress')
const newRuleProtocol = ref('tcp')
const newRulePortMin = ref<number | null>(null)
const newRulePortMax = ref<number | null>(null)
const newRuleRemoteIp = ref('0.0.0.0/0')

// Map numeric power state to friendly labels
function mapPowerState(state: number | string): string {
  const s = Number(state)
  switch (s) {
    case 1:
      return 'Running'
    case 3:
      return 'Paused'
    case 4:
      return 'Shutdown'
    case 6:
      return 'Crashed'
    case 7:
      return 'Suspended'
    default:
      return 'No State'
  }
}

// Watch modal trigger
watch(
  () => props.show,
  async (newVal) => {
    if (newVal && props.id) {
      loading.value = true
      error.value = ''
      detail.value = null
      instanceMetrics.value = null
      allSecurityGroups.value = []
      serverPorts.value = []
      selectedSgToAdd.value = {}
      activeModalTab.value = 'overview'
      stopMetricsRefresh()

      // Close overlays
      showEditNameModal.value = false
      showConsoleLogModal.value = false
      showAttachInterfaceModal.value = false
      showAttachVolumeModal.value = false
      showFipModal.value = false
      editingSgGroup.value = null

      try {
        await refreshAllData()
      } catch (err: any) {
        error.value = err.message || 'Failed to fetch server details.'
      } finally {
        loading.value = false
      }
      startMetricsRefresh()
    } else {
      stopMetricsRefresh()
    }
  }
)

const storeInstance = computed(() => {
  return computeStore.instances.find((i) => i.id === props.id)
})

watch(
  () => storeInstance.value?.status,
  async (newStatus) => {
    if (newStatus && detail.value) {
      detail.value.status = newStatus.toUpperCase()

      const isStable = [
        'Active',
        'Shutoff',
        'Paused',
        'Suspended',
        'Error',
      ].includes(newStatus)
      if (isStable) {
        try {
          await refreshAllData()
        } catch (e) {
          console.error(
            'Failed to auto-refresh modal details on status change',
            e
          )
        }
      }
    }
  }
)

// Concurrently refresh server info, networks, available volumes, ports, security groups
async function refreshAllData() {
  try {
    await Promise.all([
      (async () => {
        detail.value = await computeService.getInstanceDetail(props.id)
      })(),
      networkStore.loadNetworks(),
      storageStore.loadVolumes(),
      fetchExtraNeutronData(),
    ])
    await refreshInstanceMetrics()
  } catch (e) {
    console.error('Failed to sync server details data', e)
    throw e
  }
}

async function refreshInstanceMetrics() {
  if (!detail.value?.flavor) {
    instanceMetrics.value = null
    return
  }

  metricsLoading.value = true
  try {
    instanceMetrics.value = await monitoringService.getInstanceMetrics(
      props.id,
      {
        vcpus: detail.value.flavor.vcpus || 0,
        ram: detail.value.flavor.ram || 0,
        disk: detail.value.flavor.disk || 0,
      }
    )
  } catch (err) {
    console.error('Failed to load instance metrics', err)
    instanceMetrics.value = null
  } finally {
    metricsLoading.value = false
  }
}

function startMetricsRefresh() {
  stopMetricsRefresh()
  if (!props.show || !props.id) return

  metricsRefreshTimer = setInterval(() => {
    refreshInstanceMetrics().catch((err) => {
      console.error('Background instance metric refresh failed', err)
    })
  }, 15000)
}

function stopMetricsRefresh() {
  if (metricsRefreshTimer) {
    clearInterval(metricsRefreshTimer)
    metricsRefreshTimer = null
  }
}

// Fetch Neutron security groups & interface port attachments & floating IPs
async function fetchExtraNeutronData() {
  try {
    const [sgs, ports, fips] = await Promise.all([
      networkService.getSecurityGroups(),
      networkService.getPortsForServer(props.id),
      networkService.getFloatingIps(),
    ])

    // Enrich ports with network names and associated floating IPs
    serverPorts.value = ports.map((p: any) => {
      const matchedNet = networkStore.networks.find(
        (n) => n.id === p.network_id || n.name === p.network_id
      )
      const matchedFip = fips.find((f: any) => f.port_id === p.id)
      return {
        ...p,
        network_name: matchedNet ? matchedNet.name : p.network_id || 'private',
        floating_ip: matchedFip ? matchedFip.floating_ip_address : null,
        floating_ip_id: matchedFip ? matchedFip.id : null,
      }
    })

    allSecurityGroups.value = sgs
  } catch (err) {
    console.error(
      'Failed to fetch security groups or port details for server',
      err
    )
  }
}

// Check if a network is external
function isNetworkExternal(netName: string): boolean {
  const found = networkStore.networks.find((n) => n.name === netName)
  return found ? found.external : false
}

// Get Name of Security Group from uuid
function getSgNameById(id: string): string {
  const found = allSecurityGroups.value.find((sg) => sg.id === id)
  return found ? found.name : id.substring(0, 8)
}

// Filter security groups that are NOT already associated with a port
function getAvailableSgsForPort(port: any) {
  const attachedIds = port.security_groups || []
  return allSecurityGroups.value.filter((sg) => !attachedIds.includes(sg.id))
}

// Add a security group to a port
async function addSgToPort(portId: string, sgId?: string) {
  if (!sgId) return
  const port = serverPorts.value.find((p) => p.id === portId)
  if (!port) return

  if (port.security_groups.includes(sgId)) return

  const updatedSgs = [...port.security_groups, sgId]
  try {
    loading.value = true
    await networkService.updatePortSecurityGroups(portId, updatedSgs)
    port.security_groups = updatedSgs

    // Sync details
    await refreshAllData()
  } catch (err: any) {
    alert(`Failed to associate security group: ${err.message || err}`)
  } finally {
    loading.value = false
  }
}

// Detach security group from a port
async function removeSgFromPort(portId: string, sgId: string) {
  const port = serverPorts.value.find((p) => p.id === portId)
  if (!port) return

  const updatedSgs = port.security_groups.filter((id: string) => id !== sgId)
  try {
    loading.value = true
    await networkService.updatePortSecurityGroups(portId, updatedSgs)
    port.security_groups = updatedSgs

    // Sync details
    await refreshAllData()
  } catch (err: any) {
    alert(`Failed to detach security group: ${err.message || err}`)
  } finally {
    loading.value = false
  }
}

// open Rules editor overlay
function openManageRules(sgId: string) {
  const found = allSecurityGroups.value.find((sg) => sg.id === sgId)
  if (found) {
    editingSgGroup.value = found
    newRuleDirection.value = 'ingress'
    newRuleProtocol.value = 'tcp'
    newRulePortMin.value = null
    newRulePortMax.value = null
    newRuleRemoteIp.value = '0.0.0.0/0'
  } else {
    alert('Security Group information could not be resolved from API.')
  }
}

// Add rule inside group
async function handleAddRule() {
  if (!editingSgGroup.value) return

  const payload = {
    security_group_id: editingSgGroup.value.id,
    direction: newRuleDirection.value,
    ethertype: 'IPv4',
    protocol: newRuleProtocol.value === 'any' ? null : newRuleProtocol.value,
    port_range_min: newRulePortMin.value || null,
    port_range_max: newRulePortMax.value || null,
    remote_ip_prefix: newRuleRemoteIp.value || null,
  }

  try {
    loading.value = true
    await networkService.createSecurityGroupRule(payload)

    // Refresh security groups list
    const sgs = await networkService.getSecurityGroups()
    allSecurityGroups.value = sgs

    const updatedGroup = sgs.find((sg) => sg.id === editingSgGroup.value.id)
    if (updatedGroup) editingSgGroup.value = updatedGroup

    // Reset inputs
    newRulePortMin.value = null
    newRulePortMax.value = null
  } catch (err: any) {
    alert('Failed to add security group rule: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Delete rule inside group
async function handleDeleteRule(ruleId: string) {
  if (!confirm('Are you sure you want to delete this rule?')) return
  try {
    loading.value = true
    await networkService.deleteSecurityGroupRule(ruleId)

    // Refresh security groups list
    const sgs = await networkService.getSecurityGroups()
    allSecurityGroups.value = sgs

    const updatedGroup = sgs.find((sg) => sg.id === editingSgGroup.value.id)
    if (updatedGroup) editingSgGroup.value = updatedGroup
  } catch (err: any) {
    alert('Failed to delete rule: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Attach Network Interface
async function handleAttachInterface() {
  if (!selectedNetworkToAttach.value) return
  try {
    loading.value = true
    await computeService.attachInterface(
      props.id,
      selectedNetworkToAttach.value
    )
    showAttachInterfaceModal.value = false
    selectedNetworkToAttach.value = ''
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to attach interface: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Detach Network Interface
async function handleDetachInterface(portId: string) {
  if (!confirm('Are you sure you want to detach this interface?')) return
  try {
    loading.value = true
    await computeService.detachInterface(props.id, portId)
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to detach interface: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Attach Block Storage Volume
async function handleAttachVolume() {
  if (!selectedVolumeToAttach.value) return
  try {
    loading.value = true
    await computeService.attachVolume(props.id, selectedVolumeToAttach.value)
    showAttachVolumeModal.value = false
    selectedVolumeToAttach.value = ''
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to attach volume: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Detach Volume
async function handleDetachVolume(volumeId: string) {
  if (!confirm('Are you sure you want to detach this volume?')) return
  try {
    loading.value = true
    await computeService.detachVolume(props.id, volumeId)
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to detach volume: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Floating IP Methods
async function openFipModal() {
  try {
    loading.value = true
    allFloatingIps.value = await networkService.getFloatingIps()
    showFipModal.value = true
  } catch (err: any) {
    alert('Failed to load floating IPs: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

const availableFloatingIps = computed(() => {
  return allFloatingIps.value.filter((fip) => !fip.port_id)
})

async function handleAssociateFip() {
  if (!selectedFipId.value || !selectedPortForFip.value) return
  try {
    loading.value = true
    await networkService.associateFloatingIp(
      selectedFipId.value,
      selectedPortForFip.value
    )
    showFipModal.value = false
    selectedFipId.value = ''
    selectedPortForFip.value = ''
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to associate floating IP: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

async function handleDisassociateFip(fipId: string) {
  if (!confirm('Are you sure you want to disassociate this Floating IP?'))
    return
  try {
    loading.value = true
    await networkService.associateFloatingIp(fipId, null)
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to disassociate floating IP: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// VNC & Logs Methods
async function openVncConsole() {
  try {
    loading.value = true
    const url = await computeService.getVncConsole(props.id)
    if (url) {
      window.open(url, '_blank')
    } else {
      alert('VNC console URL was not returned by OpenStack.')
    }
  } catch (err: any) {
    alert('Failed to get VNC console: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

async function fetchConsoleLog() {
  try {
    loading.value = true
    const log = await computeService.getConsoleLog(
      props.id,
      consoleLogLines.value
    )
    consoleLogText.value = log
    showConsoleLogModal.value = true
  } catch (err: any) {
    alert('Failed to fetch console logs: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Lock / Unlock toggle
async function toggleLock() {
  try {
    loading.value = true
    const isLocked = detail.value['OS-EXT-STS:locked_by'] !== null
    if (isLocked) {
      await computeStore.unlockInstance(props.id)
      alert('Instance unlocked.')
    } else {
      await computeStore.lockInstance(props.id)
      alert('Instance locked.')
    }
    await refreshAllData()
  } catch (err: any) {
    alert('Failed to change lock state: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Rename Modals
function openRenameModal() {
  newServerName.value = detail.value.name || ''
  showEditNameModal.value = true
}

async function submitRename() {
  if (!newServerName.value.trim()) return
  try {
    loading.value = true
    await computeService.renameServer(props.id, newServerName.value.trim())
    detail.value.name = newServerName.value.trim()
    showEditNameModal.value = false
    computeStore.invalidateCache()
    await computeStore.loadAllComputeData()
  } catch (err: any) {
    alert('Failed to rename server: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}

// Generic store lifecycle actions handler
async function handleAction(actionName: string) {
  if (actionName === 'terminateInstance') {
    if (
      !confirm(
        'Are you sure you want to permanently terminate this instance? This cannot be undone.'
      )
    )
      return
    try {
      loading.value = true
      await computeStore.terminateInstance(props.id)
      // Close details modal since instance is deleted
      emit('close')
    } catch (err: any) {
      alert('Failed to terminate: ' + (err.message || err))
    } finally {
      loading.value = false
    }
    return
  }

  try {
    loading.value = true
    const storeAction = (computeStore as any)[actionName]
    if (typeof storeAction === 'function') {
      await storeAction(props.id)
    }
    // Refresh modal info
    setTimeout(async () => {
      await refreshAllData()
    }, 1000)
  } catch (err: any) {
    alert(`Failed to perform action ${actionName}: ` + (err.message || err))
  } finally {
    loading.value = false
  }
}

function openResizeModal() {
  const nextFlav =
    computeStore.flavors.find((f) => f.name !== flavorInfo.value?.name)?.name ||
    flavorInfo.value?.name
  if (confirm(`Do you want to resize VM to ${nextFlav}?`)) {
    handleActionResize(nextFlav)
  }
}

async function handleActionResize(flavName: string) {
  try {
    loading.value = true
    await computeStore.resizeInstance(props.id, flavName)
    setTimeout(async () => {
      await refreshAllData()
    }, 1000)
  } catch (e: any) {
    alert('Failed to resize: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}

function openRebuildModal() {
  const nextImg =
    computeStore.images.find((i) => i.name !== imageInfo.value?.name)?.name ||
    imageInfo.value?.name
  if (confirm(`Do you want to rebuild VM using image ${nextImg}?`)) {
    handleActionRebuild(nextImg)
  }
}

async function handleActionRebuild(imgName: string) {
  try {
    loading.value = true
    await computeStore.rebuildInstance(props.id, imgName)
    setTimeout(async () => {
      await refreshAllData()
    }, 1000)
  } catch (e: any) {
    alert('Failed to rebuild: ' + (e.message || e))
  } finally {
    loading.value = false
  }
}

// Available volumes computed property
const availableVolumes = computed(() => {
  return storageStore.volumes.filter((v) => v.status === 'Available')
})

// Flavor info resolving
const flavorInfo = computed(() => {
  if (!detail.value || !detail.value.flavor) return null
  const flavId = detail.value.flavor.id
  const found = computeStore.flavors.find((f) => f.id === flavId)
  if (found) return found
  return {
    name: detail.value.flavor.name || 'Custom / Unknown',
    vcpus: detail.value.flavor.vcpus || 'N/A',
    ram: detail.value.flavor.ram || 'N/A',
    disk: detail.value.flavor.disk || 'N/A',
  }
})

// Image info resolving
const imageInfo = computed(() => {
  if (!detail.value || !detail.value.image) return null
  const imgId = detail.value.image.id
  const found = computeStore.images.find((i) => i.id === imgId)
  if (found) return found
  return {
    name: detail.value.image.name || 'Custom / Unknown',
  }
})

// Formatting helpers for SG Rules list
function formatRulePorts(rule: any): string {
  if (rule.port_range_min === null && rule.port_range_max === null) {
    return 'All Ports'
  }
  if (rule.port_range_min === rule.port_range_max) {
    return `Port ${rule.port_range_min}`
  }
  return `Ports ${rule.port_range_min} - ${rule.port_range_max}`
}

function formatRuleRemote(rule: any): string {
  if (rule.remote_ip_prefix) {
    return rule.remote_ip_prefix
  }
  if (rule.remote_group_id) {
    const matchedSg = allSecurityGroups.value.find(
      (sg) => sg.id === rule.remote_group_id
    )
    return matchedSg
      ? `SG: ${matchedSg.name}`
      : `SG: ${rule.remote_group_id.substring(0, 8)}...`
  }
  return 'Anywhere (0.0.0.0/0)'
}

const statusBannerClass = computed(() => {
  if (!detail.value) return ''
  const status = detail.value.status?.toUpperCase()
  if (status === 'ACTIVE')
    return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  if (status === 'SHUTOFF') return 'bg-zinc-800 border-zinc-700 text-zinc-400'
  if (status === 'ERROR') return 'bg-red-500/10 border-red-500/20 text-red-400'
  return 'bg-blue-500/10 border-blue-500/20 text-blue-400'
})

const statusBulletClass = computed(() => {
  if (!detail.value) return ''
  const status = detail.value.status?.toUpperCase()
  if (status === 'ACTIVE') return 'bg-emerald-500'
  if (status === 'SHUTOFF') return 'bg-zinc-500'
  if (status === 'ERROR') return 'bg-red-500'
  return 'bg-blue-500'
})

onBeforeUnmount(() => {
  stopMetricsRefresh()
})
</script>
