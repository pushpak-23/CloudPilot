<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent flex items-center gap-3">
          <HardDrive :style="{ color: 'var(--accent)' }" :size="32" /> Block Storage Space
        </h1>
        <p class="text-zinc-400 mt-1 max-w-3xl">
          Provision storage pools, trigger snapshots, and maintain volume backups powered by Cinder block storage.
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="btn-primary"
      >
        <span>+</span> Create Volume
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Volumes</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">
            {{ storageStore.totalVolumesCount }}
          </div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <HardDrive :size="20" />
        </div>
      </div>
      
      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Volume Snapshots</div>
          <div class="text-3xl font-extrabold mt-1.5 text-indigo-400">
            {{ storageStore.snapshots.length }}
          </div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-indigo-500/10 border-indigo-500/20">
          <Camera :size="20" class="text-indigo-400" />
        </div>
      </div>

      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Volume Backups</div>
          <div class="text-3xl font-extrabold mt-1.5 text-emerald-400">
            {{ storageStore.backups.length }}
          </div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-emerald-500/10 border-emerald-500/20">
          <Archive :size="20" class="text-emerald-400" />
        </div>
      </div>

      <div class="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div class="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Allocated Capacity</div>
          <div class="text-3xl font-extrabold mt-1.5 text-white">
            {{ (storageStore.totalAllocatedGb / 1024).toFixed(1) }} TB
          </div>
        </div>
        <div class="p-3 bg-zinc-950/60 border border-zinc-850 rounded-lg text-zinc-400">
          <Database :size="20" />
        </div>
      </div>
    </div>

    <!-- Quota progress indicator -->
    <div class="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 space-y-2.5">
      <div class="flex justify-between items-center text-sm font-semibold">
        <span class="text-zinc-400">Ceph Pool Storage Quota</span>
        <span class="text-white">
          {{ (storageStore.totalAllocatedGb / 1024).toFixed(2) }} TB Allocated / 10.0 TB Max Limit
        </span>
      </div>
      <div class="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-850 flex p-0.5">
        <div
          class="h-full rounded-full transition-all duration-1000"
          :style="{ width: `${Math.min((storageStore.totalAllocatedGb / (10 * 1024)) * 100, 100)}%`, backgroundColor: 'var(--accent)' }"
        ></div>
      </div>
      <div class="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
        <span>Current usage: {{ ((storageStore.totalAllocatedGb / (10 * 1024)) * 100).toFixed(1) }}%</span>
        <span>Remaining: {{ Math.max(10 - storageStore.totalAllocatedGb / 1024, 0).toFixed(2) }} TB available</span>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="flex border-b border-zinc-800 bg-zinc-900/10 rounded-xl p-1.5 max-w-md select-none">
      <button
        v-for="tab in ['volumes', 'snapshots', 'backups']"
        :key="tab"
        @click="activeTab = tab"
        class="flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg transition-all capitalize cursor-pointer"
        :class="activeTab === tab ? 'text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'"
        :style="activeTab === tab ? { backgroundColor: 'var(--accent)' } : {}"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Volumes Tab -->
    <div v-if="activeTab === 'volumes'" class="space-y-4">
      <!-- Bulk Operations Bar -->
      <div v-if="selectedVolumeIds.length > 0" class="flex items-center justify-between gap-4 p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-in slide-in-from-top-2 duration-200">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-blue-400">{{ selectedVolumeIds.length }} volumes selected</span>
        </div>
        <button
          @click="handleBulkDeleteVolumes"
          class="btn-table-danger py-1.5 px-3 rounded-lg"
        >
          Bulk Delete
        </button>
      </div>

      <div class="bg-zinc-950/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-200">
        <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
          <h2 class="font-semibold text-lg text-white">Storage Volumes</h2>
          <input
            v-model="searchQuery"
            placeholder="Filter volumes..."
            class="form-input sm:w-64"
          />
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
                <th class="p-4 w-10">
                  <input
                    type="checkbox"
                    :checked="isAllVolumesSelected"
                    @change="toggleSelectAllVolumes"
                    class="custom-checkbox"
                  />
                </th>
                <th class="p-4">Volume Name</th>
                <th class="p-4">Status</th>
                <th class="p-4">Size</th>
                <th class="p-4">Ceph Backend Pool</th>
                <th class="p-4">Attached Resource</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-850 text-sm">
              <tr v-if="storageStore.loading">
                <td colspan="7" class="p-8 text-center text-zinc-500">
                  <Loader class="animate-spin inline-block mr-2" :size="16" /> Loading volumes from Cinder API...
                </td>
              </tr>
              <tr v-else-if="filteredVolumes.length === 0">
                <td colspan="7" class="p-8 text-center text-zinc-500">
                  No storage volumes found.
                </td>
              </tr>
              <tr
                v-for="vol in filteredVolumes"
                :key="vol.id"
                class="hover:bg-zinc-900/30 transition-colors cursor-pointer"
                @click="openDetails(vol)"
              >
                <td class="p-4 w-10" @click.stop>
                  <input
                    type="checkbox"
                    :value="vol.id"
                    v-model="selectedVolumeIds"
                    class="custom-checkbox"
                  />
                </td>
                <td class="p-4 font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  {{ vol.name }}
                </td>
                <td class="p-4">
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border" :class="vol.statusClass">
                    <span class="w-1.5 h-1.5 rounded-full" :class="vol.bulletClass"></span>
                    {{ vol.status }}
                  </span>
                </td>
                <td class="p-4 font-mono text-zinc-300">{{ vol.size }}</td>
                <td class="p-4 text-zinc-400 font-mono text-xs">{{ vol.type }}</td>
                <td class="p-4 text-zinc-400">
                  <span v-if="vol.attachedTo && vol.attachedTo !== 'None (Unattached)'" class="text-blue-400 flex items-center gap-1.5">
                    <Server :size="12" /> {{ getAttachedVMName(vol.attachedTo) }}
                  </span>
                  <span v-else class="text-zinc-650 italic">Unattached</span>
                </td>
                <td class="p-4 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-2">
                    <button
                      @click="triggerCreateSnapshot(vol)"
                      class="btn-table"
                    >
                      Snapshot
                    </button>
                    <button
                      @click="triggerCreateBackup(vol)"
                      class="btn-table"
                    >
                      Backup
                    </button>
                    <button
                      @click="openDetails(vol)"
                      class="btn-table"
                    >
                      Manage
                    </button>
                    <button
                      @click="handleDelete(vol)"
                      class="btn-table-danger"
                    >
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

    <!-- Snapshots Tab -->
    <div v-if="activeTab === 'snapshots'" class="bg-zinc-955/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-200">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">Volume Snapshots</h2>
        <input
          v-model="snapshotSearchQuery"
          placeholder="Filter snapshots..."
          class="form-input sm:w-64"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
              <th class="p-4">Snapshot Name</th>
              <th class="p-4">Source Volume</th>
              <th class="p-4">Status</th>
              <th class="p-4">Size</th>
              <th class="p-4">Created At</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="filteredSnapshots.length === 0">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                No volume snapshots found.
              </td>
            </tr>
            <tr v-for="snap in filteredSnapshots" :key="snap.id" class="hover:bg-zinc-900/30 transition-colors">
              <td class="p-4 font-semibold text-white">
                <div>{{ snap.name }}</div>
                <div class="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <span>ID: {{ snap.id.substring(0, 10) }}...</span>
                  <CopyButton :text="snap.id" class="p-0.5 border-0 bg-transparent scale-75" />
                </div>
              </td>
              <td class="p-4 text-zinc-300 font-mono text-xs">
                {{ getVolumeName(snap.volumeId) }}
              </td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/5 text-blue-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {{ snap.status }}
                </span>
              </td>
              <td class="p-4 font-mono text-zinc-300">{{ snap.size }} GB</td>
              <td class="p-4 font-mono text-zinc-400 text-xs">{{ formatDate(snap.createdAt) }}</td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="handleRestoreSnapshot(snap)"
                    class="btn-table"
                  >
                    Restore onto Volume
                  </button>
                  <button
                    @click="handleDeleteSnapshot(snap)"
                    class="btn-table-danger"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Backups Tab -->
    <div v-if="activeTab === 'backups'" class="bg-zinc-955/40 border border-zinc-800 rounded-xl overflow-hidden shadow-xl animate-in fade-in duration-200">
      <div class="p-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/10">
        <h2 class="font-semibold text-lg text-white">Volume Backups</h2>
        <input
          v-model="backupSearchQuery"
          placeholder="Filter backups..."
          class="form-input sm:w-64"
        />
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider bg-zinc-900/40 select-none">
              <th class="p-4">Backup Name</th>
              <th class="p-4">Source Volume</th>
              <th class="p-4">Status</th>
              <th class="p-4">Size</th>
              <th class="p-4">Created At</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-850 text-sm">
            <tr v-if="filteredBackups.length === 0">
              <td colspan="6" class="p-8 text-center text-zinc-500">
                No volume backups found.
              </td>
            </tr>
            <tr v-for="bk in filteredBackups" :key="bk.id" class="hover:bg-zinc-900/30 transition-colors">
              <td class="p-4 font-semibold text-white">
                <div>{{ bk.name }}</div>
                <div class="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1.5">
                  <span>ID: {{ bk.id.substring(0, 10) }}...</span>
                  <CopyButton :text="bk.id" class="p-0.5 border-0 bg-transparent scale-75" />
                </div>
              </td>
              <td class="p-4 text-zinc-300 font-mono text-xs">
                {{ getVolumeName(bk.volumeId) }}
              </td>
              <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/5 text-blue-400">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {{ bk.status }}
                </span>
              </td>
              <td class="p-4 font-mono text-zinc-300">{{ bk.size }} GB</td>
              <td class="p-4 font-mono text-zinc-400 text-xs">{{ formatDate(bk.createdAt) }}</td>
              <td class="p-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="triggerRestoreBackup(bk)"
                    class="btn-table"
                  >
                    Restore Backup
                  </button>
                  <button
                    @click="handleDeleteBackup(bk)"
                    class="btn-table-danger"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Volume Dialog Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      @click.self="showCreateModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl overflow-hidden p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <HardDrive class="text-blue-500" :size="20" /> Create Block Storage Volume
        </h2>
        <div class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Volume Name</label>
            <input
              v-model="newVolName"
              placeholder="e.g., vol-data-store"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-650"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Size (GB)</label>
              <input
                type="number"
                v-model.number="newVolSize"
                min="1"
                class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Ceph Pool / Type</label>
              <select
                v-model="newVolType"
                class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="__default__">-- Standard/Default Type --</option>
                <option v-for="t in storageStore.volumeTypes" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
            </div>
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
            @click="submitCreate"
            :disabled="!newVolName.trim() || newVolSize < 1"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Create Volume
          </button>
        </div>
      </div>
    </div>

    <!-- Create Snapshot Modal -->
    <div
      v-if="showSnapshotModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-sm"
      @click.self="showSnapshotModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Camera class="text-indigo-400" :size="20" /> Create Volume Snapshot
        </h2>
        <div class="space-y-4">
          <p class="text-xs text-zinc-400">
            Capturing state for volume: <span class="font-mono text-zinc-200">{{ snapshotTargetVolume?.name }}</span>
          </p>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Snapshot Name</label>
            <input
              v-model="newSnapshotName"
              placeholder="e.g., snap-vol-backup"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Description</label>
            <textarea
              v-model="newSnapshotDesc"
              rows="3"
              placeholder="Optional notes..."
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showSnapshotModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitCreateSnapshot"
            :disabled="!newSnapshotName.trim()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Trigger Snapshot
          </button>
        </div>
      </div>
    </div>

    <!-- Create Backup Modal -->
    <div
      v-if="showBackupModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-sm"
      @click.self="showBackupModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Archive class="text-emerald-400" :size="20" /> Create Volume Backup
        </h2>
        <div class="space-y-4">
          <p class="text-xs text-zinc-400">
            Backing up volume: <span class="font-mono text-zinc-200">{{ backupTargetVolume?.name }}</span>
          </p>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Backup Name</label>
            <input
              v-model="newBackupName"
              placeholder="e.g., backup-nightly-vol"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Description</label>
            <textarea
              v-model="newBackupDesc"
              rows="3"
              placeholder="Optional notes..."
              class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            ></textarea>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showBackupModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitCreateBackup"
            :disabled="!newBackupName.trim()"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Backup Volume
          </button>
        </div>
      </div>
    </div>

    <!-- Restore Backup Modal -->
    <div
      v-if="showRestoreModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-sm"
      @click.self="showRestoreModal = false"
    >
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
        <h2 class="text-xl font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <RotateCcw class="text-emerald-400" :size="20" /> Restore Backup Catalog
        </h2>
        <div class="space-y-4">
          <p class="text-xs text-zinc-400">
            Restoring backup: <span class="font-mono text-zinc-200">{{ restoreTargetBackup?.name }} ({{ restoreTargetBackup?.size }} GB)</span>
          </p>
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Target Restore Volume</label>
            <select
              v-model="restoreTargetVolumeId"
              class="w-full bg-zinc-955 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="">Create a new volume automatically</option>
              <option v-for="vol in storageStore.volumes" :key="vol.id" :value="vol.id">
                {{ vol.name }} ({{ vol.size }})
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            @click="showRestoreModal = false"
            class="px-4 py-2 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer"
          >
            Cancel
          </button>
          <button
            @click="submitRestoreBackup"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Restore Backup
          </button>
        </div>
      </div>
    </div>

    <!-- Volume Details Modal -->
    <VolumeDetailsModal
      v-if="showDetailsModal && selectedVolume"
      :show="showDetailsModal"
      :volume="selectedVolume"
      @close="showDetailsModal = false"
      @refresh="handleRefresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  HardDrive,
  Link as LinkIcon,
  Unlock,
  Database,
  Loader,
  Server,
  Camera,
  Archive,
  RotateCcw
} from 'lucide-vue-next'
import { useStorageStore } from '@/stores/storage'
import { useComputeStore } from '@/stores/compute'
import VolumeDetailsModal from '@/components/compute/VolumeDetailsModal.vue'
import CopyButton from '@/components/CopyButton.vue'

