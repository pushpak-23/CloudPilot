import { defineStore } from 'pinia'
import { identityService, type Project } from '@/services/identity.service'
import { useAuthStore } from './auth'
import { useComputeStore } from './compute'
import { useStorageStore } from './storage'
import { useNetworkStore } from './network'
import { useOrchestrationStore } from './orchestration'
import { useIdentityStore } from './identity'

export interface Notification {
  id: number
  title: string
  description: string
  time: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
}

export const useLayoutStore = defineStore('layout', {
  state: () => ({
    sidebarCollapsed: false,
    sidebarMobileOpen: false,
    searchModalOpen: false,
    pageTitle: 'Dashboard',
    currentRegion: 'RegionOne',
    currentProject: 'Default-Project',
    regions: ['RegionOne', 'RegionTwo', 'RegionThree'],
    projects: ['Default-Project', 'Production-Env', 'Staging-Env', 'Testing-Lab'],
    projectsObjects: [] as Project[],
    contextLoaded: false,
    notifications: [
      {
        id: 1,
        title: 'Instance created successfully',
        description: 'VM k8s-node-01 is now active and running.',
        time: '2 min ago',
        type: 'success',
        read: false
      },
      {
        id: 2,
        title: 'Volume attachment failed',
        description: 'Could not attach vol-db-02 to vm-db-replica.',
        time: '15 min ago',
        type: 'error',
        read: false
      },
      {
        id: 3,
        title: 'High CPU utilization',
        description: 'Instance load-balancer-01 CPU usage exceeded 90%.',
        time: '1 hour ago',
        type: 'warning',
        read: false
      },
      {
        id: 4,
        title: 'System update completed',
        description: 'CloudPilot API gateway successfully updated to v0.1.0.',
        time: '4 hours ago',
        type: 'info',
        read: true
      }
    ] as Notification[]
  }),

  getters: {
    unreadNotificationsCount(state): number {
      return state.notifications.filter(n => !n.read).length
    }
  },

  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    toggleMobileSidebar() {
      this.sidebarMobileOpen = !this.sidebarMobileOpen
    },
    closeMobileSidebar() {
      this.sidebarMobileOpen = false
    },
    setSearchModalOpen(val: boolean) {
      this.searchModalOpen = val
    },
    markAllNotificationsAsRead() {
      this.notifications.forEach(n => n.read = true)
    },
    toggleNotificationRead(id: number) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.read = !notification.read
      }
    },
    setRegion(region: string) {
      this.currentRegion = region
      const storedUser = localStorage.getItem('cp_user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        user.region = region
        localStorage.setItem('cp_user', JSON.stringify(user))
        window.location.reload()
      }
    },
    async setProject(project: string) {
      this.currentProject = project
      const authStore = useAuthStore()
      
      const projObj = this.projectsObjects.find(p => p.name === project)
      const targetIdentifier = projObj?.id || project

      try {
        // Exchange active token for project-scoped token
        await authStore.switchProject(targetIdentifier)
        
        // Resolve all resource stores
        const computeStore = useComputeStore()
        const storageStore = useStorageStore()
        const networkStore = useNetworkStore()
        const orchestrationStore = useOrchestrationStore()
        const identityStore = useIdentityStore()
        
        // Invalidate active store caches
        computeStore.invalidateCache()
        storageStore.invalidateCache()
        networkStore.invalidateCache()
        orchestrationStore.lastFetchedAt = null
        identityStore.lastFetchedAt = null

        // Load new project context data in-place
        await Promise.allSettled([
          computeStore.loadAllComputeData(),
          storageStore.loadVolumes(),
          storageStore.loadSnapshots(),
          storageStore.loadBackups(),
          networkStore.loadNetworks(),
          networkStore.loadRouters(),
          orchestrationStore.loadStacks(),
          identityStore.loadProjects()
        ])
      } catch (e) {
        console.error('Failed to perform Keystone project switch scoping:', e)
      }
    },
    async loadContextData() {
      if (this.contextLoaded) return
      this.contextLoaded = true
      try {
        const projs = await identityService.getProjects()
        if (projs.length > 0) {
          this.projectsObjects = projs
          this.projects = projs.map(p => p.name)
        }
        
        const regs = await identityService.getRegions()
        if (regs.length > 0) {
          this.regions = regs
        }

        const storedUser = localStorage.getItem('cp_user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          if (user.project && this.projects.includes(user.project)) {
            this.currentProject = user.project
          } else if (this.projects.length > 0 && this.projects[0]) {
            this.currentProject = this.projects[0]
          }
          if (user.region && this.regions.includes(user.region)) {
            this.currentRegion = user.region
          } else if (this.regions.length > 0 && this.regions[0]) {
            this.currentRegion = this.regions[0]
          }
        }
      } catch (err) {
        console.error('Failed to load real projects/regions context:', err)
      }
    }
  }
})

