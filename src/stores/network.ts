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
    networksLastFetchedAt: null as number | null,
    routersLastFetchedAt: null as number | null,
  }),

  getters: {
    totalNetworksCount(state): number {
      return state.networks.length
    },
  },

  actions: {
    invalidateCache() {
      this.networksLastFetchedAt = null
      this.routersLastFetchedAt = null
    },

    async loadNetworks() {
      const CACHE_TTL = 60_000
      if (this.networksLastFetchedAt && (Date.now() - this.networksLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.networks = await networkService.getNetworks()
        this.networksLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load networks', err)
      } finally {
        this.loading = false
      }
    },

    async loadRouters() {
      const CACHE_TTL = 60_000
      if (this.routersLastFetchedAt && (Date.now() - this.routersLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.routers = await networkService.getRouters()
        this.routersLastFetchedAt = Date.now()
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
      this.invalidateCache()
    },

    async updateNetwork(networkId: string, changes: UpdateNetworkInput) {
      const updated = await networkService.updateNetwork(networkId, changes)
      const index = this.networks.findIndex(
        (network) => network.id === networkId
      )
      if (index >= 0)
        this.networks[index] = { ...this.networks[index], ...updated }
      this.invalidateCache()
      return updated
    },

    async createRouter(router: CreateRouterInput) {
      const created = await networkService.createRouter(router)
      this.routers.push(created)
      this.invalidateCache()
      return created
    },

    async updateRouter(routerId: string, changes: UpdateRouterInput) {
      const updated = await networkService.updateRouter(routerId, changes)
      const index = this.routers.findIndex((router) => router.id === routerId)
      if (index >= 0)
        this.routers[index] = { ...this.routers[index], ...updated }
      this.invalidateCache()
      return updated
    },
  },
})
