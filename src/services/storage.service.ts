export interface Volume {
  id: string
  name: string
  status: 'In-Use' | 'Available' | 'Creating' | 'Error'
  size: string
  type: string
  attachedTo: string
  statusClass: string
  bulletClass: string
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
      statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      bulletClass: 'bg-emerald-500'
    }
  }
  if (status === 'Available') {
    return {
      statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      bulletClass: 'bg-blue-500'
    }
  }
  if (status === 'Error') {
    return {
      statusClass: 'bg-red-500/10 text-red-400 border border-red-500/20',
      bulletClass: 'bg-red-500'
    }
  }
  return {
    statusClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    bulletClass: 'bg-amber-500'
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
        const sizeStr = sizeGb >= 1024 ? `${(sizeGb / 1024).toFixed(1)} TB` : `${sizeGb} GB`

        // Extract attachment info
        let attachedTo = 'None (Unattached)'
        if (v.attachments && v.attachments.length > 0) {
          attachedTo = v.attachments[0].server_id || 'Attached'
        }

        return {
          id: v.id,
          name: v.name || v.id || 'Unnamed Volume',
          status,
          size: sizeStr,
          type: v.volume_type || 'default',
          attachedTo,
          ...classes
        }
      })
    } catch (err) {
      console.error('Failed to query volumes from Cinder:', err)
      throw err
    }
  },

  async createVolume(name: string, sizeGb: number, type: string): Promise<Volume> {
    try {
      const payload = {
        volume: {
          name,
          size: sizeGb,
          volume_type: type || null
        }
      }
      const raw = await callProxy('volumev3', '/volumes', 'POST', payload)
      const sizeStr = sizeGb >= 1024 ? `${(sizeGb / 1024).toFixed(1)} TB` : `${sizeGb} GB`
      return {
        id: raw.volume?.id || `vol-${Math.random().toString(36).substr(2, 9)}`,
        name,
        status: 'Creating',
        size: sizeStr,
        type: type || 'default',
        attachedTo: 'None (Unattached)',
        statusClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        bulletClass: 'bg-amber-500'
      }
    } catch (err) {
      console.error('Failed to create volume in Cinder:', err)
      throw err
    }
  }
}
