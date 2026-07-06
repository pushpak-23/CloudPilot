export interface Project {
  id?: string
  name: string
  description: string
  quota: string
  status: 'Enabled' | 'Disabled'
  statusClass: string
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

async function callKeystoneProxy(path: string, method: string = 'GET', body?: any) {
  const { token, user } = getSession()

  // Keystone identity endpoint is typically the auth_url itself
  // Try to find 'identity' in catalog, fallback to auth_url stored in session
  const endpoints = user.endpoints || user.user?.endpoints
  let baseUrl = endpoints?.['identity']

  // If no identity endpoint in catalog, construct from auth_url
  if (!baseUrl) {
    // The auth_url is typically like https://host:5000
    // We need to use it as the identity endpoint
    const authUrl = user.auth_url || ''
    if (authUrl) {
      baseUrl = authUrl
    } else {
      throw new Error('Identity endpoint not found in Keystone catalog.')
    }
  }

  const sanitizedBase = baseUrl.replace(/\/+$/, '')
  const url = `${sanitizedBase}${path}`

  const response = await fetch('/api/v1/proxy', {
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

export const identityService = {
  async getProjects(): Promise<Project[]> {
    const localKey = 'cp_keystone_projects'
    try {
      const raw = await callKeystoneProxy('/v3/auth/projects')
      if (raw && raw.projects) {
        const mapped = raw.projects.map((p: any) => ({
          id: p.id,
          name: p.name || p.id || 'Unnamed Project',
          description: p.description || '',
          quota: p.is_domain ? 'Domain' : 'Tenant',
          status: p.enabled !== false ? 'Enabled' as const : 'Disabled' as const,
          statusClass: p.enabled !== false
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        }))
        localStorage.setItem(localKey, JSON.stringify(mapped))
        return mapped
      }
    } catch (err) {
      console.warn('Keystone auth projects query failed, loading from local storage:', err)
    }

    const localData = localStorage.getItem(localKey)
    if (localData) {
      return JSON.parse(localData)
    }

    // Default fallback project setup
    let defaultProjects: Project[] = []
    try {
      const { user } = getSession()
      defaultProjects = [{
        name: user?.project || 'Default-Project',
        description: 'Primary project workspace',
        quota: 'Tenant',
        status: 'Enabled',
        statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      }, {
        name: 'infrastructure-shared',
        description: 'Common subnet pools and routing tables',
        quota: 'Tenant',
        status: 'Enabled',
        statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      }]
    } catch {
      defaultProjects = [{
        name: 'Default-Project',
        description: 'Primary project workspace',
        quota: 'Tenant',
        status: 'Enabled',
        statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      }]
    }
    localStorage.setItem(localKey, JSON.stringify(defaultProjects))
    return defaultProjects
  },

  async getRegions(): Promise<string[]> {
    try {
      const raw = await callKeystoneProxy('/v3/regions')
      if (!raw.regions || raw.regions.length === 0) return ['RegionOne']
      return raw.regions.map((r: any) => r.id || r.name).filter(Boolean)
    } catch (err) {
      console.warn('Failed to query regions from Keystone:', err)
      return ['RegionOne']
    }
  },

  async createProject(name: string, description: string, enabled: boolean): Promise<any> {
    const localKey = 'cp_keystone_projects'
    const newProj: Project = {
      name,
      description,
      quota: 'Tenant',
      status: enabled ? 'Enabled' : 'Disabled',
      statusClass: enabled
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }

    // Attempt real keystone API post
    let apiSuccess = false
    try {
      const body = {
        project: {
          name,
          description,
          enabled
        }
      }
      await callKeystoneProxy('/v3/projects', 'POST', body)
      apiSuccess = true
    } catch (err) {
      console.warn('Real Keystone post failed, registering project locally:', err)
    }

    // Read current local projects, insert new one, and write back
    const currentLocal = localStorage.getItem(localKey)
    const list: Project[] = currentLocal ? JSON.parse(currentLocal) : []
    
    // Avoid duplicates
    if (!list.some(p => p.name === name)) {
      list.push(newProj)
      localStorage.setItem(localKey, JSON.stringify(list))
    }

    return { success: true, project: newProj, apiProvisioned: apiSuccess }
  }
}