const storageStore = useStorageStore()
const computeStore = useComputeStore()

const activeTab = ref('volumes')
const searchQuery = ref('')
const selectedVolumeIds = ref<string[]>([])
const snapshotSearchQuery = ref('')
const backupSearchQuery = ref('')

const showCreateModal = ref(false)
const newVolName = ref('')
const newVolSize = ref(100)
const newVolType = ref('__default__')

// Details state
const selectedVolume = ref<any>(null)
const showDetailsModal = ref(false)

// Snapshots wizard states
const showSnapshotModal = ref(false)
const snapshotTargetVolume = ref<any>(null)
const newSnapshotName = ref('')
const newSnapshotDesc = ref('')

// Backups wizard states
const showBackupModal = ref(false)
const backupTargetVolume = ref<any>(null)
const newBackupName = ref('')
const newBackupDesc = ref('')

// Restoring backup states
const showRestoreModal = ref(false)
const restoreTargetBackup = ref<any>(null)
const restoreTargetVolumeId = ref('')

// Filter lists
const filteredVolumes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return storageStore.volumes.filter(
    (v) => v.name.toLowerCase().includes(q) || v.type.toLowerCase().includes(q)
  )
})

const filteredSnapshots = computed(() => {
  const q = snapshotSearchQuery.value.toLowerCase()
  return storageStore.snapshots.filter(
    (s) => s.name.toLowerCase().includes(q) || s.status.toLowerCase().includes(q)
  )
})

