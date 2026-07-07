import { defineStore } from 'pinia'
import { storageService, type Volume, type VolumeSnapshot, type VolumeBackup } from '@/services/storage.service'

export const useStorageStore = defineStore('storage', {
  state: () => ({
    volumes: [] as Volume[],
    volumeTypes: [] as string[],
    snapshots: [] as VolumeSnapshot[],
    backups: [] as VolumeBackup[],
    loading: false,
    volumesLastFetchedAt: null as number | null,
    volumeTypesLastFetchedAt: null as number | null,
    snapshotsLastFetchedAt: null as number | null,
    backupsLastFetchedAt: null as number | null,
  }),

  getters: {
    totalVolumesCount(state): number {
      return state.volumes.length
    },
    attachedCount(state): number {
      return state.volumes.filter(v => v.status === 'In-Use').length
    },
    availableCount(state): number {
      return state.volumes.filter(v => v.status === 'Available').length
    },
    totalAllocatedGb(state): number {
      let total = 0
      state.volumes.forEach(v => {
        const sizeVal = parseFloat(v.size)
        if (v.size.includes('TB')) {
          total += sizeVal * 1024
        } else {
          total += sizeVal
        }
      })
      return total
    }
  },

  actions: {
    invalidateCache() {
      this.volumesLastFetchedAt = null
      this.snapshotsLastFetchedAt = null
      this.backupsLastFetchedAt = null
    },

    async loadVolumes() {
      const CACHE_TTL = 60_000
      if (this.volumesLastFetchedAt && (Date.now() - this.volumesLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.volumes = await storageService.getVolumes()
        this.volumesLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load volumes', err)
      } finally {
        this.loading = false
      }
    },

    async loadVolumeTypes() {
      const CACHE_TTL = 300_000 // 5 minutes — volume types rarely change
      if (this.volumeTypesLastFetchedAt && (Date.now() - this.volumeTypesLastFetchedAt < CACHE_TTL)) return
      try {
        this.volumeTypes = await storageService.getVolumeTypes()
        this.volumeTypesLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load volume types', err)
      }
    },

    async createVolume(name: string, sizeGb: number, type: string, availabilityZone?: string) {
      const newVol = await storageService.createVolume(name, sizeGb, type, availabilityZone)
      this.volumes.unshift(newVol)
      this.invalidateCache()
      // Refresh after a short delay to get updated status (e.g., Available)
      setTimeout(() => {
        this.volumesLastFetchedAt = null
        this.loadVolumes()
      }, 5000)
    },

    async deleteVolume(id: string) {
      try {
        await storageService.deleteVolume(id)
        this.volumes = this.volumes.filter(v => v.id !== id)
        this.invalidateCache()
      } catch (err) {
        console.error(`Failed to delete volume ${id}:`, err)
        throw err
      }
    },

    async extendVolume(id: string, newSizeGb: number) {
      try {
        await storageService.extendVolume(id, newSizeGb)
        this.volumesLastFetchedAt = null
        this.volumes = await storageService.getVolumes()
        this.volumesLastFetchedAt = Date.now()
      } catch (err) {
        console.error(`Failed to extend volume ${id}:`, err)
        throw err
      }
    },

    // Snapshots Actions
    async loadSnapshots() {
      const CACHE_TTL = 60_000
      if (this.snapshotsLastFetchedAt && (Date.now() - this.snapshotsLastFetchedAt < CACHE_TTL)) return
      try {
        this.snapshots = await storageService.getSnapshots()
        this.snapshotsLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load snapshots', err)
      }
    },

    async createSnapshot(volumeId: string, name: string, description: string) {
      const newSnap = await storageService.createSnapshot(volumeId, name, description)
      this.snapshots.unshift(newSnap)
      this.snapshotsLastFetchedAt = null
    },

    async deleteSnapshot(id: string) {
      try {
        await storageService.deleteSnapshot(id)
        this.snapshots = this.snapshots.filter(s => s.id !== id)
        this.snapshotsLastFetchedAt = null
      } catch (err) {
        console.error('Failed to delete snapshot:', err)
        throw err
      }
    },

    // Backups Actions
    async loadBackups() {
      const CACHE_TTL = 60_000
      if (this.backupsLastFetchedAt && (Date.now() - this.backupsLastFetchedAt < CACHE_TTL)) return
      try {
        this.backups = await storageService.getBackups()
        this.backupsLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load backups', err)
      }
    },

    async createBackup(volumeId: string, name: string, description: string) {
      const newBk = await storageService.createBackup(volumeId, name, description)
      this.backups.unshift(newBk)
      this.backupsLastFetchedAt = null
    },

    async deleteBackup(id: string) {
      try {
        await storageService.deleteBackup(id)
        this.backups = this.backups.filter(b => b.id !== id)
        this.backupsLastFetchedAt = null
      } catch (err) {
        console.error('Failed to delete backup:', err)
        throw err
      }
    },

    async restoreBackup(id: string, volumeId?: string) {
      try {
        await storageService.restoreBackup(id, volumeId)
        this.volumesLastFetchedAt = null
        await this.loadVolumes()
      } catch (err) {
        console.error('Failed to restore backup:', err)
        throw err
      }
    }
  }
})
