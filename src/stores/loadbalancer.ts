import { defineStore } from 'pinia'
import {
  loadbalancerService,
  type LoadBalancer,
  type Listener,
  type Pool,
  type PoolMember,
  type CreateLoadBalancerInput,
  type UpdateLoadBalancerInput,
  type CreateListenerInput,
  type CreatePoolInput,
  type CreateHealthMonitorInput,
  type CreatePoolMemberInput,
} from '@/services/loadbalancer.service'

export const useLoadBalancerStore = defineStore('loadbalancer', {
  state: () => ({
    loadbalancers: [] as LoadBalancer[],
    listeners: [] as Listener[],
    pools: [] as Pool[],
    membersByPool: {} as Record<string, PoolMember[]>,
    statsByLb: {} as Record<string, { activeConnections: number; bytesIn: number; bytesOut: number; totalConnections: number }>,
    loading: false,
    lbsLastFetchedAt: null as number | null,
    listenersLastFetchedAt: null as number | null,
    poolsLastFetchedAt: null as number | null,
  }),

  getters: {
    totalLoadBalancersCount(state): number {
      return state.loadbalancers.length
    },
  },

  actions: {
    invalidateCache() {
      this.lbsLastFetchedAt = null
      this.listenersLastFetchedAt = null
      this.poolsLastFetchedAt = null
    },

    async loadLoadBalancers(force: boolean = false) {
      const CACHE_TTL = 60_000
      if (!force && this.lbsLastFetchedAt && (Date.now() - this.lbsLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.loadbalancers = await loadbalancerService.getLoadBalancers()
        this.lbsLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load load balancers', err)
      } finally {
        this.loading = false
      }
    },

    async loadListeners(force: boolean = false) {
      const CACHE_TTL = 60_000
      if (!force && this.listenersLastFetchedAt && (Date.now() - this.listenersLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.listeners = await loadbalancerService.getListeners()
        this.listenersLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load listeners', err)
        this.listeners = []
      } finally {
        this.loading = false
      }
    },

    async loadPools(force: boolean = false) {
      const CACHE_TTL = 60_000
      if (!force && this.poolsLastFetchedAt && (Date.now() - this.poolsLastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.pools = await loadbalancerService.getPools()
        this.poolsLastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load pools', err)
        this.pools = []
      } finally {
        this.loading = false
      }
    },

    async createLoadBalancer(input: CreateLoadBalancerInput) {
      const newLb = await loadbalancerService.createLoadBalancer(input)
      this.loadbalancers.push(newLb)
      this.invalidateCache()
      return newLb
    },

    async updateLoadBalancer(id: string, input: UpdateLoadBalancerInput) {
      const updated = await loadbalancerService.updateLoadBalancer(id, input)
      const index = this.loadbalancers.findIndex((lb) => lb.id === id)
      if (index >= 0) {
        this.loadbalancers[index] = { ...this.loadbalancers[index], ...updated }
      }
      this.invalidateCache()
      return updated
    },

    async deleteLoadBalancer(id: string) {
      await loadbalancerService.deleteLoadBalancer(id)
      const index = this.loadbalancers.findIndex((lb) => lb.id === id)
      if (index >= 0) {
        this.loadbalancers.splice(index, 1)
      }
      this.invalidateCache()
    },

    async createListener(input: CreateListenerInput) {
      const newLis = await loadbalancerService.createListener(input)
      this.listeners.push(newLis)
      this.invalidateCache()
      return newLis
    },

    async createPool(input: CreatePoolInput) {
      const newPool = await loadbalancerService.createPool(input)
      this.pools.push(newPool)
      this.invalidateCache()
      return newPool
    },

    async createHealthMonitor(input: CreateHealthMonitorInput) {
      const monitor = await loadbalancerService.createHealthMonitor(input)
      this.invalidateCache()
      return monitor
    },

    async loadPoolMembers(poolId: string) {
      try {
        const poolMembers = await loadbalancerService.getPoolMembers(poolId)
        this.membersByPool[poolId] = poolMembers
      } catch (err) {
        console.error(`Failed to load pool members for pool ${poolId}`, err)
      }
    },

    async createPoolMember(poolId: string, input: CreatePoolMemberInput) {
      const newMember = await loadbalancerService.createPoolMember(poolId, input)
      if (!this.membersByPool[poolId]) {
        this.membersByPool[poolId] = []
      }
      this.membersByPool[poolId].push(newMember)
      this.invalidateCache()
      return newMember
    },

    async deletePoolMember(poolId: string, memberId: string) {
      await loadbalancerService.deletePoolMember(poolId, memberId)
      if (this.membersByPool[poolId]) {
        const idx = this.membersByPool[poolId].findIndex((m) => m.id === memberId)
        if (idx >= 0) {
          this.membersByPool[poolId].splice(idx, 1)
        }
      }
      this.invalidateCache()
    },

    async loadLoadBalancerStats(id: string) {
      try {
        const stats = await loadbalancerService.getLoadBalancerStats(id)
        this.statsByLb[id] = stats
      } catch (err) {
        console.error(`Failed to load stats for LB ${id}`, err)
      }
    },

    async failoverLoadBalancer(id: string) {
      await loadbalancerService.failoverLoadBalancer(id)
      this.invalidateCache()
    },
  },
})
