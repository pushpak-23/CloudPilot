export interface Volume {
  id: string
  name: string
  status: 'In-Use' | 'Available' | 'Creating' | 'Error'
  size: string
  rawSize: number // GB
  type: string
  attachedTo: string
  statusClass: string
  bulletClass: string
  availabilityZone?: string
  createdAt?: string
  description?: string
  attachments?: any[]
}

export interface VolumeSnapshot {
  id: string
  name: string
  description: string
  volumeId: string
  status: string
  size: number
  createdAt: string
}

export interface VolumeBackup {
  id: string
  name: string
  description: string
  volumeId: string
  status: string
  size: number
  createdAt: string
}

function normalizeVolumeTypeName(type: any): string | null {
  if (!type) return null
  if (typeof type === 'string') return type.trim() || null
  if (typeof type === 'number') return String(type)
  if (typeof type === 'object') {
    return (
      type.name ||
      type.volume_type ||
      type.volumeType ||
      type.description ||
      type.id ||
      null
    )
  }
  return null
}

function extractVolumeTypes(raw: any): string[] {
  const buckets = [
    raw?.volume_types,
    raw?.types,
    raw?.volume_type,
    raw?.volumeTypes,
    raw?.data,
    raw?.items,
  ]

  const collected = new Set<string>()

  for (const bucket of buckets) {
    if (!Array.isArray(bucket)) continue
    for (const item of bucket) {
      const normalized = normalizeVolumeTypeName(item)
      if (
        normalized &&
        normalized !== '__default__' &&
        normalized.toLowerCase() !== 'default'
      ) {
        collected.add(normalized)
      }
    }
  }

  return Array.from(collected)
}

// Session extraction helpers (shared pattern)
function getSession() {
  const token = localStorage.getItem('cp_token')
  const userStr = localStorage.getItem('cp_user')
  if (!token || !userStr) {
    throw new Error('Not authenticated with Keystone. Log in first.')
  }
  const user = JSON.parse(userStr)
  return { token, user }
}

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

function mapVolumeStatus(status: string): Volume['status'] {
  const s = (status || '').toLowerCase()
  if (s === 'in-use') return 'In-Use'
  if (s === 'available') return 'Available'
  if (s === 'creating') return 'Creating'
  if (s === 'error' || s.startsWith('error')) return 'Error'
  return 'Available'
}

function mapStatusClasses(status: Volume['status']) {
  if (status === 'In-Use') {
    return {
      statusClass:
        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      bulletClass: 'bg-emerald-500',
    }
  }
  if (status === 'Available') {
    return {
      statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      bulletClass: 'bg-blue-500',
    }
  }
  if (status === 'Error') {
    return {
      statusClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      bulletClass: 'bg-red-500',
    }
  }
  return {
    statusClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    bulletClass: 'bg-amber-500 animate-pulse',
  }
}

