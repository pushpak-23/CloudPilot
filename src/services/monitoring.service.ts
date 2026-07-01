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

export interface InstanceMetricSummary {
  source: 'gnocchi' | 'allocation' | 'unavailable'
  cpuAllocatedCores: number
  cpuUtilizationPercent: number | null
  memoryAllocatedMb: number
  memoryUsedMb: number | null
  diskAllocatedGb: number
  diskUsedGb: number | null
  updatedAt: string | null
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

function resolveEndpoint(serviceTypes: string[]): string | null {
  const { user } = getSession()
  const endpoints = user.endpoints || user.user?.endpoints

  for (const serviceType of serviceTypes) {
    const baseUrl = endpoints?.[serviceType]
    if (baseUrl) return baseUrl
  }

  return null
}

async function callProxyToBaseUrl(
  baseUrl: string,
  path: string,
  method: string = 'GET',
  body?: any
) {
  const { token } = getSession()
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

async function callProxy(
  serviceType: string,
  path: string,
  method: string = 'GET',
  body?: any
) {
  const baseUrl = resolveEndpoint([serviceType])

  if (!baseUrl) {
    throw new Error(
      `Public endpoint for service type "${serviceType}" was not found in Keystone catalog.`
    )
  }

  return callProxyToBaseUrl(baseUrl, path, method, body)
}

function extractMeasures(raw: any): any[] {
  const body = raw?.data || raw
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.measures)) return body.measures
  if (Array.isArray(body?.data)) return body.data
  return []
}

function extractMeasureValue(raw: any): {
  value: number | null
  timestamp: string | null
} {
  const measures = extractMeasures(raw)
  if (measures.length === 0) return { value: null, timestamp: null }

  const latest = measures[measures.length - 1]
  if (Array.isArray(latest)) {
    const [timestamp, , value] = latest
    const numericValue = typeof value === 'number' ? value : Number(value)
    return {
      value: Number.isFinite(numericValue) ? numericValue : null,
      timestamp: typeof timestamp === 'string' ? timestamp : null,
    }
  }

  if (latest && typeof latest === 'object') {
    const numericValue = Number(
      latest.value ??
        latest.mean ??
        latest.avg ??
        latest.aggregated ??
        latest[2]
    )
    return {
      value: Number.isFinite(numericValue) ? numericValue : null,
      timestamp: typeof latest.timestamp === 'string' ? latest.timestamp : null,
    }
  }

  return { value: null, timestamp: null }
}

async function getTelemetryResource(
  baseUrl: string,
  instanceId: string
): Promise<any | null> {
  const candidatePaths = [
    `/v1/resource/instance/${instanceId}`,
    `/v1/resource/${instanceId}`,
  ]

  for (const path of candidatePaths) {
    try {
      const raw = await callProxyToBaseUrl(baseUrl, path)
      const body = raw?.data || raw
      if (body?.metrics || body?.metric || body?.id) {
        return body
      }
    } catch {
      // Try the next resource shape.
    }
  }

  return null
}

async function getLatestTelemetryMeasure(
  baseUrl: string,
  metricId: string
): Promise<{ value: number | null; timestamp: string | null }> {
  const candidatePaths = [
    `/v1/metric/${metricId}/measures?aggregation=mean`,
    `/v1/metric/${metricId}/measures`,
  ]

  for (const path of candidatePaths) {
    try {
      const raw = await callProxyToBaseUrl(baseUrl, path)
      const measure = extractMeasureValue(raw)
      if (measure.value !== null) return measure
    } catch {
      // Continue probing alternate measure endpoints.
    }
  }

  return { value: null, timestamp: null }
}