const filteredBackups = computed(() => {
  const q = backupSearchQuery.value.toLowerCase()
  return storageStore.backups.filter(
    (b) => b.name.toLowerCase().includes(q) || b.status.toLowerCase().includes(q)
  )
})

async function openCreateModal() {
  newVolName.value = ''
  newVolSize.value = 100
  if (storageStore.volumeTypes.length === 0) {
    await storageStore.loadVolumeTypes()
  }
  const firstType = storageStore.volumeTypes[0]
  newVolType.value = firstType || '__default__'
  showCreateModal.value = true
}

function openDetails(vol: any) {
  selectedVolume.value = vol
  showDetailsModal.value = true
}

function handleRefresh() {
  storageStore.invalidateCache()
  storageStore.loadVolumes()
  if (selectedVolume.value) {
    const updated = storageStore.volumes.find(
      (v) => v.id === selectedVolume.value.id
    )
    if (updated) selectedVolume.value = updated
  }
}

function getAttachedVMName(serverId: string) {
  const found = computeStore.instances.find((vm) => vm.id === serverId)
  return found ? found.name : serverId
}

function getVolumeName(volId: string) {
  const found = storageStore.volumes.find((v) => v.id === volId)
  return found ? found.name : volId
}

function formatDate(dStr?: string) {
  if (!dStr) return '-'
  try {
    return new Date(dStr).toLocaleString()
  } catch (e) {
    return dStr
  }
}