export const storageService = {
  async getVolumes(): Promise<Volume[]> {
    try {
      const raw = await callProxy('volumev3', '/volumes/detail')
      if (!raw.volumes) return []
      return raw.volumes.map((v: any) => {
        const status = mapVolumeStatus(v.status)
        const classes = mapStatusClasses(status)
        const sizeGb = v.size || 0
        const sizeStr =
          sizeGb >= 1024 ? `${(sizeGb / 1024).toFixed(1)} TB` : `${sizeGb} GB`

        // Extract attachment info
        let attachedTo = 'None (Unattached)'
        if (v.attachments && v.attachments.length > 0) {
          attachedTo = v.attachments[0].server_id || 'Attached'
        }

        const volumeType =
          normalizeVolumeTypeName(v.volume_type) ||
          normalizeVolumeTypeName(v.type) ||
          'default'

        return {
          id: v.id,
          name: v.name || v.id || 'Unnamed Volume',
          status,
          size: sizeStr,
          rawSize: sizeGb,
          type: volumeType,
          attachedTo,
          availabilityZone: v.availability_zone,
          createdAt: v.created_at,
          description: v.description || '-',
          attachments: v.attachments || [],
          ...classes,
        }
      })
    } catch (err) {
      console.error('Failed to query volumes from Cinder:', err)
      throw err
    }
  },

  async createVolume(
    name: string,
    sizeGb: number,
    type: string
  ): Promise<Volume> {
    try {
      const payload = {
        volume: {
          name,
          size: sizeGb,
          volume_type: type === '__default__' ? null : type,
        },
      }
      const raw = await callProxy('volumev3', '/volumes', 'POST', payload)
      const sizeStr =
        sizeGb >= 1024 ? `${(sizeGb / 1024).toFixed(1)} TB` : `${sizeGb} GB`
      return {
        id: raw.volume?.id || `vol-${Math.random().toString(36).substr(2, 9)}`,
        name,
        status: 'Creating',
        size: sizeStr,
        rawSize: sizeGb,
        type: type || 'default',
        attachedTo: 'None (Unattached)',
        availabilityZone: raw.volume?.availability_zone || 'nova',
        createdAt: raw.volume?.created_at || new Date().toISOString(),
        description: raw.volume?.description || '-',
        attachments: [],
        statusClass:
          'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        bulletClass: 'bg-amber-500 animate-pulse',
      }
    } catch (err) {
      console.error('Failed to create volume in Cinder:', err)
      throw err
    }
  },

  async deleteVolume(id: string): Promise<void> {
    try {
      await callProxy('volumev3', `/volumes/${id}`, 'DELETE')
    } catch (err) {
      console.error(`Failed to delete volume ${id}:`, err)
      throw err
    }
  },

  async extendVolume(id: string, newSizeGb: number): Promise<void> {
    try {
      await callProxy('volumev3', `/volumes/${id}/action`, 'POST', {
        'os-extend': { new_size: newSizeGb },
      })
    } catch (err) {
      console.error(`Failed to extend volume ${id}:`, err)
      throw err
    }
  },

  async getVolumeTypes(): Promise<string[]> {
    try {
      const candidatePaths = ['/types/detail', '/types', '/os-volume-types']

      for (const path of candidatePaths) {
        try {
          const raw = await callProxy('volumev3', path)
          const types = extractVolumeTypes(raw)
          if (types.length > 0) {
            return types
          }
        } catch (err) {
          console.warn(
            `Failed to query volume types from Cinder at ${path}:`,
            err
          )
        }
      }

      const volumes = await this.getVolumes()
      return Array.from(
        new Set(
          volumes
            .map((volume) => volume.type)
            .filter(
              (type) => type && type !== 'default' && type !== '__default__'
            )
        )
      )
    } catch (err) {
      console.warn('Failed to query volume types from Cinder:', err)
      return []
    }
  },

  async getSnapshots(): Promise<VolumeSnapshot[]> {
    try {
      const raw = await callProxy('volumev3', '/snapshots/detail')
      if (!raw.snapshots) return []
      return raw.snapshots.map((s: any) => ({
        id: s.id,
        name: s.name || s.id || 'Unnamed Snapshot',
        description: s.description || '-',
        volumeId: s.volume_id,
        status: s.status,
        size: s.size || 0,
        createdAt: s.created_at,
      }))
    } catch (err) {
      console.warn('Failed to query snapshots from Cinder, using local mock data:', err)
      const localMocks = localStorage.getItem('cp_snapshots')
      return localMocks ? JSON.parse(localMocks) : []
    }
  },

  async createSnapshot(volumeId: string, name: string, description: string): Promise<VolumeSnapshot> {
    try {
      const payload = {
        snapshot: {
          volume_id: volumeId,
          name,
          description,
        },
      }
      const raw = await callProxy('volumev3', '/snapshots', 'POST', payload)
      return {
        id: raw.snapshot?.id || `snap-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        volumeId,
        status: 'available',
        size: raw.snapshot?.size || 10,
        createdAt: raw.snapshot?.created_at || new Date().toISOString(),
      }
    } catch (err) {
      console.warn('Failed to create snapshot in Cinder, fallback to local storage:', err)
      const snap: VolumeSnapshot = {
        id: `snap-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        volumeId,
        status: 'available',
        size: 20,
        createdAt: new Date().toISOString(),
      }
      const localMocks = localStorage.getItem('cp_snapshots')
      const current = localMocks ? JSON.parse(localMocks) : []
      current.push(snap)
      localStorage.setItem('cp_snapshots', JSON.stringify(current))
      return snap
    }
  },

  async deleteSnapshot(id: string): Promise<void> {
    try {
      await callProxy('volumev3', `/snapshots/${id}`, 'DELETE')
    } catch (err) {
      console.warn('Failed to delete snapshot in Cinder, fallback to local storage:', err)
      const localMocks = localStorage.getItem('cp_snapshots')
      if (localMocks) {
        let current = JSON.parse(localMocks)
        current = current.filter((s: any) => s.id !== id)
        localStorage.setItem('cp_snapshots', JSON.stringify(current))
      }
    }
  },

  async getBackups(): Promise<VolumeBackup[]> {
    try {
      const raw = await callProxy('volumev3', '/backups/detail')
      if (!raw.backups) return []
      return raw.backups.map((b: any) => ({
        id: b.id,
        name: b.name || b.id || 'Unnamed Backup',
        description: b.description || '-',
        volumeId: b.volume_id,
        status: b.status,
        size: b.size || 0,
        createdAt: b.created_at,
      }))
    } catch (err) {
      console.warn('Failed to query backups from Cinder, using local mock data:', err)
      const localMocks = localStorage.getItem('cp_backups')
      return localMocks ? JSON.parse(localMocks) : []
    }
  },

  async createBackup(volumeId: string, name: string, description: string): Promise<VolumeBackup> {
    try {
      const payload = {
        backup: {
          volume_id: volumeId,
          name,
          description,
        },
      }
      const raw = await callProxy('volumev3', '/backups', 'POST', payload)
      return {
        id: raw.backup?.id || `bk-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        volumeId,
        status: 'available',
        size: raw.backup?.size || 10,
        createdAt: raw.backup?.created_at || new Date().toISOString(),
      }
    } catch (err) {
      console.warn('Failed to create backup in Cinder, fallback to local storage:', err)
      const bk: VolumeBackup = {
        id: `bk-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        volumeId,
        status: 'available',
        size: 50,
        createdAt: new Date().toISOString(),
      }
      const localMocks = localStorage.getItem('cp_backups')
      const current = localMocks ? JSON.parse(localMocks) : []
      current.push(bk)
      localStorage.setItem('cp_backups', JSON.stringify(current))
      return bk
    }
  },

  async deleteBackup(id: string): Promise<void> {
    try {
      await callProxy('volumev3', `/backups/${id}`, 'DELETE')
    } catch (err) {
      console.warn('Failed to delete backup in Cinder, fallback to local storage:', err)
      const localMocks = localStorage.getItem('cp_backups')
      if (localMocks) {
        let current = JSON.parse(localMocks)
        current = current.filter((b: any) => b.id !== id)
        localStorage.setItem('cp_backups', JSON.stringify(current))
      }
    }
  },

  async restoreBackup(id: string, volumeId?: string): Promise<void> {
    try {
      const payload = {
        restore: {
          volume_id: volumeId || null
        }
      }
      await callProxy('volumev3', `/backups/${id}/restore`, 'POST', payload)
    } catch (err) {
      console.error(`Failed to restore backup ${id} in Cinder:`, err)
      throw err
    }
  }
}
