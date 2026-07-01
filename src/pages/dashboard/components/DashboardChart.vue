<template>
  <div class="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="font-bold text-lg text-white">Resource Load History</h2>
        <p class="text-zinc-500 text-xs">Real-time telemetries of hypervisor compute clusters.</p>
      </div>
      <span class="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/25 px-2.5 py-0.5 rounded-full font-semibold">
        Live Node Tracking
      </span>
    </div>

    <!-- Chart container -->
    <div ref="chartRef" class="w-full h-72"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useMonitoringStore } from '@/stores/monitoring'

const monitoringStore = useMonitoringStore()
const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

// Keep track of historical points (last 12 updates)
const timeData = ref<string[]>([])
const cpuData = ref<number[]>([])
const ramPercentData = ref<number[]>([])

function getFormattedTime() {
  const now = new Date()
  return now.toTimeString().split(' ')[0] || ''
}

// Initialize history with empty/zero data points
for (let i = 11; i >= 0; i--) {
  const time = new Date(Date.now() - i * 4000)
  timeData.value.push(time.toTimeString().split(' ')[0] || '')
  cpuData.value.push(0)
  ramPercentData.value.push(0)
}

function updateChart() {
  if (!chartInstance) return

  chartInstance.setOption({
    grid: {
      left: '4%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: '#27272a',
      textStyle: {
        color: '#f4f4f5'
      }
    },
    legend: {
      data: ['CPU Workload (%)', 'RAM Allocation (%)'],
      textStyle: {
        color: '#a1a1aa'
      },
      top: 0
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData.value,
      axisLine: {
        lineStyle: {
          color: '#27272a'
        }
      },
      axisLabel: {
        color: '#71717a'
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: '#27272a'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#18181b'
        }
      },
      axisLabel: {
        color: '#71717a'
      }
    },
    series: [
      {
        name: 'CPU Workload (%)',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#3b82f6',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59,130,246,0.25)' },
            { offset: 1, color: 'rgba(59,130,246,0)' }
          ])
        },
        data: cpuData.value
      },
      {
        name: 'RAM Allocation (%)',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          color: '#6366f1',
          width: 3
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99,102,241,0.2)' },
            { offset: 1, color: 'rgba(99,102,241,0)' }
          ])
        },
        data: ramPercentData.value
      }
    ]
  })
}

// Watch store metrics for live fluctuations
watch(
  () => monitoringStore.metrics.cpuLoad,
  (newCpu) => {
    // Add new data point
    timeData.value.push(getFormattedTime())
    cpuData.value.push(newCpu)
    
    const ramAlloc = monitoringStore.metrics.memoryAllocatedGb
    const ramTotal = monitoringStore.metrics.memoryTotalGb
    ramPercentData.value.push(parseFloat(((ramAlloc / ramTotal) * 100).toFixed(1)))

    // Limit array size to 12 items
    if (timeData.value.length > 12) {
      timeData.value.shift()
      cpuData.value.shift()
      ramPercentData.value.shift()
    }

    updateChart()
  }
)

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value)
    updateChart()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>
