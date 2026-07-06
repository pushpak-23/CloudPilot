import { callProxy } from './compute.service'

export interface HeatStack {
  id: string
  name: string
  status: 'Create_Complete' | 'Create_Failed' | 'Create_In_Progress' | 'Delete_In_Progress'
  statusClass: string
  bulletClass: string
  description: string
  templateType: string
  createdAt: string
  updatedAt: string
  parameters: Record<string, string>
  topology: {
    nodes: Array<{ id: string; label: string; type: 'server' | 'network' | 'subnet' | 'security_group' | 'loadbalancer' }>
    edges: Array<{ from: string; to: string }>
  }
}

export interface StackEvent {
  time: string
  resource: string
  status: string
  reason: string
}

function mapHeatStatus(status: string): HeatStack['status'] {
  const s = status || ''
  if (s.includes('FAILED')) return 'Create_Failed'
  if (s.includes('PROGRESS')) return 'Create_In_Progress'
  if (s.includes('DELETE')) return 'Delete_In_Progress'
  return 'Create_Complete'
}

function mapHeatStatusClasses(status: string) {
  const s = status || ''
  if (s.includes('FAILED')) {
    return {
      statusClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      bulletClass: 'bg-red-500'
    }
  }
  if (s.includes('PROGRESS')) {
    return {
      statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      bulletClass: 'bg-blue-500 animate-pulse'
    }
  }
  if (s.includes('DELETE')) {
    return {
      statusClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      bulletClass: 'bg-red-500 animate-ping'
    }
  }
  return {
    statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    bulletClass: 'bg-emerald-500'
  }
}

export const orchestrationService = {
  async getStacks(): Promise<HeatStack[]> {
    try {
      const raw = await callProxy('orchestration', '/stacks')
      const rawStacks = raw.stacks || []
      return rawStacks.map((s: any) => {
        const mappedStatus = mapHeatStatus(s.stack_status)
        const { statusClass, bulletClass } = mapHeatStatusClasses(s.stack_status)
        return {
          id: s.id,
          name: s.stack_name || s.id,
          status: mappedStatus,
          statusClass,
          bulletClass,
          description: s.description || 'No description provided.',
          templateType: s.stack_user_project_id ? 'HOT Template' : 'Heat Template',
          createdAt: s.creation_time || new Date().toISOString(),
          updatedAt: s.updated_time || new Date().toISOString(),
          parameters: s.parameters || {},
          topology: {
            nodes: [
              { id: 'h1', label: 'heat-net', type: 'network' },
              { id: 'h2', label: s.stack_name || 'server', type: 'server' }
            ],
            edges: [
              { from: 'h2', to: 'h1' }
            ]
          }
        }
      })
    } catch (err) {
      console.error('Failed to get real Heat stacks from OpenStack:', err)
      return []
    }
  },

  async getStackResources(stackName: string, stackId: string): Promise<any[]> {
    try {
      const raw = await callProxy('orchestration', `/stacks/${stackName}/${stackId}/resources`)
      return raw.resources || []
    } catch (err) {
      console.error(`Failed to get Heat resources for stack ${stackName}:`, err)
      return []
    }
  },

  async getEvents(stackName: string, stackId: string): Promise<StackEvent[]> {
    try {
      const raw = await callProxy('orchestration', `/stacks/${stackName}/${stackId}/events`)
      const rawEvents = raw.events || []
      return rawEvents.map((e: any) => ({
        time: e.event_time ? new Date(e.event_time).toLocaleTimeString() : 'n/a',
        resource: e.resource_name || 'Unknown',
        status: e.resource_status || 'UNKNOWN',
        reason: e.resource_status_reason || ''
      }))
    } catch (err) {
      console.error(`Failed to get events for stack ${stackName}:`, err)
      return []
    }
  },

  async createStack(name: string, templateYaml: string, parameters: Record<string, any> = {}): Promise<any> {
    try {
      const payload = {
        stack_name: name,
        template: templateYaml,
        parameters: parameters
      }
      return await callProxy('orchestration', '/stacks', 'POST', payload)
    } catch (err) {
      console.error('Failed to create Heat stack:', err)
      throw err
    }
  },

  async deleteStack(stackName: string, stackId: string): Promise<void> {
    try {
      await callProxy('orchestration', `/stacks/${stackName}/${stackId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete stack ${stackName}:`, err)
      throw err
    }
  }
}
