export interface NetworkConfig {
  id: string
  name: string
  subnet: string
  gateway: string
  shared: boolean
  external: boolean
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
async function callProxy(serviceType: string, path: string, method: string = 'GET', body?: any) {
  const { token, user } = getSession()
  const endpoints = user.endpoints || user.user?.endpoints
  const baseUrl = endpoints?.[serviceType]
  
  if (!baseUrl) {
    throw new Error(`Public endpoint for service type "${serviceType}" was not found in Keystone catalog.`)
  }

  const sanitizedBase = baseUrl.replace(/\/+$/, '')
  const url = `${sanitizedBase}${path}`

  const response = await fetch('http://localhost:8080/api/v1/proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token
    },
    body: JSON.stringify({ url, method, body })
  })

  const data = await response.json()
  if (!response.ok || data.success === false) {
    const errMsg = data?.error?.message || data?.raw_response || 'Gateway proxy query failed'
    throw new Error(errMsg)
  }
  return data
}

export const networkService = {
  async getNetworks(): Promise<NetworkConfig[]> {
    try {
      const netsRaw = await callProxy('network', '/v2.0/networks')
      const subnetsRaw = await callProxy('network', '/v2.0/subnets')
      
      const networks = netsRaw.networks || []
      const subnets = subnetsRaw.subnets || []
      
      const subnetsMap = new Map(subnets.map((s: any) => [s.id, s]))
      
      return networks.map((net: any) => {
        const subnetId = net.subnets?.[0]
        const subInfo = subnetId ? subnetsMap.get(subnetId) : null
        
        return {
          id: net.id,
          name: net.name || net.id || 'Unnamed Network',
          subnet: subInfo ? (subInfo as any).cidr : '-',
          gateway: subInfo ? (subInfo as any).gateway_ip : '-',
          shared: net.shared ?? false,
          external: net['router:external'] ?? false
        }
      })
    } catch (err) {
      console.error('Failed to query networks from Neutron:', err)
      throw err
    }
  },

  async createNetwork(net: Omit<NetworkConfig, 'id'>): Promise<NetworkConfig> {
    try {
      const payload = {
        network: {
          name: net.name,
          shared: net.shared,
          'router:external': net.external
        }
      }
      const raw = await callProxy('network', '/v2.0/networks', 'POST', payload)
      return {
        ...net,
        id: raw.network?.id || `net-${Math.random().toString(36).substr(2, 9)}`
      }
    } catch (err) {
      console.error('Failed to create network in Neutron:', err)
      throw err
    }
  },

  async getPortsForServer(serverId: string): Promise<any[]> {
    try {
      const raw = await callProxy('network', `/v2.0/ports?device_id=${serverId}`)
      return raw.ports || []
    } catch (err) {
      console.error(`Failed to get ports for server ${serverId}:`, err)
      throw err
    }
  },

  async getSecurityGroups(): Promise<any[]> {
    try {
      const raw = await callProxy('network', '/v2.0/security-groups')
      return raw.security_groups || []
    } catch (err) {
      console.error('Failed to query security groups from Neutron:', err)
      throw err
    }
  },

  async updatePortSecurityGroups(portId: string, securityGroupIds: string[]): Promise<void> {
    try {
      const payload = {
        port: {
          security_groups: securityGroupIds
        }
      }
      await callProxy('network', `/v2.0/ports/${portId}`, 'PUT', payload)
    } catch (err) {
      console.error(`Failed to update security groups for port ${portId}:`, err)
      throw err
    }
  },

  async createSecurityGroupRule(payload: any): Promise<any> {
    try {
      const raw = await callProxy('network', '/v2.0/security-group-rules', 'POST', {
        security_group_rule: payload
      })
      return raw.security_group_rule
    } catch (err) {
      console.error('Failed to create security group rule in Neutron:', err)
      throw err
    }
  },

  async deleteSecurityGroupRule(ruleId: string): Promise<void> {
    try {
      await callProxy('network', `/v2.0/security-group-rules/${ruleId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete security group rule ${ruleId}:`, err)
      throw err
    }
  },

  async getFloatingIps(): Promise<any[]> {
    try {
      const raw = await callProxy('network', '/v2.0/floatingips')
      return raw.floatingips || []
    } catch (err) {
      console.error('Failed to get floating IPs from Neutron:', err)
      throw err
    }
  },

  async associateFloatingIp(fipId: string, portId: string | null): Promise<any> {
    try {
      const payload = {
        floatingip: {
          port_id: portId
        }
      }
      const raw = await callProxy('network', `/v2.0/floatingips/${fipId}`, 'PUT', payload)
      return raw.floatingip
    } catch (err) {
      console.error(`Failed to associate floating IP ${fipId} to port ${portId}:`, err)
      throw err
    }
  }
}
