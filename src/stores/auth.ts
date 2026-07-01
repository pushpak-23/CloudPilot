import { defineStore } from 'pinia'
import { authService, type UserSession } from '@/services/auth.service'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserSession | null,
    token: null as string | null,
    loading: false
  }),

  getters: {
    isAuthenticated(state): boolean {
      return !!state.token
    }
  },

  actions: {
    initialize() {
      const storedToken = localStorage.getItem('cp_token')
      const storedUser = localStorage.getItem('cp_user')
      if (storedToken && storedUser) {
        this.token = storedToken
        this.user = JSON.parse(storedUser)
      }
    },

    async login(params: Parameters<typeof authService.login>[0]) {
      this.loading = true
      try {
        const session = await authService.login(params)
        this.token = session.token
        this.user = session
        localStorage.setItem('cp_token', session.token)
        localStorage.setItem('cp_user', JSON.stringify(session))
      } catch (err) {
        console.error('Login failed', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      if (this.token) {
        try {
          await authService.logout(this.token)
        } catch (err) {
          console.error('Logout error on server', err)
        }
      }
      this.token = null
      this.user = null
      localStorage.removeItem('cp_token')
      localStorage.removeItem('cp_user')
    }
  }
})
