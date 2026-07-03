export interface UserSession {
  username: string
  email: string
  role: string
  token: string
  project: string
  project_id: string
  region: string
  roles?: string[]
  endpoints?: Record<string, string>
  auth_url?: string
}

export interface LoginParams {
  username: string
  password?: string
  project?: string
  domain?: string
  auth_url?: string
  region?: string
  ca_cert?: string
}

export const authService = {
  async login(params: LoginParams): Promise<UserSession> {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: params.username,
        password: params.password || '',
        project: params.project || 'admin',
        domain: params.domain || 'Default',
        auth_url: params.auth_url || undefined,
        region: params.region || 'RegionOne',
        ca_cert: params.ca_cert || undefined
      })
    })

    const data = await response.json()
    if (!response.ok || !data.success) {
      const errMsg = data?.error?.message || 'Keystone authentication failed.'
      throw new Error(errMsg)
    }

    const sessionData = data.user
    const token = data.token

    return {
      username: sessionData.username,
      email: `${sessionData.username}@cloudpilot.internal`,
      role: sessionData.roles?.[0] || 'Member',
      token: token,
      project: sessionData.project || 'admin',
      project_id: sessionData.project_id || '',
      region: params.region || 'RegionOne',
      roles: sessionData.roles,
      endpoints: sessionData.endpoints || {},
      auth_url: params.auth_url || ''
    }
  },

  async logout(token: string): Promise<void> {
    console.log(`Keystone token ${token} logged out locally.`)
  }
}
