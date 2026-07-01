import { defineStore } from 'pinia'
import { storageService, type Volume, type VolumeSnapshot, type VolumeBackup } from '@/services/storage.service'

export const useStorageStore = defineStore('storage', {
  state: () => ({
    volumes: [] as Volume[],
    volumeTypes: [] as string[],
    snapshots: [] as VolumeSnapshot[],
    backups: [] as VolumeBackup[],
    loading: false
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
    async loadVolumes(force: boolean = false) {
      if (this.volumes.length > 0 && !force) return
      this.loading = true
      try {
        this.volumes = await storageService.getVolumes()
      } catch (err) {
        console.error('Failed to load volumes', err)
      } finally {
        this.loading = false
      }
    },

    async loadVolumeTypes() {
      try {
        this.volumeTypes = await storageService.getVolumeTypes()
      } catch (err) {
        console.error('Failed to load volume types', err)
      }
    },

    async createVolume(name: string, sizeGb: number, type: string) {
      const newVol = await storageService.createVolume(name, sizeGb, type)
      this.volumes.unshift(newVol)
    },

    async deleteVolume(id: string) {
      try {
        await storageService.deleteVolume(id)
        this.volumes = this.volumes.filter(v => v.id !== id)
      } catch (err) {
        console.error(`Failed to delete volume ${id}:`, err)
        throw err
      }
    },

    async extendVolume(id: string, newSizeGb: number) {
      try {
        await storageService.extendVolume(id, newSizeGb)
        this.volumes = await storageService.getVolumes()
      } catch (err) {
        console.error(`Failed to extend volume ${id}:`, err)
        throw err
      }
    },

    // Snapshots Actions
    async loadSnapshots(force: boolean = false) {
      if (this.snapshots.length > 0 && !force) return
      try {
        this.snapshots = await storageService.getSnapshots()
      } catch (err) {
        console.error('Failed to load snapshots', err)
      }
    },

    async createSnapshot(volumeId: string, name: string, description: string) {
      const newSnap = await storageService.createSnapshot(volumeId, name, description)
      this.snapshots.unshift(newSnap)
    },

    async deleteSnapshot(id: string) {
      try {
        await storageService.deleteSnapshot(id)
        this.snapshots = this.snapshots.filter(s => s.id !== id)
      } catch (err) {
        console.error('Failed to delete snapshot:', err)
        throw err
      }
    },

    // Backups Actions
    async loadBackups(force: boolean = false) {
      if (this.backups.length > 0 && !force) return
      try {
        this.backups = await storageService.getBackups()
      } catch (err) {
        console.error('Failed to load backups', err)
      }
    },

    async createBackup(volumeId: string, name: string, description: string) {
      const newBk = await storageService.createBackup(volumeId, name, description)
      this.backups.unshift(newBk)
    },

    async deleteBackup(id: string) {
      try {
        await storageService.deleteBackup(id)
        this.backups = this.backups.filter(b => b.id !== id)
      } catch (err) {
        console.error('Failed to delete backup:', err)
        throw err
      }
    },

    async restoreBackup(id: string, volumeId?: string) {
      try {
        await storageService.restoreBackup(id, volumeId)
        await this.loadVolumes(true)
      } catch (err) {
        console.error('Failed to restore backup:', err)
        throw err
      }
    }
  }
})
