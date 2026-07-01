import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/auth/LoginPage.vue')
    },
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../pages/dashboard/DashboardPage.vue'),
          meta: { 
            title: 'Dashboard',
            breadcrumbs: [{ text: 'Dashboard', path: '/' }] 
          }
        },
        {
          path: 'compute',
          name: 'compute',
          component: () => import('../pages/compute/ComputePage.vue'),
          meta: { 
            title: 'Instances',
            breadcrumbs: [
              { text: 'Infrastructure', path: '/' },
              { text: 'Instances', path: '/compute' }
            ] 
          }
        },
        {
          path: 'storage',
          name: 'storage',
          component: () => import('../pages/storage/StoragePage.vue'),
          meta: { 
            title: 'Volumes',
            breadcrumbs: [
              { text: 'Storage', path: '/' },
              { text: 'Volumes', path: '/storage' }
            ] 
          }
        },
        {
          path: 'network',
          name: 'network',
          component: () => import('../pages/network/NetworkPage.vue'),
          meta: { 
            title: 'Networking',
            breadcrumbs: [
              { text: 'Networking', path: '/' },
              { text: 'Overview', path: '/network' }
            ] 
          }
        },
        {
          path: 'identity',
          name: 'identity',
          component: () => import('../pages/identity/IdentityPage.vue'),
          meta: { 
            title: 'Identity',
            breadcrumbs: [
              { text: 'Identity', path: '/' },
              { text: 'Projects & Users', path: '/identity' }
            ] 
          }
        },
        {
          path: 'monitoring',
          name: 'monitoring',
          component: () => import('../pages/monitoring/MonitoringPage.vue'),
          meta: { 
            title: 'Monitoring',
            breadcrumbs: [
              { text: 'Monitoring', path: '/' },
              { text: 'Metrics', path: '/monitoring' }
            ] 
          }
        },
        {
          path: 'ai',
          name: 'ai',
          component: () => import('../pages/ai/AIPage.vue'),
          meta: { 
            title: 'AI Assistant',
            breadcrumbs: [{ text: 'AI Assistant', path: '/ai' }] 
          }
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../pages/settings/SettingsPage.vue'),
          meta: { 
            title: 'Settings',
            breadcrumbs: [{ text: 'Settings', path: '/settings' }] 
          }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.initialize()

  if (to.name !== 'login' && !authStore.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router


