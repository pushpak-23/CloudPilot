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
              id: r.logical_resource_id || r.resource_name,
              label: r.resource_name || r.logical_resource_id,
              type
            }
          })
          
          // Parse edges from Heat 'required_by' field
          const edges: Array<{ from: string; to: string }> = []
          resources.forEach((r: any) => {
            const currentId = r.logical_resource_id || r.resource_name
            const dependents = r.required_by || []
            dependents.forEach((depId: string) => {
              // 'required_by' means depId depends on currentId.
              // We draw a directed edge from currentId (dependency) to depId (dependent)
              edges.push({ from: currentId, to: depId })
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
