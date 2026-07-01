import { defineStore } from 'pinia'

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
    },
    setProject(project: string) {
      this.currentProject = project
    }
  }
})

