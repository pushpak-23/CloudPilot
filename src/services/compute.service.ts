export interface Instance {
  id: string
  name: string
  status: 'Active' | 'Shutoff' | 'Suspended' | 'Paused' | 'Error' | 'Provisioning' | 'Rebuilding' | 'Resizing' | 'Migrating' | 'Rescue' | 'Shelved'
  ip: string
  flavor: string
  image: string
  age: string
  host: string
  statusClass: string
  bulletClass: string
}

export interface Flavor {
  id: string
  name: string
  vcpus: number
  ram: number // MB
  disk: number // GB
  isPublic: boolean
}

export interface Image {
  id: string
  name: string
  diskFormat: string
  containerFormat: string
  minDisk: number // GB
  minRam: number // MB
  size: string
  status: 'Active' | 'Saving' | 'Queued'
  visibility: 'Public' | 'Private'
  properties?: Record<string, string>
}

export interface Hypervisor {
  name: string
  status: 'Up' | 'Down'
  state: 'Enabled' | 'Disabled'
  vcpusUsed: number
  vcpusTotal: number
  ramUsedMb: number
  ramTotalMb: number
  diskUsedGb: number
  diskTotalGb: number
  vmsCount: number
}

export interface Keypair {
  name: string
  fingerprint: string
  publicKey: string
}

export interface ProjectQuotas {
  instances: { limit: number; inUse: number }
  cores: { limit: number; inUse: number }
  ram: { limit: number; inUse: number }
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
  
  // Accept standard or nested user object formats
  const endpoints = user.endpoints || user.user?.endpoints
  const baseUrl = endpoints?.[serviceType]
  
  if (!baseUrl) {
    throw new Error(`Public endpoint for service type "${serviceType}" was not found in Keystone catalog.`)
  }

  // Remove trailing slashes and combine path
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

// Nova status codes helper
export function mapNovaStatus(status: string): Instance['status'] {
  const s = (status || '').toUpperCase()
  if (s === 'ACTIVE') return 'Active'
  if (s === 'SHUTOFF') return 'Shutoff'
  if (s === 'SUSPENDED') return 'Suspended'
  if (s === 'PAUSED') return 'Paused'
  if (s === 'ERROR') return 'Error'
  if (s === 'BUILD') return 'Provisioning'
  if (s === 'REBUILD') return 'Rebuilding'
  if (s === 'RESIZE') return 'Resizing'
  if (s === 'MIGRATING') return 'Migrating'
  if (s === 'RESCUE') return 'Rescue'
  if (s === 'SHELVED' || s === 'SHELVED_OFFLOADED') return 'Shelved'
  return 'Active'
}

// Age calculator helper
function calculateAge(createdStr: string): string {
  try {
    const diff = Date.now() - new Date(createdStr).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) return `${days} days`
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) return `${hours} hours`
    const mins = Math.floor(diff / (1000 * 60))
    return `${mins} minutes`
  } catch (e) {
    return '1 day'
  }
}

// IP extractor helper
function extractIp(addresses: any): string {
  if (!addresses) return '-'
  const ips: string[] = []
  for (const netName in addresses) {
    const list = addresses[netName]
    if (Array.isArray(list)) {
      for (const addrInfo of list) {
        if (addrInfo.addr) {
          if (addrInfo['OS-EXT-IPS:type'] === 'floating') {
            ips.push(`${addrInfo.addr} (Floating)`)
          } else {
            ips.push(addrInfo.addr)
          }
        }
      }
    }
  }
  return ips.length > 0 ? ips.join(', ') : '-'
}

// Status style classes helper
export function mapStatusClasses(status: Instance['status']) {
  if (status === 'Active') {
    return {
      statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      bulletClass: 'bg-emerald-500'
    }
  }
  if (status === 'Shutoff') {
    return {
      statusClass: 'bg-zinc-800 text-zinc-400 border border-zinc-700',
      bulletClass: 'bg-zinc-550'
    }
  }
  if (status === 'Error') {
    return {
      statusClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      bulletClass: 'bg-red-500'
    }
  }
  if (status === 'Rescue') {
    return {
      statusClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      bulletClass: 'bg-amber-500 animate-pulse'
    }
  }
  if (status === 'Shelved') {
    return {
      statusClass: 'bg-zinc-850 text-zinc-450 border border-zinc-700',
      bulletClass: 'bg-zinc-650'
    }
  }
  return {
    statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
    bulletClass: 'bg-blue-500'
  }
}

