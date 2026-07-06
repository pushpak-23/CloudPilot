import { defineStore } from 'pinia'
import { computeService, mapNovaStatus, mapStatusClasses, mapNovaServer, type Instance, type Flavor, type Image, type Hypervisor, type Keypair } from '@/services/compute.service'

export const useComputeStore = defineStore('compute', {
  state: () => ({
    instances: [] as Instance[],
    flavors: [] as Flavor[],
    images: [] as Image[],
    hypervisors: [] as Hypervisor[],
    keypairs: [] as Keypair[],
    availabilityZones: ['nova'] as string[],
    loading: false,
    lastFetchedAt: null as number | null,
    quotas: {
      instances: { limit: 10, inUse: 0 },
      cores: { limit: 20, inUse: 0 },
      ram: { limit: 51200, inUse: 0 }
    } as any,
    
    // Bulk Deploy wizard states
    bulkDeploying: false,
    bulkDeployProgress: 0,
    bulkDeployLogs: [] as string[]
  }),

  getters: {
    totalInstancesCount(state): number {
      return state.instances.length
    },
    runningCount(state): number {
      return state.instances.filter(i => i.status === 'Active').length
    },
    stoppedCount(state): number {
      return state.instances.filter(i => i.status === 'Shutoff').length
    },
    provisioningCount(state): number {
      return state.instances.filter(i => i.status === 'Provisioning').length
    }
  },

  actions: {
    invalidateCache() {
      this.lastFetchedAt = null
    },

    async loadAllComputeData() {
      // Load essential compute data (instances, flavors, images) first.
      // Optional data (hypervisors, keypairs, quotas) are fetched individually so failures
      // (e.g., admin‑only endpoints) do not block the UI from showing instances.
      const CACHE_TTL = 60_000 // 60 seconds
      if (this.lastFetchedAt && (Date.now() - this.lastFetchedAt < CACHE_TTL)) return
      this.loading = true
      try {
        // Essential data — use allSettled so one failure doesn't block the others
        const [vmsResult, flavsResult, imgsResult] = await Promise.allSettled([
          computeService.getInstances(),
          computeService.getFlavors(),
          computeService.getImages()
        ])
        this.flavors = flavsResult.status === 'fulfilled' ? flavsResult.value : []
        this.images = imgsResult.status === 'fulfilled' ? imgsResult.value : []
        const rawVms = vmsResult.status === 'fulfilled' ? vmsResult.value : []
        this.instances = rawVms.map(vm => {
          const found = this.images.find(img => img.id === vm.image)
          return found ? { ...vm, image: found.name } : vm
        })

        if (vmsResult.status === 'rejected') console.error('Instances load failed:', vmsResult.reason)
        if (flavsResult.status === 'rejected') console.error('Flavors load failed:', flavsResult.reason)
        if (imgsResult.status === 'rejected') console.error('Images load failed:', imgsResult.reason)

        // Mark essential load complete and yield rendering instantly
        this.loading = false
        this.lastFetchedAt = Date.now()

        // Fetch optional endpoints in background so they do not block instance list rendering
        Promise.allSettled([
          computeService.getHypervisors().then(res => this.hypervisors = res).catch(() => this.hypervisors = []),
          computeService.getKeypairs().then(res => this.keypairs = res).catch(() => this.keypairs = []),
          computeService.getQuotas().then(res => this.quotas = res).catch(() => {}),
          computeService.getAvailabilityZones().then(res => this.availabilityZones = res).catch(() => this.availabilityZones = ['nova'])
        ])
      } catch (err) {
        console.error('Failed to load compute context', err)
        this.loading = false
      }
    },

    async launchInstance(name: string, flavor: string, image: string, keypair: string) {
      try {
        const pendingVm = await computeService.launchInstance(name, flavor, image, keypair)
        this.instances.unshift(pendingVm)

        // Increment hypervisor counter
        const hostHyp = this.hypervisors.find(h => h.name === pendingVm.host)
        if (hostHyp) {
          hostHyp.vmsCount++
        }

        // Start polling real OpenStack status
        this.pollInstanceStatus(pendingVm.id, 'Active')
      } catch (err) {
        console.error('Failed to launch instance', err)
      }
    },

    async launchInstanceAdvanced(config: {
      name: string
      count: number
      flavor: string
      image: string
      bootSource: string
      volumeSize: number
      deleteOnTerminate: boolean
      networks: string[]
      securityGroups: string[]
      keypair: string
      cloudInit: string
      availabilityZone?: string
    }) {
      this.loading = true
      try {
        for (let i = 1; i <= config.count; i++) {
          const vmName = config.count > 1 ? `${config.name}-${i.toString().padStart(2, '0')}` : config.name
          const pendingVm = await computeService.launchInstance(
            vmName, 
            config.flavor, 
            config.image, 
            config.keypair,
            config.networks,
            config.securityGroups,
            config.availabilityZone,
            config.bootSource,
            config.volumeSize,
            config.deleteOnTerminate
          )
          this.instances.unshift(pendingVm)

          // Increment hypervisor counter
          const hostHyp = this.hypervisors.find(h => h.name === pendingVm.host)
          if (hostHyp) {
            hostHyp.vmsCount++
          }

          // Start polling real OpenStack status
          this.pollInstanceStatus(pendingVm.id, 'Active')
        }
      } catch (err) {
        console.error('Failed to launch advanced instances', err)
      } finally {
        this.loading = false
      }
    },

    // Lifecycle state management
    updateStateHelper(
      id: string, 
      status: Instance['status'], 
      statusClass: string, 
      bulletClass: string,
      extraData?: Partial<Instance>
    ) {
      const found = this.instances.find(i => i.id === id)
      if (found) {
        found.status = status
        found.statusClass = statusClass
        found.bulletClass = bulletClass
        if (extraData) {
          Object.assign(found, extraData)
        }
      }
    },

    async pollInstanceStatus(id: string, expectedStatus?: Instance['status'], maxAttempts = 60, interval = 3000) {
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const detail = await computeService.getInstanceDetail(id)
          const newStatus = mapNovaStatus(detail.status)
          const taskState = detail['OS-EXT-STS:task_state']
          
          if (taskState) {
            // Nova is actively working on it (e.g. powering-off, rebooting, spawning)
            // Keep the UI in Provisioning state
            this.updateStateHelper(id, 'Provisioning', 'bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse', {
              taskState
            })
          } else {
            // No active task. Update UI to actual state.
            const mapped = mapNovaServer(detail)
            const foundImg = this.images.find(img => img.id === mapped.image)
            const imageName = foundImg ? foundImg.name : mapped.image
            this.updateStateHelper(id, newStatus, mapped.statusClass, mapped.bulletClass, {
              ip: mapped.ip,
              flavor: mapped.flavor,
              image: imageName,
              host: mapped.host,
              age: mapped.age,
              taskState: mapped.taskState
            })
            
            // If we reached the target state, or if no target state was specified, we can stop polling.
            // We only check this after the first attempt to give Nova a chance to register the task.
            if (!expectedStatus || newStatus === expectedStatus || newStatus === 'Error') {
              if (attempts > 1 || newStatus === 'Error') {
                return;
              }
            }
          }
        } catch (e) {
          console.error(`Error polling instance ${id}`, e)
        }
        
        if (attempts < maxAttempts) {
          setTimeout(poll, interval)
        }
      }
      
      // Give Nova a moment to process the API request before our first poll
      setTimeout(poll, 1500)
    },

    async simulateTransition(
      id: string, 
      transitionState: Instance['status'], 
      transitionClasses: [string, string], 
      apiCall: () => Promise<void>,
      expectedStatus?: Instance['status']
    ) {
      this.updateStateHelper(id, transitionState, transitionClasses[0], transitionClasses[1])
      try {
        await apiCall()
        this.pollInstanceStatus(id, expectedStatus)
      } catch (e) {
        console.error(`Action failed for instance ${id}`, e)
        this.pollInstanceStatus(id, undefined, 2, 1000)
        throw e
      }
    },

    async startInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.startInstance(id),
        'Active'
      )
    },

    async stopInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-zinc-800 text-zinc-450 border border-zinc-700', 'bg-zinc-600 animate-pulse'], 
        () => computeService.stopInstance(id),
        'Shutoff'
      )
    },

    async rebootInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-spin'], 
        () => computeService.rebootInstance(id, 'SOFT'),
        'Active'
      )
    },

    async pauseInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-amber-500/10 text-amber-400 border border-amber-500/25', 'bg-amber-500 animate-pulse'], 
        () => computeService.pauseInstance(id),
        'Paused'
      )
    },

    async resumeInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.resumeInstance(id),
        'Active'
      )
    },

    async unpauseInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.unpauseInstance(id),
        'Active'
      )
    },

    async hardRebootInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-spin'], 
        () => computeService.rebootInstance(id, 'HARD'),
        'Active'
      )
    },

    async rescueInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-amber-500/10 text-amber-400 border border-amber-500/25', 'bg-amber-500 animate-pulse'], 
        () => computeService.rescueServer(id),
        'Rescue'
      )
    },

    async unrescueInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.unrescueServer(id),
        'Active'
      )
    },

    async lockInstance(id: string) {
      try {
        await computeService.lockServer(id)
      } catch (err) {
        console.error(`Failed to lock instance ${id}`, err)
        throw err
      }
    },

    async unlockInstance(id: string) {
      try {
        await computeService.unlockServer(id)
      } catch (err) {
        console.error(`Failed to unlock instance ${id}`, err)
        throw err
      }
    },

    async suspendInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-amber-500/10 text-amber-400 border border-amber-500/25', 'bg-amber-500 animate-pulse'], 
        () => computeService.suspendInstance(id),
        'Suspended'
      )
    },

    async shelveInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-zinc-800 text-zinc-450 border border-zinc-700', 'bg-zinc-650 animate-pulse'], 
        () => computeService.performAction(id, { shelve: null }),
        'Shelved'
      )
    },

    async unshelveInstance(id: string) {
      this.simulateTransition(id, 'Provisioning', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.performAction(id, { unshelve: null }),
        'Active'
      )
    },

    async resizeInstance(id: string, newFlavor: string) {
      this.simulateTransition(id, 'Resizing', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.performAction(id, { resize: { flavorRef: newFlavor } })
      )
    },

    async rebuildInstance(id: string, newImage: string) {
      this.simulateTransition(id, 'Rebuilding', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.performAction(id, { rebuild: { imageRef: newImage } })
      )
    },

    async liveMigrateInstance(id: string, newHost: string) {
      this.simulateTransition(id, 'Migrating', 
        ['bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse'], 
        () => computeService.performAction(id, { "os-migrateLive": { host: newHost, block_migration: true } })
      )
    },

    async takeSnapshot(id: string, snapshotName: string) {
      try {
        await computeService.performAction(id, { createImage: { name: snapshotName } })
        // Create new image profile in UI immediately to reflect action
        const newImg: Image = {
          id: `img-snap-${Math.random().toString(36).substr(2, 9)}`,
          name: snapshotName,
          diskFormat: 'qcow2',
          containerFormat: 'bare',
          minDisk: 0,
          minRam: 0,
          size: 'Pending',
          status: 'Saving',
          visibility: 'Private'
        }
        this.images.unshift(newImg)
      } catch (err) {
        console.error(`Failed to take snapshot of instance ${id}`, err)
      }
    },

    async terminateInstance(id: string) {
      const found = this.instances.find(i => i.id === id)
      if (found) {
        this.updateStateHelper(id, 'Provisioning', 'bg-red-500/10 text-red-400 border border-red-500/25', 'bg-red-500 animate-pulse')
        try {
          await computeService.terminateInstance(id)
          this.instances = this.instances.filter(i => i.id !== id)
          const hyp = this.hypervisors.find(h => h.name === found.host)
          if (hyp) hyp.vmsCount--
        } catch (err) {
          console.error(`Failed to terminate instance ${id}`, err)
          this.pollInstanceStatus(id, undefined, 2, 1000)
        }
      }
    },

    // Custom Flavors management
    async addFlavor(name: string, vcpus: number, ram: number, disk: number) {
      const newFlav: Flavor = {
        id: `flav-${Math.random().toString(36).substr(2, 9)}`,
        name,
        vcpus,
        ram,
        disk,
        isPublic: true
      }
      const added = await computeService.createFlavor(newFlav)
      this.flavors.push(added)
    },

    // Custom Keypair management
    async addKeypair(name: string, publicKey?: string) {
      const key = await computeService.createKeypair(name, publicKey)
      this.keypairs.push({
        name: key.name,
        fingerprint: key.fingerprint,
        publicKey: key.publicKey
      })
      return key
    },

    deleteKeypair(name: string) {
      this.keypairs = this.keypairs.filter(k => k.name !== name)
    },

    async addSecurityGroupToInstance(id: string, sgName: string) {
      try {
        await computeService.performAction(id, { addSecurityGroup: { name: sgName } })
      } catch (err) {
        console.error(`Failed to add security group ${sgName} to instance ${id}`, err)
        throw err
      }
    },

    async removeSecurityGroupFromInstance(id: string, sgName: string) {
      try {
        await computeService.performAction(id, { removeSecurityGroup: { name: sgName } })
      } catch (err) {
        console.error(`Failed to remove security group ${sgName} from instance ${id}`, err)
        throw err
      }
    },

    async updateImageMetadata(imageId: string, patches: { op: 'add' | 'remove'; path: string; value?: any }[]) {
      try {
        await computeService.updateImageMetadata(imageId, patches)
        const updatedImages = await computeService.getImages()
        this.images = updatedImages
      } catch (err) {
        console.error('Failed to update image metadata in store:', err)
        throw err
      }
    },

    // OpenTofu Bulk wizard deployment simulation
    async deployBulk(config: {
      baseName: string
      count: number
      flavor: string
      image: string
      bootSize: number
      dataSize: number
      logsSize: number
      network: string
      securityGroup: string
      cloudInit: string
    }) {
      this.bulkDeploying = true
      this.bulkDeployProgress = 5
      this.bulkDeployLogs = ['[OpenTofu] Initializing working workspace...', '[OpenTofu] Finding plugins and openstack provider configuration...']

      const steps = [
        { progress: 15, msg: '[OpenTofu] Verifying tenant quotas and flavor profiles...' },
        { progress: 30, msg: `[OpenTofu] Plan: ${config.count} VMs to create in compute-hypervisors.` },
        { progress: 45, msg: '[OpenTofu] Creating blockstorage volumes: boot volumes (100GB), data volumes (500GB)...' },
        { progress: 60, msg: '[OpenTofu] Provisioning network ports and security interface structures...' },
        { progress: 75, msg: '[OpenTofu] Creating Nova compute instances. Injecting cloud-init metadata...' },
        { progress: 90, msg: '[OpenTofu] Mounting storage volumes (Cinder) on instances...' },
        { progress: 100, msg: '[OpenTofu] Apply completed successfully! 0 errors, resources configured.' }
      ]

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        this.bulkDeployProgress = step.progress
        this.bulkDeployLogs.push(step.msg)
      }

      // Add instances
      for (let i = 1; i <= config.count; i++) {
        const vmName = `${config.baseName}-${i.toString().padStart(2, '0')}`
        const newVm: Instance = {
          id: `vm-bulk-${Math.random().toString(36).substr(2, 9)}`,
          name: vmName,
          status: 'Active',
          ip: `10.0.${Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 254) + 1}`,
          flavor: config.flavor,
          image: config.image,
          age: 'Just now',
          host: `compute-node-0${Math.floor(Math.random() * 2) + 1}`,
          statusClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          bulletClass: 'bg-emerald-500'
        }
        this.instances.unshift(newVm)

        // Increment hypervisor counters
        const hyp = this.hypervisors.find(h => h.name === newVm.host)
        if (hyp) hyp.vmsCount++
      }

      // Complete deployment session
      await new Promise((resolve) => setTimeout(resolve, 1200))
      this.bulkDeploying = false
    },

    async cloneInstance(sourceId: string, cloneName: string) {
      const srcVm = this.instances.find((i) => i.id === sourceId)
      if (!srcVm) {
        throw new Error('Source instance not found locally.')
      }

      const snapName = `clone-snap-${sourceId}-${Date.now()}`
      const tempId = `vm-clone-placeholder-${Math.random().toString(36).substr(2, 9)}`
      const placeholderVm: Instance = {
        id: tempId,
        name: cloneName,
        status: 'Provisioning',
        ip: '-',
        flavor: srcVm.flavor,
        image: 'Snapshotting...',
        age: 'Just now',
        host: srcVm.host,
        statusClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/25',
        bulletClass: 'bg-blue-500 animate-pulse',
        taskState: 'Requesting snapshot...'
      }
      this.instances.unshift(placeholderVm)

      try {
        this.updateStateHelper(tempId, 'Provisioning', 'bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse', {
          taskState: 'Snapshotting source VM...'
        })
        await computeService.createImageSnapshot(sourceId, snapName)

        const [sourceDetail, interfaces] = await Promise.all([
          computeService.getInstanceDetail(sourceId),
          computeService.getAttachedInterfaces(sourceId)
        ])

        const originalFlavor = sourceDetail.flavor?.id || sourceDetail.flavor?.name || srcVm.flavor
        const originalKeypair = sourceDetail.key_name || ''
        const originalSecGroups = Array.isArray(sourceDetail.security_groups)
          ? sourceDetail.security_groups.map((sg: any) => sg.name)
          : []
        const originalNets = Array.isArray(interfaces)
          ? interfaces.map((att: any) => att.net_id).filter(Boolean)
          : []

        this.updateStateHelper(tempId, 'Provisioning', 'bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse', {
          taskState: 'Uploading snapshot to Glance...'
        })

        let snapshotImageId: string | null = null
        let attempts = 0
        const maxAttempts = 60

        while (attempts < maxAttempts) {
          attempts++
          const img = await computeService.findImageByName(snapName)
          if (img) {
            snapshotImageId = img.id
            if (img.status === 'Active') {
              break
            } else if (img.status === 'Saving') {
              this.updateStateHelper(tempId, 'Provisioning', 'bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse', {
                taskState: `Uploading snapshot (${attempts * 4}s)...`
              })
            }
          }
          await new Promise((resolve) => setTimeout(resolve, 4000))
        }

        if (!snapshotImageId) {
          throw new Error('Snapshot image was not found in Glance catalog after timeout.')
        }

        this.updateStateHelper(tempId, 'Provisioning', 'bg-blue-500/10 text-blue-400 border border-blue-500/25', 'bg-blue-500 animate-pulse', {
          taskState: 'Provisioning VM from snapshot...'
        })

        const cloneVm = await computeService.launchInstance(
          cloneName,
          originalFlavor,
          snapshotImageId,
          originalKeypair,
          originalNets,
          originalSecGroups
        )

        const pIdx = this.instances.findIndex((i) => i.id === tempId)
        if (pIdx > -1) {
          this.instances.splice(pIdx, 1)
        }
        this.instances.unshift(cloneVm)

        this.pollInstanceStatus(cloneVm.id, 'Active')

        setTimeout(async () => {
          try {
            if (snapshotImageId) {
              await computeService.deleteImage(snapshotImageId)
              console.log(`[CloudPilot] Cloned successfully. Snapshot ${snapshotImageId} cleaned up from Glance.`)
            }
          } catch (e) {
            console.error('[CloudPilot] Failed to delete temporary snapshot image:', e)
          }
        }, 12000)

      } catch (err: any) {
        console.error('[CloudPilot] VM Clone failed:', err)
        this.updateStateHelper(tempId, 'Error', 'bg-red-500/10 text-red-400 border border-red-500/20', 'bg-red-500', {
          taskState: `Clone failed: ${err.message || err}`
        })
      }
    }
  }
})