// Cinder triggers
async function handleDelete(vol: any) {
  if (confirm(`Are you sure you want to delete block storage volume "${vol.name}"?`)) {
    try {
      await storageStore.deleteVolume(vol.id)
    } catch (err: any) {
      alert('Failed to delete volume: ' + (err.message || err))
    }
  }
}

function submitCreate() {
  if (newVolName.value.trim() && newVolSize.value > 0) {
    storageStore.createVolume(
      newVolName.value.trim(),
      newVolSize.value,
      newVolType.value
    )
    newVolName.value = ''
    newVolSize.value = 100
    showCreateModal.value = false
  }
}

// Snapshots operations
function triggerCreateSnapshot(vol: any) {
  snapshotTargetVolume.value = vol
  newSnapshotName.value = `${vol.name}-snapshot`
  newSnapshotDesc.value = ''
  showSnapshotModal.value = true
}

async function submitCreateSnapshot() {
  if (!snapshotTargetVolume.value || !newSnapshotName.value.trim()) return
  try {
    await storageStore.createSnapshot(
      snapshotTargetVolume.value.id,
      newSnapshotName.value.trim(),
      newSnapshotDesc.value.trim()
    )
    showSnapshotModal.value = false
    activeTab.value = 'snapshots'
  } catch (err: any) {
    alert('Failed to create volume snapshot: ' + (err.message || err))
  }
}

