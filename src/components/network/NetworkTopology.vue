<template>
  <div class="bg-zinc-955/40 border border-zinc-800 rounded-xl p-6 shadow-xl relative flex flex-col space-y-4">
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h2 class="font-semibold text-lg text-white">Logical Topology Flow</h2>
        <p class="text-xs text-zinc-500 mt-0.5">
          Selected network gets a violet glow. Connected external gateways and other active subnets are colored in cyan/indigo. Unused networks are muted.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> External
        </span>
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Subnet
        </span>
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Router
        </span>
        <span class="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-855 px-2.5 py-1 rounded-md">
          <span class="w-2.5 h-2.5 rounded-full bg-zinc-200"></span> Instance
        </span>
        <button
          @click="alignLayout"
          class="ml-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          Stabilize Layout
        </button>
      </div>
    </div>

    <div
      class="w-full h-[480px] bg-zinc-955 border border-zinc-900 rounded-xl overflow-hidden relative"
    >
      <div ref="topologyContainer" class="w-full h-full"></div>
      <div v-if="loading" class="absolute inset-0 bg-zinc-955/80 backdrop-blur-xs flex items-center justify-center text-zinc-400 text-sm z-10">
        <Loader class="animate-spin mr-2" :size="18" /> Querying SDN resources...
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Loader } from 'lucide-vue-next'
import { Network } from 'vis-network'
import type { NetworkConfig, NetworkRouter } from '@/services/network.service'

const props = defineProps<{
  networks: NetworkConfig[]
  routers: NetworkRouter[]
  vms: any[]
  allNetworkPorts: Record<string, any[]>
  selectedNetwork: NetworkConfig | null
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'select-network', network: NetworkConfig): void
  (e: 'double-click-network', network: NetworkConfig): void
}>()

const topologyContainer = ref<HTMLDivElement | null>(null)
let visNetworkInstance: Network | null = null
const currentNodes = ref<any[]>([])
const isUnmounted = ref(false)

import { generateCircularBadge } from '@/shared/badges'

const getGlobeSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e3a8a', '#0284c7', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  highlighted
)

const getNetworkSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#4c1d95', '#4f46e5', '#818cf8',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  highlighted
)

const getMutedNetworkSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e293b', '#334155', '#475569',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  highlighted
)

const getMutedGlobeSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#1e293b', '#334155', '#475569',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  highlighted
)

const getOtherActiveNetworkSvg = () => generateCircularBadge(
  '#083344', '#0e7490', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="16" y="16" width="6" height="6" rx="1"/>
    <rect x="2" y="16" width="6" height="6" rx="1"/>
    <rect x="9" y="2" width="6" height="6" rx="1"/>
    <path d="M12 8v8"/>
    <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
  </svg>`,
  false
)

const getOtherActiveGlobeSvg = () => generateCircularBadge(
  '#083344', '#0e7490', '#06b6d4',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>`,
  false
)

const getRouterSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#064e3b', '#0d9488', '#10b981',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="19" r="3"/>
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>
    <circle cx="18" cy="5" r="3"/>
  </svg>`,
  highlighted
)

const getServerSvg = (highlighted: boolean = false) => generateCircularBadge(
  '#18181b', '#27272a', '#a1a1aa',
  `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/>
    <rect x="2" y="14" width="20" height="8" rx="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/>
    <line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>`,
  highlighted
)

function isNodeSelectedNetwork(nodeKey: string): boolean {
  if (!props.selectedNetwork) return false
  return nodeKey === `net_${props.selectedNetwork.id}`
}

function getConnectedNodesList(networkId: string): string[] {
  const nodes = [`net_${networkId}`]
  const ports = props.allNetworkPorts[networkId] || []
  ports.forEach((port) => {
    if (String(port.device_owner || '').includes('router')) {
      nodes.push(`router_${port.device_id}`)
    } else if (String(port.device_owner || '').includes('compute')) {
      nodes.push(`vm_${port.device_id}`)
    }
  })

  const routerIds = new Set(
    ports.filter((p) => String(p.device_owner || '').includes('router')).map((p) => p.device_id)
  )
  props.routers.forEach((router) => {
    if (routerIds.has(router.id) && router.externalNetworkId) {
      nodes.push(`net_${router.externalNetworkId}`)
    }
  })
  return nodes
}

function portsForRouter(routerId: string): NetworkConfig | null {
  for (const [netId, ports] of Object.entries(props.allNetworkPorts)) {
    const isAttached = ports.some((p) => p.device_id === routerId)
    if (isAttached) {
      const found = props.networks.find((n) => n.id === netId)
      if (found) return found
    }
  }
  return null
}

function getMainProjectNetwork(): NetworkConfig | null {
  const internalNets = props.networks.filter(n => !n.external)
  if (internalNets.length === 0) {
    return props.networks[0] || null
  }

  let bestNet: NetworkConfig | null = null
  let maxVms = -1

  for (const net of internalNets) {
    const ports = props.allNetworkPorts[net.id] || []
    const vmCount = ports.filter(p => String(p.device_owner || '').includes('compute')).length
    if (vmCount > maxVms) {
      maxVms = vmCount
      bestNet = net
    }
  }

  return bestNet || internalNets[0] || null
}

function initTopologyGraph() {
  if (isUnmounted.value || !topologyContainer.value) return

  const nodesList: any[] = []
  const edgesList: any[] = []
  const addedNodes = new Set<string>()

  // Groups
  const extNets = props.networks.filter(n => n.external)
  const intNets = props.networks.filter(n => !n.external)
  const routers = props.routers
  const vms = props.vms

  // Trace active external networks connected to routers that connect to networks with VMs
  const activeExternalNetworkIds = new Set<string>()
  const projectNetsWithVms = props.networks.filter(net => {
    const ports = props.allNetworkPorts[net.id] || []
    return ports.some(p => String(p.device_owner || '').includes('compute'))
  })

  projectNetsWithVms.forEach(net => {
    const ports = props.allNetworkPorts[net.id] || []
    const routerIds = new Set(
      ports.filter(p => String(p.device_owner || '').includes('router')).map(p => p.device_id)
    )
    props.routers.forEach(router => {
      if (routerIds.has(router.id) && router.externalNetworkId) {
        activeExternalNetworkIds.add(router.externalNetworkId)
      }
    })
  })

  // 1. External networks
  extNets.forEach((net) => {
    const nodeKey = `net_${net.id}`
    const isSelected = isNodeSelectedNetwork(nodeKey)
    const isActiveExt = activeExternalNetworkIds.has(net.id)

    let img = getMutedGlobeSvg(isSelected)
    let fontColor = '#64748b'

    if (isSelected) {
      img = getGlobeSvg(true)
      fontColor = '#00f0ff'
    } else if (isActiveExt) {
      img = props.selectedNetwork ? getOtherActiveGlobeSvg() : getGlobeSvg(false)
      fontColor = props.selectedNetwork ? '#22d3ee' : '#60a5fa'
    } else if (props.selectedNetwork) {
      fontColor = '#475569'
    }

    nodesList.push({
      id: nodeKey,
      label: `${net.name}\n(external)`,
      image: img,
      shape: 'image',
      size: isSelected ? 40 : 32,
      font: { color: fontColor, size: 11, fontStyle: isSelected ? 'bold' : 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'network', item: net },
    })
    addedNodes.add(nodeKey)
  })

  // 2. Routers
  routers.forEach((router) => {
    const nodeKey = `router_${router.id}`

    nodesList.push({
      id: nodeKey,
      label: `${router.name}`,
      image: getRouterSvg(false),
      shape: 'image',
      size: 32,
      font: { color: '#34d399', size: 11, fontStyle: 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'router', item: router },
    })
    addedNodes.add(nodeKey)

    if (router.externalNetworkId && addedNodes.has(`net_${router.externalNetworkId}`)) {
      const activeEdge = isNodeSelectedNetwork(`net_${router.externalNetworkId}`)
      edgesList.push({
        from: nodeKey,
        to: `net_${router.externalNetworkId}`,
        color: { color: activeEdge ? '#00f0ff' : '#3f3f46', opacity: activeEdge ? 1.0 : 0.6 },
        width: activeEdge ? 2.5 : 1.2,
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
      })
    }
  })

  // 3. Subnets
  intNets.forEach((net) => {
    const nodeKey = `net_${net.id}`
    const isSelected = isNodeSelectedNetwork(nodeKey)

    const ports = props.allNetworkPorts[net.id] || []
    const hasVms = ports.some(p => String(p.device_owner || '').includes('compute'))

    let img = getMutedNetworkSvg(isSelected)
    let fontColor = '#64748b'

    if (isSelected) {
      img = getNetworkSvg(true)
      fontColor = '#a78bfa'
    } else if (hasVms) {
      img = props.selectedNetwork ? getOtherActiveNetworkSvg() : getNetworkSvg(false)
      fontColor = props.selectedNetwork ? '#22d3ee' : '#cbd5e1'
    } else if (props.selectedNetwork) {
      fontColor = '#475569'
    }

    nodesList.push({
      id: nodeKey,
      label: `${net.name}\n${net.subnet}`,
      image: img,
      shape: 'image',
      size: isSelected ? 40 : 32,
      font: { color: fontColor, size: 11, fontStyle: isSelected ? 'bold' : 'normal', face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'network', item: net },
    })
    addedNodes.add(nodeKey)
  })

  // 4. Compute Instances (VMs)
  vms.forEach((vm) => {
    const nodeKey = `vm_${vm.id}`

    nodesList.push({
      id: nodeKey,
      label: `${vm.name}`,
      image: getServerSvg(false),
      shape: 'image',
      size: 28,
      font: { color: '#a1a1aa', size: 10, face: 'Outfit, Inter, sans-serif' },
      physics: true,
      customData: { type: 'instance', item: vm },
    })
    addedNodes.add(nodeKey)
  })

  // 5. Connect Port map links
  Object.entries(props.allNetworkPorts).forEach(([networkId, portsList]) => {
    portsList.forEach((port) => {
      const isRouter = String(port.device_owner || '').includes('router')
      const isCompute = String(port.device_owner || '').includes('compute')
      const netNodeId = `net_${networkId}`

      const isNetSelected = props.selectedNetwork?.id === networkId

      if (isRouter) {
        const routerNodeId = `router_${port.device_id}`
        if (addedNodes.has(netNodeId) && addedNodes.has(routerNodeId)) {
          edgesList.push({
            from: routerNodeId,
            to: netNodeId,
            color: { color: isNetSelected ? '#10b981' : '#27272a', opacity: isNetSelected ? 1.0 : 0.5 },
            width: isNetSelected ? 2.5 : 1.2,
          })
        }
      } else if (isCompute) {
        const vmNodeId = `vm_${port.device_id}`
        if (addedNodes.has(netNodeId) && addedNodes.has(vmNodeId)) {
          edgesList.push({
            from: vmNodeId,
            to: netNodeId,
            color: { color: isNetSelected ? '#818cf8' : '#27272a', opacity: isNetSelected ? 1.0 : 0.5 },
            width: isNetSelected ? 2.0 : 1.0,
          })
        }
      }
    })
  })

  const data = { nodes: nodesList, edges: edgesList }
  const options = {
    nodes: {
      shadow: { enabled: true, color: 'rgba(0,0,0,0.5)', size: 8 },
    },
    edges: {
      smooth: { enabled: true, type: 'continuous', roundness: 0.35 },
    },
    physics: {
      enabled: true,
      barnesHut: {
        centralGravity: 0.5,
        springLength: 85,
        springConstant: 0.045,
        damping: 0.09,
        avoidOverlap: 1.0,
      },
      stabilization: { iterations: 100, updateInterval: 25 },
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true,
      hover: true,
    },
  }

  currentNodes.value = nodesList

  if (!visNetworkInstance) {
    visNetworkInstance = new Network(topologyContainer.value, data, options)

    visNetworkInstance.on('selectNode', (params) => {
      if (params.nodes?.length > 0) {
        const selectedId = params.nodes[0]
        const foundNode = currentNodes.value.find((n) => n.id === selectedId)
        if (foundNode && foundNode.customData) {
          const { type, item } = foundNode.customData
          if (type === 'network') {
            emit('select-network', item)
          } else if (type === 'router') {
            const connectedNet = portsForRouter(item.id)
            if (connectedNet) {
              emit('select-network', connectedNet)
            }
          }
        }
      }
    })

    visNetworkInstance.on('doubleClick', (params) => {
      if (params.nodes?.length > 0) {
        const selectedId = params.nodes[0]
        const foundNode = currentNodes.value.find((n) => n.id === selectedId)
        if (foundNode && foundNode.customData) {
          const { type, item } = foundNode.customData
          if (type === 'network') {
            emit('double-click-network', item)
          }
        }
      }
    })
  } else {
    visNetworkInstance.setData(data)
  }
}

function alignLayout() {
  if (visNetworkInstance) {
    const mainNet = getMainProjectNetwork()
    if (mainNet) {
      const nodesToFit = getConnectedNodesList(mainNet.id)
      visNetworkInstance.fit({
        nodes: nodesToFit,
        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
      })
    } else {
      visNetworkInstance.fit({
        animation: { duration: 1000, easingFunction: 'easeInOutQuad' }
      })
    }
  }
}

function focusOnNetwork(net: NetworkConfig) {
  nextTick(() => {
    if (visNetworkInstance) {
      const nodesToFit = getConnectedNodesList(net.id)
      visNetworkInstance.fit({
        nodes: nodesToFit,
        animation: { duration: 800, easingFunction: 'easeInOutQuad' }
      })
    }
  })
}

defineExpose({
  alignLayout,
  focusOnNetwork,
  initTopologyGraph,
})

watch(
  () => props.selectedNetwork,
  () => {
    initTopologyGraph()
  }
)

watch(
  [() => props.networks, () => props.routers, () => props.vms, () => props.allNetworkPorts],
  () => {
    initTopologyGraph()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  initTopologyGraph()

  // Default focus camera fit boundary on main project network + its connected peers
  nextTick(() => {
    const activeFocus = getMainProjectNetwork()
    if (activeFocus && visNetworkInstance) {
      setTimeout(() => {
        if (visNetworkInstance && activeFocus) {
          const nodesToFit = getConnectedNodesList(activeFocus.id)
          visNetworkInstance.fit({
            nodes: nodesToFit,
            animation: { duration: 1200, easingFunction: 'easeInOutQuad' }
          })
        }
      }, 600)
    }
  })
})

onBeforeUnmount(() => {
  isUnmounted.value = true
  if (visNetworkInstance) {
    visNetworkInstance.destroy()
    visNetworkInstance = null
  }
})
</script>

<style scoped>
.vis-network {
  outline: none;
}
</style>
