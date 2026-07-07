<template>
  <div class="space-y-3">
    <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 select-none">
      <Activity :size="12" /> Heat Orchestrated Resource Topology
    </h4>
    <div class="bg-zinc-950 border border-zinc-850 rounded-xl relative overflow-hidden">
      <!-- Interactive Topology Canvas -->
      <div ref="containerRef" class="w-full h-[400px] min-h-[400px]"></div>

      <div
        v-if="(props.topology.nodes || []).length === 0"
        class="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 italic select-none"
      >
        No resources defined in topology.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Activity } from 'lucide-vue-next'
import { Network } from 'vis-network'

const props = defineProps<{
  topology: {
    nodes: Array<{ id: string; label: string; type: 'server' | 'network' | 'subnet' | 'security_group' | 'loadbalancer' }>
    edges: Array<{ from: string; to: string }>
  }
  stackName?: string
}>()

const containerRef = ref<HTMLDivElement | null>(null)
let networkInstance: Network | null = null

// SVG Icon Generator (Glassmorphism design with glowing borders)
const generateCircularBadge = (
  gradientStart: string,
  gradientEnd: string,
  borderColor: string,
  iconContent: string
) => {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="badgeGrad_${borderColor.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${gradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${gradientEnd};stop-opacity:1" />
    </linearGradient>
    <filter id="badgeShadow_${borderColor.replace('#', '')}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${borderColor}" flood-opacity="0.45"/>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="22" fill="url(#badgeGrad_${borderColor.replace('#', '')})" stroke="${borderColor}" stroke-width="2" filter="url(#badgeShadow_${borderColor.replace('#', '')})" />
  <g transform="translate(20, 20)">
    ${iconContent}
  </g>
</svg>
`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}`
}

function getBadgeIcon(type: string) {
  if (type === 'stack') {
    // Stack icon
    return generateCircularBadge(
      '#78350f', '#d97706', '#f59e0b',
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>`
    )
  }
  if (type === 'server') {
    // Compute server icon
    return generateCircularBadge(
      '#1e3a8a', '#2563eb', '#3b82f6',
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" stroke-width="3" />
        <line x1="6" y1="18" x2="6.01" y2="18" stroke-width="3" />
      </svg>`
    )
  }
  if (type === 'network' || type === 'subnet') {
    // Network icon
    return generateCircularBadge(
      '#4c1d95', '#7c3aed', '#a855f7',
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="16" y="16" width="6" height="6" rx="1"/>
        <rect x="2" y="16" width="6" height="6" rx="1"/>
        <rect x="9" y="2" width="6" height="6" rx="1"/>
        <path d="M12 8v8"/>
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
      </svg>`
    )
  }
  if (type === 'security_group') {
    // Shield icon
    return generateCircularBadge(
      '#7f1d1d', '#dc2626', '#ef4444',
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>`
    )
  }
  if (type === 'loadbalancer') {
    // Loadbalancer icon
    return generateCircularBadge(
      '#064e3b', '#059669', '#10b981',
      `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22V12M5 12h14M5 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm14 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
      </svg>`
    )
  }
  // Generic database icon fallback
  return generateCircularBadge(
    '#312e81', '#4f46e5', '#6366f1',
    `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
    </svg>`
  )
}

function initNetwork() {
  if (!containerRef.value) return
  if (networkInstance) {
    networkInstance.destroy()
    networkInstance = null
  }

  // List only the actual Heat resource nodes (Horizon Style)
  const nodesList = (props.topology.nodes || []).map((node) => ({
    id: node.id,
    label: node.label,
    shape: 'image',
    image: getBadgeIcon(node.type),
    font: {
      color: '#e4e4e7', // zinc-200
      size: 11,
      face: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      vadjust: -8,
    },
  }))

  // Draw directed dependency arrow links representing the HOT template relationships
  const edgesList = (props.topology.edges || []).map((edge) => ({
    from: edge.from,
    to: edge.to,
    color: {
      color: 'rgba(59, 130, 246, 0.45)', // blue link lines with opacity
      highlight: '#3b82f6', // blue-500
    },
    width: 2,
    arrows: {
      to: { enabled: true, type: 'arrow', scaleFactor: 0.8 }
    },
  }))

  const data = {
    nodes: nodesList,
    edges: edgesList,
  }

  const options = {
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -70,
        centralGravity: 0.015,
        springLength: 130,
        springConstant: 0.07,
      },
      stabilization: { iterations: 120, updateInterval: 25 },
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
    },
  }

  networkInstance = new Network(containerRef.value, data, options)
}

watch(
  () => props.topology,
  () => {
    initNetwork()
  },
  { deep: true }
)

onMounted(() => {
  initNetwork()
})

onUnmounted(() => {
  if (networkInstance) {
    networkInstance.destroy()
    networkInstance = null
  }
})
</script>
