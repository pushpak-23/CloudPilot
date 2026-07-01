import { defineStore } from 'pinia'
import { identityService, type Project } from '@/services/identity.service'

export const useIdentityStore = defineStore('identity', {
  state: () => ({
    projects: [] as Project[],
    loading: false
  }),

  getters: {
    totalProjectsCount(state): number {
      return state.projects.length
    }
  },

  actions: {
    async loadProjects(force: boolean = false) {
      if (this.projects.length > 0 && !force) return
      this.loading = true
      try {
        this.projects = await identityService.getProjects()
      } catch (err) {
        console.error('Failed to load projects', err)
      } finally {
        this.loading = false
      }
    }
  }
})
