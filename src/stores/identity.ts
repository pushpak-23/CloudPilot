import { defineStore } from 'pinia'
import { identityService, type Project } from '@/services/identity.service'

export const useIdentityStore = defineStore('identity', {
  state: () => ({
    projects: [] as Project[],
    loading: false,
    lastFetchedAt: null as number | null,
  }),

  getters: {
    totalProjectsCount(state): number {
      return state.projects.length
    }
  },

  actions: {
    async loadProjects() {
      const CACHE_TTL = 60_000
      if (this.lastFetchedAt && (Date.now() - this.lastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.projects = await identityService.getProjects()
        this.lastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load projects', err)
      } finally {
        this.loading = false
      }
    }
  }
})
