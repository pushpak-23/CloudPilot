export interface LoadBalancer {
  id: string
  name: string
  description: string
  provisioningStatus: string
  operatingStatus: string
  vipAddress: string
  vipSubnetId: string
  vipPortId: string
  provider: string
  adminStateUp: boolean
}

export interface CreateLoadBalancerInput {
  name: string
  description?: string
  vipSubnetId: string
  vipAddress?: string
  provider?: string
  adminStateUp?: boolean

  // Listener (optional)
  listenerName?: string
  listenerProtocol?: string
  listenerPort?: number
  listenerConnectionLimit?: number

  // Pool (optional)
  poolName?: string
  poolProtocol?: string
  poolAlgorithm?: string

  // Members (optional)
  members?: CreatePoolMemberInput[]

  // Health Monitor (optional)
  monitorType?: string
  monitorDelay?: number
  monitorTimeout?: number
  monitorMaxRetries?: number
  monitorHttpMethod?: string
  monitorUrlPath?: string
  monitorExpectedCodes?: string
}

export interface CreateListenerInput {
  name: string
  protocol: string
  protocolPort: number
  loadbalancerId: string
  connectionLimit?: number
}

export interface CreatePoolInput {
  name: string
  protocol: string
  lbAlgorithm: string
  loadbalancerId: string
  listenerId?: string
}

export interface CreateHealthMonitorInput {
  poolId: string
  type: string
  delay: number
  timeout: number
  maxRetries: number
  httpMethod?: string
  urlPath?: string
  expectedCodes?: string
}

export interface PoolMember {
  id: string
  name: string
  address: string
  protocolPort: number
  weight: number
  subnetId: string
  provisioningStatus: string
  operatingStatus: string
}

export interface CreatePoolMemberInput {
  address: string
  protocolPort: number
  weight?: number
  subnetId: string
}

export interface UpdateLoadBalancerInput {
  name?: string
  description?: string
  adminStateUp?: boolean
}

export interface Listener {
  id: string
  name: string
  protocol: string
  protocolPort: number
  loadbalancers: { id: string }[]
}

export interface Pool {
  id: string
  name: string
  protocol: string
  lbAlgorithm: string
  loadbalancers: { id: string }[]
}

// Session extraction helpers
function getSession() {
  const token = localStorage.getItem('cp_token')
  const userStr = localStorage.getItem('cp_user')
  if (!token || !userStr) {
    throw new Error('Not authenticated with Keystone. Log in first.')
  }
  const user = JSON.parse(userStr)
  return { token, user }
}

// Dynamic proxy routing helper
async function callProxy(
  serviceType: string,
  path: string,
  method: string = 'GET',
  body?: any
) {
  const { token, user } = getSession()
  const endpoints = user.endpoints || user.user?.endpoints
  const baseUrl = endpoints?.[serviceType]

  if (!baseUrl) {
    throw new Error(
      `Public endpoint for service type "${serviceType}" was not found in Keystone catalog.`
    )
  }

  const sanitizedBase = baseUrl.replace(/\/+$/, '')
  const url = `${sanitizedBase}${path}`

  const response = await fetch('/api/v1/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify({ url, method, body }),
  })

  const data = await response.json()
  if (!response.ok || data.success === false) {
    const errMsg =
      data?.error?.message || data?.raw_response || 'Gateway proxy query failed'
    throw new Error(errMsg)
  }
  return data
}

