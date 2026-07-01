import { defineStore } from 'pinia'
import { monitoringService, type SystemAlert, type MetricSummary } from '@/services/monitoring.service'

export const useMonitoringStore = defineStore('monitoring', {
  state: () => ({
    alerts: [] as SystemAlert[],
    metrics: {
      cpuLoad: 0,
      memoryAllocatedGb: 0,
      memoryTotalGb: 0,
      networkBps: 0,
      activeAlerts: 0
    } as MetricSummary,
    loading: false,
    simulationActive: false
  }),

  actions: {
    async loadMonitoringData(force: boolean = false) {
      if (this.metrics.memoryTotalGb > 0 && !force) return
      this.loading = true
      try {
        this.alerts = await monitoringService.getAlerts()
        this.metrics = await monitoringService.getMetrics()
      } catch (err) {
        console.error('Failed to load monitoring data', err)
      } finally {
        this.loading = false
      }
    },

    acknowledgeAlert(name: string) {
      this.alerts = this.alerts.filter(a => a.name !== name)
      this.metrics.activeAlerts = this.alerts.length
    },

    startMetricsSimulation() {
      // Only simulate network throughput jitter since we get real CPU/RAM from hypervisors
      if (this.simulationActive) return
      this.simulationActive = true

      setInterval(async () => {
        try {
          // Re-fetch real metrics from hypervisors periodically
          const freshMetrics = await monitoringService.getMetrics()
          this.metrics.cpuLoad = freshMetrics.cpuLoad
          this.metrics.memoryAllocatedGb = freshMetrics.memoryAllocatedGb
          this.metrics.memoryTotalGb = freshMetrics.memoryTotalGb
        } catch {
          // Silently continue with stale data
        }
      }, 30000) // Refresh every 30 seconds
    }
  }
})
