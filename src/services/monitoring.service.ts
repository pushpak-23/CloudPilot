export interface SystemAlert {
  severity: 'Critical' | 'Warning' | 'Info'
  name: string
  time: string
  source: string
  severityClass: string
}

export interface MetricSummary {
  cpuLoad: number
  memoryAllocatedGb: number
  memoryTotalGb: number
  networkBps: number
  activeAlerts: number
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

export const monitoringService = {
  async getAlerts(): Promise<SystemAlert[]> {
    // OpenStack doesn't have a native alerts API.
    // Return empty alerts — no fake data.
    return []
  },

  async getMetrics(): Promise<MetricSummary> {
    try {
      // Derive real cluster metrics from Nova hypervisors
      const raw = await callProxy('compute', '/os-hypervisors/detail')
      const hypervisors = raw.hypervisors || []

      let totalVcpus = 0
      let usedVcpus = 0
      let totalMemMb = 0
      let usedMemMb = 0

      for (const h of hypervisors) {
        totalVcpus += h.vcpus || 0
        usedVcpus += h.vcpus_used || 0
        totalMemMb += h.memory_mb || 0
        usedMemMb += h.memory_mb_used || 0
      }

      const cpuLoad = totalVcpus > 0 ? parseFloat(((usedVcpus / totalVcpus) * 100).toFixed(1)) : 0
      const memAllocatedGb = parseFloat((usedMemMb / 1024).toFixed(1))
      const memTotalGb = parseFloat((totalMemMb / 1024).toFixed(1))

      return {
        cpuLoad,
        memoryAllocatedGb: memAllocatedGb,
        memoryTotalGb: memTotalGb,
        networkBps: 0, // No native network throughput API
        activeAlerts: 0
      }
    } catch (err) {
      console.error('Failed to derive metrics from hypervisors:', err)
      return {
        cpuLoad: 0,
        memoryAllocatedGb: 0,
        memoryTotalGb: 0,
        networkBps: 0,
        activeAlerts: 0
      }
    }
  }
}
