import { defineStore } from 'pinia'
import { orchestrationService, type HeatStack, type StackEvent } from '@/services/orchestration.service'

export const useOrchestrationStore = defineStore('orchestration', {
  state: () => ({
    stacks: [] as HeatStack[],
    events: [] as StackEvent[],
    loading: false,
    deploying: false,
    lastFetchedAt: null as number | null,
  }),

  actions: {
    async loadStacks() {
      const CACHE_TTL = 30_000
      if (this.lastFetchedAt && (Date.now() - this.lastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        this.stacks = await orchestrationService.getStacks()
        this.lastFetchedAt = Date.now()
      } catch (err) {
        console.error('Failed to load Heat stacks', err)
      } finally {
        this.loading = false
      }
    },

    async loadEvents(stackId: string) {
      this.loading = true
      try {
        const stack = this.stacks.find(s => s.id === stackId)
        if (stack) {
          this.events = await orchestrationService.getEvents(stack.name, stack.id)
        } else {
          this.events = []
        }
      } catch (err) {
        console.error('Failed to load stack events', err)
      } finally {
        this.loading = false
      }
    },

    async launchStack(config: {
      name: string
      templateType: string
      parameters: Record<string, string>
      templateYaml: string
    }) {
      this.deploying = true
      try {
        await orchestrationService.createStack(config.name, config.templateYaml, config.parameters)
        this.lastFetchedAt = null
        await this.loadStacks()
      } catch (err) {
        console.error('Failed to launch Heat stack:', err)
        throw err
      } finally {
        this.deploying = false
      }
    },

    async deleteStack(id: string) {
      const stack = this.stacks.find(s => s.id === id)
      if (!stack) return
      try {
        await orchestrationService.deleteStack(stack.name, stack.id)
        this.lastFetchedAt = null
        await this.loadStacks()
      } catch (err) {
        console.error(`Failed to delete stack ${stack.name}:`, err)
        throw err
      }
    },

    async loadStackResources(stackId: string) {
      const stack = this.stacks.find(s => s.id === stackId)
      if (!stack) return
      try {
        const resources = await orchestrationService.getStackResources(stack.name, stack.id)
        if (resources && resources.length > 0) {
          // Map Heat resources to node structure!
          const nodes = resources.map((r: any) => {
            let type: 'server' | 'network' | 'subnet' | 'security_group' | 'loadbalancer' = 'server'
            const t = r.resource_type || ''
            if (t.includes('Server')) type = 'server'
            else if (t.includes('Net') && !t.includes('Subnet')) type = 'network'
            else if (t.includes('Subnet')) type = 'subnet'
            else if (t.includes('SecurityGroup')) type = 'security_group'
            else if (t.includes('LoadBalancer') || t.includes('LB')) type = 'loadbalancer'
            
            return {
              id: r.physical_resource_id || r.resource_name,
              label: r.resource_name,
              type
            }
          })
          
          // Auto-connect nodes
          const edges: Array<{ from: string; to: string }> = []
          const servers = nodes.filter(n => n.type === 'server')
          const nets = nodes.filter(n => n.type === 'network' || n.type === 'subnet')
          const lbs = nodes.filter(n => n.type === 'loadbalancer')
          const sgs = nodes.filter(n => n.type === 'security_group')

          servers.forEach(srv => {
            nets.forEach(net => {
              edges.push({ from: srv.id, to: net.id })
            })
            sgs.forEach(sg => {
              edges.push({ from: srv.id, to: sg.id })
            })
          })

          lbs.forEach(lb => {
            nets.forEach(net => {
              edges.push({ from: lb.id, to: net.id })
            })
          })

          stack.topology = { nodes, edges }
        }
      } catch (err) {
        console.error('Failed to resolve stack resources', err)
      }
    }
  }
})