async function handleDeleteSnapshot(snap: any) {
  if (confirm(`Are you sure you want to delete snapshot "${snap.name}"?`)) {
    try {
      await storageStore.deleteSnapshot(snap.id)
    } catch (err: any) {
      alert('Failed to delete snapshot: ' + (err.message || err))
    }
  }
}

async function handleRestoreSnapshot(snap: any) {
  try {
    // Automatically creates volume out of snapshot
    await storageStore.createVolume(
      `${snap.name}-restored`,
      snap.size,
      '__default__'
    )
    alert(`Snapshot "${snap.name}" has been successfully restored onto a new volume.`)
    activeTab.value = 'volumes'
  } catch (err: any) {
    alert('Failed to restore snapshot: ' + (err.message || err))
  }
}

// Backups operations
function triggerCreateBackup(vol: any) {
  backupTargetVolume.value = vol
  newBackupName.value = `${vol.name}-backup`
  newBackupDesc.value = ''
  showBackupModal.value = true
}

async function submitCreateBackup() {
  if (!backupTargetVolume.value || !newBackupName.value.trim()) return
  try {
    await storageStore.createBackup(
      backupTargetVolume.value.id,
      newBackupName.value.trim(),
      newBackupDesc.value.trim()
    )
    showBackupModal.value = false
    activeTab.value = 'backups'
  } catch (err: any) {
    alert('Failed to create backup: ' + (err.message || err))
  }
}

async function handleDeleteBackup(bk: any) {
  if (confirm(`Are you sure you want to delete backup "${bk.name}"?`)) {
    try {
      await storageStore.deleteBackup(bk.id)
    } catch (err: any) {
      alert('Failed to delete backup: ' + (err.message || err))
    }
  }
}

function triggerRestoreBackup(bk: any) {
  restoreTargetBackup.value = bk
  restoreTargetVolumeId.value = ''
  showRestoreModal.value = true
}

async function submitRestoreBackup() {
  if (!restoreTargetBackup.value) return
  try {
    await storageStore.restoreBackup(restoreTargetBackup.value.id, restoreTargetVolumeId.value || undefined)
    showRestoreModal.value = false
    alert(`Restore triggered for backup "${restoreTargetBackup.value.name}".`)
    activeTab.value = 'volumes'
  } catch (err: any) {
    alert('Failed to restore backup: ' + (err.message || err))
  }
}

const isAllVolumesSelected = computed(() => {
  return filteredVolumes.value.length > 0 && selectedVolumeIds.value.length === filteredVolumes.value.length
})

function toggleSelectAllVolumes() {
  if (isAllVolumesSelected.value) {
    selectedVolumeIds.value = []
  } else {
    selectedVolumeIds.value = filteredVolumes.value.map(v => v.id)
  }
}

async function handleBulkDeleteVolumes() {
  if (!confirm(`Are you sure you want to delete the ${selectedVolumeIds.value.length} selected volumes?`)) return
  const idsToDelete = [...selectedVolumeIds.value]
  selectedVolumeIds.value = []

  let successCount = 0
  let failCount = 0
  let lastError = ''

  for (const id of idsToDelete) {
    try {
      await storageStore.deleteVolume(id)
      successCount++
    } catch (err: any) {
      failCount++
      lastError = err.message || err
    }
  }

  if (failCount > 0) {
    alert(`Bulk delete completed. Success: ${successCount}, Failures: ${failCount}. Last error: ${lastError}`)
  } else {
    alert(`Successfully deleted ${successCount} volumes.`)
  }
}

onMounted(() => {
  storageStore.loadVolumes()
  storageStore.loadVolumeTypes()
  storageStore.loadSnapshots()
  storageStore.loadBackups()
  if (computeStore.instances.length === 0) {
    computeStore.loadAllComputeData()
  }
})
</script>
