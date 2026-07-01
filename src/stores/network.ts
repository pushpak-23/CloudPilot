import { defineStore } from 'pinia'
import { networkService, type NetworkConfig } from '@/services/network.service'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    networks: [] as NetworkConfig[],
    loading: false
  }),

  getters: {
    totalNetworksCount(state): number {
      return state.networks.length
    }
  },

  actions: {
    async loadNetworks(force: boolean = false) {
      if (this.networks.length > 0 && !force) return
      this.loading = true
      try {
        this.networks = await networkService.getNetworks()
      } catch (err) {
        console.error('Failed to load networks', err)
      } finally {
        this.loading = false
      }
    },

    async createNetwork(net: Omit<NetworkConfig, 'id'>) {
      const newNet = await networkService.createNetwork(net)
      this.networks.push(newNet)
    }
  }
})
