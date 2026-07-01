export interface Project {
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

export const identityService = {
  async getProjects(): Promise<Project[]> {
    try {
      const raw = await callKeystoneProxy('/v3/auth/projects')
      if (!raw.projects) return []
      return raw.projects.map((p: any) => ({
        name: p.name || p.id || 'Unnamed Project',
        description: p.description || '',
        quota: p.is_domain ? 'Domain' : 'Tenant',
        status: p.enabled !== false ? 'Enabled' as const : 'Disabled' as const,
        statusClass: p.enabled !== false
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
      }))
    } catch (err) {
      console.error('Failed to query projects from Keystone:', err)
      // Return current project from session as fallback
      try {
        const { user } = getSession()
        return [{
          name: user.project || 'Current Project',
          description: 'Currently authenticated project',
          quota: 'Tenant',
          status: 'Enabled' as const,
          statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }]
      } catch {
        return []
      }
    }
  }
}
