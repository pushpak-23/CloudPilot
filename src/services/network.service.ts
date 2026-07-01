export interface NetworkConfig {
  id: string
  name: string
  subnet: string
  subnetId?: string | null
  gateway: string
  shared: boolean
  external: boolean
}

export interface CreateNetworkInput {
  name: string
  subnet: string
  gateway: string
  shared: boolean
  external: boolean
  subnetName?: string
  enableDhcp?: boolean
}

export interface NetworkRouter {
  id: string
  name: string
  status: string
  adminStateUp: boolean
  distributed: boolean
  ha: boolean
  externalNetworkId: string | null
  externalNetworkName: string | null
}

export interface CreateRouterInput {
  name: string
  externalNetworkId?: string | null
  attachSubnetId?: string | null
  adminStateUp?: boolean
}

export interface UpdateNetworkInput {
  name?: string
  subnet?: string
  gateway?: string
  shared?: boolean
  external?: boolean
}

export interface UpdateRouterInput {
  name?: string
  adminStateUp?: boolean
  externalNetworkId?: string | null
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

  const response = await fetch('http://localhost:8080/api/v1/proxy', {
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
          subnetId: subInfo ? (subInfo as any).id : subnetId || null,
          gateway: subInfo ? (subInfo as any).gateway_ip : '-',
          shared: net.shared ?? false,
          external: net['router:external'] ?? false,
        }
      })
    } catch (err) {
      console.error('Failed to query networks from Neutron:', err)
      throw err
    }
  },

  async createNetwork(net: CreateNetworkInput): Promise<NetworkConfig> {
    try {
      const payload = {
        network: {
          name: net.name,
          shared: net.shared,
          'router:external': net.external,
        },
      }
      const raw = await callProxy('network', '/v2.0/networks', 'POST', payload)
      const networkId =
        raw.network?.id || `net-${Math.random().toString(36).substr(2, 9)}`
      const subnetName = net.subnetName || `${net.name}-subnet`

      const subnetRaw = await callProxy('network', '/v2.0/subnets', 'POST', {
        subnet: {
          name: subnetName,
          network_id: networkId,
          ip_version: 4,
          cidr: net.subnet,
          gateway_ip: net.gateway,
          enable_dhcp: net.enableDhcp ?? true,
        },
      })

      return {
        ...net,
        id: networkId,
        subnetId: subnetRaw.subnet?.id || null,
        subnet: net.subnet,
        gateway: net.gateway,
      }
    } catch (err) {
      console.error('Failed to create network in Neutron:', err)
      throw err
    }
  },

  async updateNetwork(
    networkId: string,
    changes: UpdateNetworkInput
  ): Promise<NetworkConfig> {
    try {
      const payload: any = { network: {} }
      if (typeof changes.name === 'string') payload.network.name = changes.name
      if (typeof changes.shared === 'boolean')
        payload.network.shared = changes.shared
      if (typeof changes.external === 'boolean')
        payload.network['router:external'] = changes.external

      const raw = await callProxy(
        'network',
        `/v2.0/networks/${networkId}`,
        'PUT',
        payload
      )
      const updated = raw.network || {}
      return {
        id: updated.id || networkId,
        name: updated.name || changes.name || 'Unnamed Network',
        subnet: changes.subnet || '-',
        subnetId: null,
        gateway: changes.gateway || '-',
        shared: updated.shared ?? changes.shared ?? false,
        external: updated['router:external'] ?? changes.external ?? false,
      }
    } catch (err) {
      console.error(`Failed to update network ${networkId}:`, err)
      throw err
    }
  },

  async deleteNetwork(
    networkId: string,
    subnetId?: string | null
  ): Promise<void> {
    try {
      if (subnetId) {
        await callProxy('network', `/v2.0/subnets/${subnetId}`, 'DELETE')
      }
      await callProxy('network', `/v2.0/networks/${networkId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete network ${networkId}:`, err)
      throw err
    }
  },

  async getPortsForServer(serverId: string): Promise<any[]> {
    try {
      const raw = await callProxy(
        'network',
        `/v2.0/ports?device_id=${serverId}`
      )
      return raw.ports || []
    } catch (err) {
      console.error(`Failed to get ports for server ${serverId}:`, err)
      throw err
    }
  },

  async getPortsForNetwork(networkId: string): Promise<any[]> {
    try {
      const raw = await callProxy(
        'network',
        `/v2.0/ports?network_id=${networkId}`
      )
      return raw.ports || []
    } catch (err) {
      console.error(`Failed to get ports for network ${networkId}:`, err)
      throw err
    }
  },

  async getRouters(): Promise<NetworkRouter[]> {
    try {
      const raw = await callProxy('network', '/v2.0/routers')
      const routers = raw.routers || []
      return routers.map((router: any) => ({
        id: router.id,
        name: router.name || router.id || 'Unnamed Router',
        status: router.status || 'ACTIVE',
        adminStateUp: router.admin_state_up ?? true,
        distributed: router.distributed ?? false,
        ha: router.ha ?? false,
        externalNetworkId: router.external_gateway_info?.network_id || null,
        externalNetworkName: router.external_gateway_info?.network_name || null,
      }))
    } catch (err) {
      console.error('Failed to query routers from Neutron:', err)
      throw err
    }
  },

  async createRouter(router: CreateRouterInput): Promise<NetworkRouter> {
    try {
      const payload: any = {
        router: {
          name: router.name,
          admin_state_up: router.adminStateUp ?? true,
        },
      }

      if (router.externalNetworkId) {
        payload.router.external_gateway_info = {
          network_id: router.externalNetworkId,
        }
      }

      const raw = await callProxy('network', '/v2.0/routers', 'POST', payload)
      const created = raw.router

      if (created?.id && router.attachSubnetId) {
        await callProxy(
          'network',
          `/v2.0/routers/${created.id}/add_router_interface`,
          'POST',
          {
            subnet_id: router.attachSubnetId,
          }
        )
      }

      return {
        id: created?.id || `router-${Math.random().toString(36).substr(2, 9)}`,
        name: created?.name || router.name,
        status: created?.status || 'ACTIVE',
        adminStateUp: created?.admin_state_up ?? true,
        distributed: created?.distributed ?? false,
        ha: created?.ha ?? false,
        externalNetworkId:
          created?.external_gateway_info?.network_id ||
          router.externalNetworkId ||
          null,
        externalNetworkName:
          created?.external_gateway_info?.network_name || null,
      }
    } catch (err) {
      console.error('Failed to create router in Neutron:', err)
      throw err
    }
  },

  async updateRouter(
    routerId: string,
    changes: UpdateRouterInput
  ): Promise<NetworkRouter> {
    try {
      const payload: any = { router: {} }
      if (typeof changes.name === 'string') payload.router.name = changes.name
      if (typeof changes.adminStateUp === 'boolean')
        payload.router.admin_state_up = changes.adminStateUp
      if (typeof changes.externalNetworkId !== 'undefined') {
        payload.router.external_gateway_info = changes.externalNetworkId
          ? { network_id: changes.externalNetworkId }
          : null
      }

      const raw = await callProxy(
        'network',
        `/v2.0/routers/${routerId}`,
        'PUT',
        payload
      )
      const updated = raw.router || {}
      return {
        id: updated.id || routerId,
        name: updated.name || changes.name || 'Unnamed Router',
        status: updated.status || 'ACTIVE',
        adminStateUp: updated.admin_state_up ?? changes.adminStateUp ?? true,
        distributed: updated.distributed ?? false,
        ha: updated.ha ?? false,
        externalNetworkId:
          updated.external_gateway_info?.network_id ||
          changes.externalNetworkId ||
          null,
        externalNetworkName:
          updated.external_gateway_info?.network_name || null,
      }
    } catch (err) {
      console.error(`Failed to update router ${routerId}:`, err)
      throw err
    }
  },

  async deleteRouter(routerId: string): Promise<void> {
    try {
      await callProxy('network', `/v2.0/routers/${routerId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete router ${routerId}:`, err)
      throw err
    }
  },

  async addRouterInterface(routerId: string, subnetId: string): Promise<any> {
    try {
      const raw = await callProxy(
        'network',
        `/v2.0/routers/${routerId}/add_router_interface`,
        'POST',
        {
          subnet_id: subnetId,
        }
      )
      return raw
    } catch (err) {
      console.error(`Failed to add router interface on ${routerId}:`, err)
      throw err
    }
  },

  async removeRouterInterface(
    routerId: string,
    subnetId?: string,
    portId?: string
  ): Promise<any> {
    try {
      const payload: any = {}
      if (subnetId) payload.subnet_id = subnetId
      if (portId) payload.port_id = portId
      const raw = await callProxy(
        'network',
        `/v2.0/routers/${routerId}/remove_router_interface`,
        'PUT',
        payload
      )
      return raw
    } catch (err) {
      console.error(`Failed to remove router interface on ${routerId}:`, err)
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

  async updatePortSecurityGroups(
    portId: string,
    securityGroupIds: string[]
  ): Promise<void> {
    try {
      const payload = {
        port: {
          security_groups: securityGroupIds,
        },
      }
      await callProxy('network', `/v2.0/ports/${portId}`, 'PUT', payload)
    } catch (err) {
      console.error(`Failed to update security groups for port ${portId}:`, err)
      throw err
    }
  },

  async createSecurityGroupRule(payload: any): Promise<any> {
    try {
      const raw = await callProxy(
        'network',
        '/v2.0/security-group-rules',
        'POST',
        {
          security_group_rule: payload,
        }
      )
      return raw.security_group_rule
    } catch (err) {
      console.error('Failed to create security group rule in Neutron:', err)
      throw err
    }
  },

  async deleteSecurityGroupRule(ruleId: string): Promise<void> {
    try {
      await callProxy(
        'network',
        `/v2.0/security-group-rules/${ruleId}`,
        'DELETE'
      )
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

  async allocateFloatingIp(externalNetworkId: string): Promise<any> {
    try {
      const raw = await callProxy('network', '/v2.0/floatingips', 'POST', {
        floatingip: {
          floating_network_id: externalNetworkId,
        },
      })
      return raw.floatingip
    } catch (err) {
      console.error('Failed to allocate floating IP from Neutron:', err)
      throw err
    }
  },

  async releaseFloatingIp(fipId: string): Promise<void> {
    try {
      await callProxy('network', `/v2.0/floatingips/${fipId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to release floating IP ${fipId}:`, err)
      throw err
    }
  },

  async associateFloatingIp(
    fipId: string,
    portId: string | null
  ): Promise<any> {
    try {
      const payload = {
        floatingip: {
          port_id: portId,
        },
      }
      const raw = await callProxy(
        'network',
        `/v2.0/floatingips/${fipId}`,
        'PUT',
        payload
      )
      return raw.floatingip
    } catch (err) {
      console.error(
        `Failed to associate floating IP ${fipId} to port ${portId}:`,
        err
      )
      throw err
    }
  },
}