export function mapNovaServer(server: any): Instance {
  const status = mapNovaStatus(server.status)
  const classes = mapStatusClasses(status)
  return {
    id: server.id,
    name: server.name || 'Unnamed VM',
    status,
    ip: extractIp(server.addresses),
    flavor: server.flavor?.original_name || server.flavor?.name || server.flavor?.id || 'm1.small',
    image: server.image?.name || server.image?.id || 'Ubuntu 22.04 LTS',
    age: calculateAge(server.created),
    host: server['OS-EXT-SRV-ATTR:host'] || '-',
    ...classes
  }
}

export const computeService = {
  async getInstances(): Promise<Instance[]> {
    try {
      const raw = await callProxy('compute', '/servers/detail')
      if (!raw.servers) return []
      return raw.servers.map(mapNovaServer)
    } catch (err) {
      console.error('Failed to query instances from Nova:', err)
      return []
    }
  },

  async launchInstance(
    name: string, 
    flavor: string, 
    image: string, 
    keypair: string,
    networks: string[] = [],
    securityGroups: string[] = [],
    availabilityZone?: string,
    bootSource: string = 'Image',
    volumeSize: number = 0,
    deleteOnTerminate: boolean = true
  ): Promise<Instance> {
    try {
      const payload: any = {
        server: {
          name,
          flavorRef: flavor,
          key_name: keypair || undefined,
          availability_zone: availabilityZone || undefined
        }
      }

      if (bootSource === 'Volume') {
        payload.server.block_device_mapping_v2 = [
          {
            uuid: image,
            source_type: 'volume',
            destination_type: 'volume',
            boot_index: 0,
            delete_on_termination: deleteOnTerminate
          }
        ]
      } else {
        payload.server.imageRef = image
        if (volumeSize > 0) {
          payload.server.block_device_mapping_v2 = [
            {
              uuid: image,
              source_type: 'image',
              destination_type: 'volume',
              volume_size: volumeSize,
              boot_index: 0,
              delete_on_termination: deleteOnTerminate
            }
          ]
        }
      }

      if (networks.length > 0) {
        payload.server.networks = networks.map(id => ({ uuid: id }))
      }
      if (securityGroups.length > 0) {
        payload.server.security_groups = securityGroups.map(name => ({ name }))
      }

      const raw = await callProxy('compute', '/servers', 'POST', payload)
      return {
        id: raw.server?.id || `vm-${Math.random().toString(36).substr(2, 9)}`,
        name,
        status: 'Provisioning',
        ip: '-',
        flavor,
        image,
        age: 'Just now',
        host: '-',
        statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
        bulletClass: 'bg-blue-500'
      }
    } catch (err) {
      console.error('Failed to launch instance in Nova:', err)
      throw err
    }
  },

  async performAction(id: string, actionBody: any): Promise<void> {
    try {
      await callProxy('compute', `/servers/${id}/action`, 'POST', actionBody)
    } catch (err) {
      console.error(`Failed to perform action on instance ${id}:`, err)
      throw err
    }
  },

  async stopInstance(id: string) { await this.performAction(id, { 'os-stop': null }) },
  async startInstance(id: string) { await this.performAction(id, { 'os-start': null }) },
  async rebootInstance(id: string, type: 'SOFT' | 'HARD' = 'SOFT') { await this.performAction(id, { reboot: { type } }) },
  async pauseInstance(id: string) { await this.performAction(id, { pause: null }) },
  async unpauseInstance(id: string) { await this.performAction(id, { unpause: null }) },
  async suspendInstance(id: string) { await this.performAction(id, { suspend: null }) },
  async resumeInstance(id: string) { await this.performAction(id, { resume: null }) },

  async lockServer(id: string) { await this.performAction(id, { lock: null }) },
  async unlockServer(id: string) { await this.performAction(id, { unlock: null }) },
  async rescueServer(id: string) { await this.performAction(id, { rescue: null }) },
  async unrescueServer(id: string) { await this.performAction(id, { unrescue: null }) },
  
  async renameServer(id: string, name: string): Promise<void> {
    try {
      await callProxy('compute', `/servers/${id}`, 'PUT', { server: { name } })
    } catch (err) {
      console.error(`Failed to rename server ${id}:`, err)
      throw err
    }
  },

  async getVncConsole(id: string): Promise<string> {
    try {
      const raw = await callProxy('compute', `/servers/${id}/action`, 'POST', {
        'os-getVNCConsole': { type: 'novnc' }
      })
      return raw.console?.url || ''
    } catch (err) {
      console.error(`Failed to get VNC console for server ${id}:`, err)
      throw err
    }
  },

  async getConsoleLog(id: string, length = 100): Promise<string> {
    try {
      const raw = await callProxy('compute', `/servers/${id}/action`, 'POST', {
        'os-getConsoleOutput': { length }
      })
      return raw.output || ''
    } catch (err) {
      console.error(`Failed to get console output for server ${id}:`, err)
      throw err
    }
  },

  async attachInterface(serverId: string, netId: string): Promise<any> {
    try {
      const raw = await callProxy('compute', `/servers/${serverId}/os-interface`, 'POST', {
        interfaceAttachment: { net_id: netId }
      })
      return raw.interfaceAttachment
    } catch (err) {
      console.error(`Failed to attach interface to server ${serverId}:`, err)
      throw err
    }
  },

  async detachInterface(serverId: string, portId: string): Promise<void> {
    try {
      await callProxy('compute', `/servers/${serverId}/os-interface/${portId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to detach interface ${portId} from server ${serverId}:`, err)
      throw err
    }
  },

  async attachVolume(serverId: string, volumeId: string): Promise<any> {
    try {
      const raw = await callProxy('compute', `/servers/${serverId}/os-volume_attachments`, 'POST', {
        volumeAttachment: { volumeId }
      })
      return raw.volumeAttachment
    } catch (err) {
      console.error(`Failed to attach volume ${volumeId} to server ${serverId}:`, err)
      throw err
    }
  },

  async detachVolume(serverId: string, attachmentId: string): Promise<void> {
    try {
      await callProxy('compute', `/servers/${serverId}/os-volume_attachments/${attachmentId}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to detach volume attachment ${attachmentId} from server ${serverId}:`, err)
      throw err
    }
  },

  async terminateInstance(id: string): Promise<void> {
    try {
      await callProxy('compute', `/servers/${id}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to terminate instance ${id}:`, err)
      throw err
    }
  },

  async getInstanceDetail(id: string): Promise<any> {
    try {
      const raw = await callProxy('compute', `/servers/${id}`)
      return raw.server
    } catch (err) {
      console.error(`Failed to get details for instance ${id}:`, err)
      throw err
    }
  },

  async getFlavors(): Promise<Flavor[]> {
    try {
      const raw = await callProxy('compute', '/flavors/detail')
      if (!raw.flavors) return []
      return raw.flavors.map((f: any) => ({
        id: f.id,
        name: f.name,
        vcpus: f.vcpus || 0,
        ram: f.ram || 0,
        disk: f.disk || 0,
        isPublic: f['os-flavor-access:is_public'] ?? true
      }))
    } catch (err) {
      console.error('Failed to query flavors from Nova:', err)
      return []
    }
  },

  async createFlavor(flavor: Flavor): Promise<Flavor> {
    try {
      const payload = {
        flavor: {
          name: flavor.name,
          ram: flavor.ram,
          vcpus: flavor.vcpus,
          disk: flavor.disk,
          id: flavor.id || undefined,
          'os-flavor-access:is_public': flavor.isPublic
        }
      }
      await callProxy('compute', '/flavors', 'POST', payload)
      return flavor
    } catch (err) {
      console.error('Failed to create flavor in Nova:', err)
      throw err
    }
  },

  async getImages(): Promise<Image[]> {
    try {
      const raw = await callProxy('image', '/v2/images')
      if (!raw.images) return []
      
      const baseKeys = new Set([
        'id', 'name', 'status', 'visibility', 'size', 'disk_format', 'container_format',
        'min_disk', 'min_ram', 'owner', 'created_at', 'updated_at', 'file', 'locations',
        'schema', 'tags', 'checksum', 'virtual_size', 'protected', 'self', 'direct_url'
      ])

      return raw.images.map((img: any) => {
        const properties: Record<string, string> = {}
        for (const k in img) {
          if (!baseKeys.has(k) && typeof img[k] !== 'object' && img[k] !== null && img[k] !== undefined) {
            properties[k] = String(img[k])
          }
        }
        return {
          id: img.id,
          name: img.name || 'Unnamed Image',
          diskFormat: img.disk_format || 'raw',
          containerFormat: img.container_format || 'bare',
          minDisk: img.min_disk || 0,
          minRam: img.min_ram || 0,
          size: img.size ? `${(img.size / 1024 / 1024 / 1024).toFixed(1)} GB` : '0 GB',
          status: img.status === 'active' ? 'Active' : img.status === 'saving' ? 'Saving' : 'Queued',
          visibility: img.visibility === 'public' ? 'Public' : 'Private',
          properties
        }
      })
    } catch (err) {
      console.error('Failed to query images from Glance:', err)
      return []
    }
  },

  async updateImageMetadata(imageId: string, patches: { op: 'add' | 'remove'; path: string; value?: any }[]): Promise<any> {
    try {
      const raw = await callProxy('image', `/v2/images/${imageId}`, 'PATCH', patches)
      return raw
    } catch (err) {
      console.error(`Failed to patch metadata for image ${imageId}:`, err)
      throw err
    }
  },

  async uploadImage(image: Image): Promise<Image> {
    // Currently returns mock representation or forwards upload config metadata
    return image
  },

  async getHypervisors(): Promise<Hypervisor[]> {
    try {
      const raw = await callProxy('compute', '/os-hypervisors/detail')
      if (!raw.hypervisors) return []
      return raw.hypervisors.map((h: any) => ({
        name: h.hypervisor_hostname || h.id || 'compute-node',
        status: h.state === 'up' ? 'Up' : 'Down',
        state: h.status === 'enabled' ? 'Enabled' : 'Disabled',
        vcpusUsed: h.vcpus_used || 0,
        vcpusTotal: h.vcpus || 1,
        ramUsedMb: h.memory_mb_used || 0,
        ramTotalMb: h.memory_mb || 1,
        diskUsedGb: h.local_gb_used || 0,
        diskTotalGb: h.local_gb || 1,
        vmsCount: h.running_vms || 0
      }))
    } catch (err) {
      console.error('Failed to query hypervisors from Nova (admin-only):', err)
      return []
    }
  },

  async getKeypairs(): Promise<Keypair[]> {
    try {
      const raw = await callProxy('compute', '/os-keypairs')
      if (!raw.keypairs) return []
      return raw.keypairs.map((k: any) => ({
        name: k.keypair.name,
        fingerprint: k.keypair.fingerprint || '',
        publicKey: k.keypair.public_key || ''
      }))
    } catch (err) {
      console.error('Failed to query SSH keypairs from Nova:', err)
      return []
    }
  },

  async createKeypair(name: string): Promise<Keypair> {
    try {
      const raw = await callProxy('compute', '/os-keypairs', 'POST', { keypair: { name } })
      return {
        name: raw.keypair.name,
        fingerprint: raw.keypair.fingerprint || '',
        publicKey: raw.keypair.public_key || ''
      }
    } catch (err) {
      console.error('Failed to create SSH keypair in Nova:', err)
      throw err
    }
  },

  async getQuotas(): Promise<ProjectQuotas> {
    try {
      const { user } = getSession()
      const projectId = user.project_id || user.user?.project_id
      if (!projectId) {
        throw new Error('Project ID not found in session.')
      }
      const raw = await callProxy('compute', `/os-quota-sets/${projectId}/detail`)
      const q = raw.quota_set || {}
      return {
        instances: {
          limit: q.instances?.limit ?? 10,
          inUse: q.instances?.in_use ?? 0
        },
        cores: {
          limit: q.cores?.limit ?? 20,
          inUse: q.cores?.in_use ?? 0
        },
        ram: {
          limit: q.ram?.limit ?? 51200,
          inUse: q.ram?.in_use ?? 0
        }
      }
    } catch (err) {
      console.error('Failed to query project quotas from Nova:', err)
      return {
        instances: { limit: 10, inUse: 2 },
        cores: { limit: 20, inUse: 4 },
        ram: { limit: 51200, inUse: 8192 }
      }
    }
  },

  async getAvailabilityZones(): Promise<string[]> {
    const parseZones = (raw: any): string[] => {
      // Unwrap proxy wrapper: some proxy setups nest the response in raw.data
      const body = raw?.data || raw
      console.log('[CloudPilot] AZ raw response keys:', Object.keys(body || {}))
      console.log('[CloudPilot] AZ raw response:', JSON.stringify(body).slice(0, 500))

      const info = body?.availabilityZoneInfo || body?.availability_zones || body?.availabilityZones || []
      if (!Array.isArray(info)) return []

      return info
        .map((z: any) => {
          if (typeof z === 'string') return z
          return z.zoneName || z.name || z.zone_name
        })
        .filter((name: any): name is string => typeof name === 'string' && name.length > 0)
    }

    try {
      // Try standard endpoint first
      const raw = await callProxy('compute', '/os-availability-zone')
      let zones = parseZones(raw)
      if (zones.length > 0) return zones

      // Fallback: try the /detail variant (includes all zones, including internal)
      try {
        const rawDetail = await callProxy('compute', '/os-availability-zone/detail')
        zones = parseZones(rawDetail)
        if (zones.length > 0) return zones
      } catch (_) {
        // /detail may require admin — ignore
      }

      return ['nova']
    } catch (err) {
      console.error('Failed to query availability zones from Nova:', err)
      return ['nova']
    }
  }
}