function resolveMetricId(
  metricMap: Record<string, any>,
  candidateNames: string[]
): string | null {
  for (const metricName of candidateNames) {
    const metric = metricMap?.[metricName]
    if (!metric) continue

    if (typeof metric === 'string') return metric
    if (typeof metric.id === 'string') return metric.id
  }

  return null
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

      const cpuLoad =
        totalVcpus > 0
          ? parseFloat(((usedVcpus / totalVcpus) * 100).toFixed(1))
          : 0
      const memAllocatedGb = parseFloat((usedMemMb / 1024).toFixed(1))
      const memTotalGb = parseFloat((totalMemMb / 1024).toFixed(1))

      return {
        cpuLoad,
        memoryAllocatedGb: memAllocatedGb,
        memoryTotalGb: memTotalGb,
        networkBps: 0, // No native network throughput API
        activeAlerts: 0,
      }
    } catch (err) {
      console.error('Failed to derive metrics from hypervisors:', err)
      return {
        cpuLoad: 0,
        memoryAllocatedGb: 0,
        memoryTotalGb: 0,
        networkBps: 0,
        activeAlerts: 0,
      }
    }
  },

  async getInstanceMetrics(
    instanceId: string,
    flavor?: { vcpus: number; ram: number; disk: number } | null
  ): Promise<InstanceMetricSummary> {
    const allocated = {
      cpuAllocatedCores: flavor?.vcpus ?? 0,
      memoryAllocatedMb: flavor?.ram ?? 0,
      diskAllocatedGb: flavor?.disk ?? 0,
    }

    try {
      const baseUrl = resolveEndpoint([
        'metric',
        'telemetry',
        'gnocchi',
        'metering',
      ])
      if (!baseUrl) {
        return {
          source: 'unavailable',
          cpuAllocatedCores: allocated.cpuAllocatedCores,
          cpuUtilizationPercent: null,
          memoryAllocatedMb: allocated.memoryAllocatedMb,
          memoryUsedMb: null,
          diskAllocatedGb: allocated.diskAllocatedGb,
          diskUsedGb: null,
          updatedAt: null,
        }
      }

      const resource = await getTelemetryResource(baseUrl, instanceId)
      if (!resource) {
        return {
          source: 'allocation',
          cpuAllocatedCores: allocated.cpuAllocatedCores,
          cpuUtilizationPercent: null,
          memoryAllocatedMb: allocated.memoryAllocatedMb,
          memoryUsedMb: null,
          diskAllocatedGb: allocated.diskAllocatedGb,
          diskUsedGb: null,
          updatedAt: null,
        }
      }

      const metrics = resource.metrics || resource.metric || {}
      const cpuMetricId = resolveMetricId(metrics, [
        'cpu_util',
        'cpu',
        'cpu.percent',
        'instance_cpu_usage',
        'instance_cpu_util',
      ])
      const memoryMetricId = resolveMetricId(metrics, [
        'memory.resident',
        'memory',
        'memory_usage',
        'memory.usage',
        'memory.resident_bytes',
      ])

      const [cpuMeasure, memoryMeasure] = await Promise.all([
        cpuMetricId
          ? getLatestTelemetryMeasure(baseUrl, cpuMetricId)
          : Promise.resolve({ value: null, timestamp: null }),
        memoryMetricId
          ? getLatestTelemetryMeasure(baseUrl, memoryMetricId)
          : Promise.resolve({ value: null, timestamp: null }),
      ])

      const memoryUsedMb =
        memoryMeasure.value !== null
          ? parseFloat((memoryMeasure.value / (1024 * 1024)).toFixed(1))
          : null
      const updatedAt = cpuMeasure.timestamp || memoryMeasure.timestamp || null

      return {
        source: cpuMetricId || memoryMetricId ? 'gnocchi' : 'allocation',
        cpuAllocatedCores: allocated.cpuAllocatedCores,
        cpuUtilizationPercent:
          cpuMeasure.value !== null
            ? parseFloat(cpuMeasure.value.toFixed(1))
            : null,
        memoryAllocatedMb: allocated.memoryAllocatedMb,
        memoryUsedMb,
        diskAllocatedGb: allocated.diskAllocatedGb,
        diskUsedGb: null,
        updatedAt,
      }
    } catch (err) {
      console.error('Failed to query instance telemetry:', err)
      return {
        source: 'unavailable',
        cpuAllocatedCores: allocated.cpuAllocatedCores,
        cpuUtilizationPercent: null,
        memoryAllocatedMb: allocated.memoryAllocatedMb,
        memoryUsedMb: null,
        diskAllocatedGb: allocated.diskAllocatedGb,
        diskUsedGb: null,
        updatedAt: null,
      }
    }
  },
}