export const loadbalancerService = {
  async getLoadBalancers(): Promise<LoadBalancer[]> {
    try {
      const raw = await callProxy('load-balancer', '/v2/lbaas/loadbalancers')
      const lbs = raw.loadbalancers || []
      return lbs.map((lb: any) => ({
        id: lb.id,
        name: lb.name || lb.id || 'Unnamed Load Balancer',
        description: lb.description || '',
        provisioningStatus: lb.provisioning_status || 'UNKNOWN',
        operatingStatus: lb.operating_status || 'UNKNOWN',
        vipAddress: lb.vip_address || '',
        vipSubnetId: lb.vip_subnet_id || '',
        vipPortId: lb.vip_port_id || '',
        provider: lb.provider || 'amphora',
        adminStateUp: lb.admin_state_up ?? true,
      }))
    } catch (err) {
      console.error('Failed to query load balancers from Octavia:', err)
      throw err
    }
  },

  async createLoadBalancer(input: CreateLoadBalancerInput): Promise<LoadBalancer> {
    try {
      const payload: any = {
        loadbalancer: {
          name: input.name,
          description: input.description || '',
          vip_subnet_id: input.vipSubnetId,
          admin_state_up: input.adminStateUp ?? true,
        },
      }
      if (input.vipAddress) {
        payload.loadbalancer.vip_address = input.vipAddress
      }
      if (input.provider) {
        payload.loadbalancer.provider = input.provider
      }

      // Add nested listener if provided
      if (input.listenerProtocol && input.listenerPort) {
        const listener: any = {
          name: input.listenerName || `${input.name}-listener`,
          protocol: input.listenerProtocol,
          protocol_port: input.listenerPort,
        }
        if (input.listenerConnectionLimit !== undefined && input.listenerConnectionLimit !== null) {
          listener.connection_limit = input.listenerConnectionLimit
        }

        // Add nested pool if provided
        if (input.poolProtocol && input.poolAlgorithm) {
          const pool: any = {
            name: input.poolName || `${input.name}-pool`,
            protocol: input.poolProtocol,
            lb_algorithm: input.poolAlgorithm,
          }

          // Add nested members if provided
          if (input.members && input.members.length > 0) {
            pool.members = input.members.map((m: any) => ({
              address: m.address,
              protocol_port: m.protocolPort,
              weight: m.weight ?? 1,
              subnet_id: m.subnetId,
            }))
          }

          // Add nested healthmonitor if provided
          if (input.monitorType) {
            const hm: any = {
              type: input.monitorType,
              delay: input.monitorDelay || 5,
              timeout: input.monitorTimeout || 5,
              max_retries: input.monitorMaxRetries || 3,
            }
            if (input.monitorHttpMethod) hm.http_method = input.monitorHttpMethod
            if (input.monitorUrlPath) hm.url_path = input.monitorUrlPath
            if (input.monitorExpectedCodes) hm.expected_codes = input.monitorExpectedCodes
            pool.healthmonitor = hm
          }

          listener.default_pool = pool
        }

        payload.loadbalancer.listeners = [listener]
      }

      const raw = await callProxy('load-balancer', '/v2/lbaas/loadbalancers', 'POST', payload)
      const lb = raw.loadbalancer
      return {
        id: lb.id,
        name: lb.name || input.name,
        description: lb.description || '',
        provisioningStatus: lb.provisioning_status || 'PENDING_CREATE',
        operatingStatus: lb.operating_status || 'OFFLINE',
        vipAddress: lb.vip_address || '',
        vipSubnetId: lb.vip_subnet_id || '',
        vipPortId: lb.vip_port_id || '',
        provider: lb.provider || 'amphora',
        adminStateUp: lb.admin_state_up ?? true,
      }
    } catch (err) {
      console.error('Failed to create load balancer in Octavia:', err)
      throw err
    }
  },

  async updateLoadBalancer(id: string, input: UpdateLoadBalancerInput): Promise<LoadBalancer> {
    try {
      const payload: any = {
        loadbalancer: {},
      }
      if (typeof input.name === 'string') payload.loadbalancer.name = input.name
      if (typeof input.description === 'string') payload.loadbalancer.description = input.description
      if (typeof input.adminStateUp === 'boolean') payload.loadbalancer.admin_state_up = input.adminStateUp

      const raw = await callProxy('load-balancer', `/v2/lbaas/loadbalancers/${id}`, 'PUT', payload)
      const lb = raw.loadbalancer
      return {
        id: lb.id,
        name: lb.name || '',
        description: lb.description || '',
        provisioningStatus: lb.provisioning_status || 'PENDING_UPDATE',
        operatingStatus: lb.operating_status || 'ONLINE',
        vipAddress: lb.vip_address || '',
        vipSubnetId: lb.vip_subnet_id || '',
        vipPortId: lb.vip_port_id || '',
        provider: lb.provider || 'amphora',
        adminStateUp: lb.admin_state_up ?? true,
      }
    } catch (err) {
      console.error(`Failed to update load balancer ${id}:`, err)
      throw err
    }
  },

  async deleteLoadBalancer(id: string): Promise<void> {
    try {
      await callProxy('load-balancer', `/v2/lbaas/loadbalancers/${id}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete load balancer ${id}:`, err)
      throw err
    }
  },

  async getListeners(): Promise<Listener[]> {
    try {
      const raw = await callProxy('load-balancer', '/v2/lbaas/listeners')
      const listeners = raw.listeners || []
      return listeners.map((l: any) => ({
        id: l.id,
        name: l.name || l.id || 'Unnamed Listener',
        protocol: l.protocol || 'HTTP',
        protocolPort: l.protocol_port || 80,
        loadbalancers: l.loadbalancers || [],
      }))
    } catch (err) {
      console.error('Failed to query listeners from Octavia:', err)
      throw err
    }
  },

  async getPools(): Promise<Pool[]> {
    try {
      const raw = await callProxy('load-balancer', '/v2/lbaas/pools')
      const pools = raw.pools || []
      return pools.map((p: any) => ({
        id: p.id,
        name: p.name || p.id || 'Unnamed Pool',
        protocol: p.protocol || 'HTTP',
        lbAlgorithm: p.lb_algorithm || 'ROUND_ROBIN',
        loadbalancers: p.loadbalancers || [],
      }))
    } catch (err) {
      console.error('Failed to query pools from Octavia:', err)
      throw err
    }
  },

  async createListener(input: CreateListenerInput): Promise<Listener> {
    try {
      const payload: any = {
        listener: {
          name: input.name,
          protocol: input.protocol,
          protocol_port: input.protocolPort,
          loadbalancer_id: input.loadbalancerId,
        },
      }
      if (input.connectionLimit !== undefined && input.connectionLimit !== null) {
        payload.listener.connection_limit = input.connectionLimit
      }
      const raw = await callProxy('load-balancer', '/v2/lbaas/listeners', 'POST', payload)
      const l = raw.listener
      return {
        id: l.id,
        name: l.name || l.id,
        protocol: l.protocol || 'HTTP',
        protocolPort: l.protocol_port || 80,
        loadbalancers: l.loadbalancers || [{ id: input.loadbalancerId }],
      }
    } catch (err) {
      console.error('Failed to create listener in Octavia:', err)
      throw err
    }
  },

  async createPool(input: CreatePoolInput): Promise<Pool> {
    try {
      const payload: any = {
        pool: {
          name: input.name,
          protocol: input.protocol,
          lb_algorithm: input.lbAlgorithm,
        },
      }
      if (input.listenerId) {
        payload.pool.listener_id = input.listenerId
      } else {
        payload.pool.loadbalancer_id = input.loadbalancerId
      }
      const raw = await callProxy('load-balancer', '/v2/lbaas/pools', 'POST', payload)
      const p = raw.pool
      return {
        id: p.id,
        name: p.name || p.id,
        protocol: p.protocol || 'HTTP',
        lbAlgorithm: p.lb_algorithm || 'ROUND_ROBIN',
        loadbalancers: p.loadbalancers || [{ id: input.loadbalancerId }],
      }
    } catch (err) {
      console.error('Failed to create pool in Octavia:', err)
      throw err
    }
  },

  async createHealthMonitor(input: CreateHealthMonitorInput): Promise<any> {
    try {
      const payload: any = {
        healthmonitor: {
          pool_id: input.poolId,
          type: input.type,
          delay: input.delay,
          timeout: input.timeout,
          max_retries: input.maxRetries,
        },
      }
      if (input.httpMethod) payload.healthmonitor.http_method = input.httpMethod
      if (input.urlPath) payload.healthmonitor.url_path = input.urlPath
      if (input.expectedCodes) payload.healthmonitor.expected_codes = input.expectedCodes
      const raw = await callProxy('load-balancer', '/v2/lbaas/healthmonitors', 'POST', payload)
      return raw.healthmonitor
    } catch (err) {
      console.error('Failed to create health monitor in Octavia:', err)
      throw err
    }
  },

  async getPoolMembers(poolId: string): Promise<PoolMember[]> {
    try {
      const raw = await callProxy('load-balancer', `/v2/lbaas/pools/${poolId}/members`)
      const members = raw.members || []
      return members.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        address: m.address || '',
        protocolPort: m.protocol_port || 80,
        weight: m.weight || 1,
        subnetId: m.subnet_id || '',
        provisioningStatus: m.provisioning_status || 'UNKNOWN',
        operatingStatus: m.operating_status || 'UNKNOWN',
      }))
    } catch (err) {
      console.error(`Failed to query members for pool ${poolId}:`, err)
      throw err
    }
  },

  async createPoolMember(poolId: string, input: CreatePoolMemberInput): Promise<PoolMember> {
    try {
      const payload = {
        member: {
          address: input.address,
          protocol_port: input.protocolPort,
          weight: input.weight ?? 1,
          subnet_id: input.subnetId,
        },
      }
      const raw = await callProxy('load-balancer', `/v2/lbaas/pools/${poolId}/members`, 'POST', payload)
      const m = raw.member
      return {
        id: m.id,
        name: m.name || m.id,
        address: m.address || '',
        protocolPort: m.protocol_port || 80,
        weight: m.weight || 1,
        subnetId: m.subnet_id || '',
        provisioningStatus: m.provisioning_status || 'PENDING_CREATE',
        operatingStatus: m.operating_status || 'OFFLINE',
      }
    } catch (err) {
      console.error(`Failed to create member for pool ${poolId}:`, err)
      throw err
    }
  },

  async deletePoolMember(poolId: string, memberId: string): Promise<void> {
    try {
      await callProxy('load-balancer', `/v2/lbaas/pools/${poolId}/members/${memberId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete member ${memberId} from pool ${poolId}:`, err)
      throw err
    }
  },

  async failoverLoadBalancer(id: string): Promise<void> {
    try {
      await callProxy('load-balancer', `/v2/lbaas/loadbalancers/${id}/failover`, 'PUT', {})
    } catch (err) {
      console.error(`Failed to failover load balancer ${id}:`, err)
      throw err
    }
  },

  async getLoadBalancerStats(id: string): Promise<{ activeConnections: number; bytesIn: number; bytesOut: number; totalConnections: number }> {
    try {
      const raw = await callProxy('load-balancer', `/v2/lbaas/loadbalancers/${id}/stats`)
      const s = raw.stats || {}
      return {
        activeConnections: s.active_connections || 0,
        bytesIn: s.bytes_in || 0,
        bytesOut: s.bytes_out || 0,
        totalConnections: s.total_connections || 0,
      }
    } catch (err) {
      console.error(`Failed to query stats for load balancer ${id}:`, err)
      throw err
    }
  },
}
