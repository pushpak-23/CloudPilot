import { defineStore } from 'pinia'
import {
  networkService,
  type NetworkConfig,
  type NetworkRouter,
  type CreateRouterInput,
  type UpdateNetworkInput,
  type UpdateRouterInput,
  type CreateNetworkInput,
} from '@/services/network.service'

export const useNetworkStore = defineStore('network', {
  state: () => ({
    networks: [] as NetworkConfig[],
    routers: [] as NetworkRouter[],
    loading: false,
  }),

  getters: {
    totalNetworksCount(state): number {
      return state.networks.length
    },
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

    async loadRouters(force: boolean = false) {
      if (this.routers.length > 0 && !force) return
      this.loading = true
      try {
        this.routers = await networkService.getRouters()
      } catch (err) {
        console.error('Failed to load routers', err)
        this.routers = []
      } finally {
        this.loading = false
      }
    },

    async createNetwork(net: CreateNetworkInput) {
      const newNet = await networkService.createNetwork(net)
      this.networks.push(newNet)
    },

    async updateNetwork(networkId: string, changes: UpdateNetworkInput) {
      const updated = await networkService.updateNetwork(networkId, changes)
      const index = this.networks.findIndex(
        (network) => network.id === networkId
      )
      if (index >= 0)
        this.networks[index] = { ...this.networks[index], ...updated }
      return updated
    },

    async createRouter(router: CreateRouterInput) {
      const created = await networkService.createRouter(router)
      this.routers.push(created)
      return created
    },

    async updateRouter(routerId: string, changes: UpdateRouterInput) {
      const updated = await networkService.updateRouter(routerId, changes)
      const index = this.routers.findIndex((router) => router.id === routerId)
      if (index >= 0)
        this.routers[index] = { ...this.routers[index], ...updated }
      return updated
    },
  },
})
