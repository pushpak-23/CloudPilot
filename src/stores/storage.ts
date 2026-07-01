import { defineStore } from 'pinia'
import { storageService, type Volume } from '@/services/storage.service'

export const useStorageStore = defineStore('storage', {
  state: () => ({
    volumes: [] as Volume[],
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

    async createVolume(name: string, sizeGb: number, type: string) {
      const newVol = await storageService.createVolume(name, sizeGb, type)
      this.volumes.unshift(newVol)
    },

    deleteVolume(name: string) {
      this.volumes = this.volumes.filter(v => v.name !== name)
    }
  }
})
