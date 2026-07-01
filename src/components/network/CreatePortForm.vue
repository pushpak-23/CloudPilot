<template>
  <div v-if="show" class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
    <h4 class="text-xs font-bold text-white uppercase flex items-center gap-1.5">
      <ServerIcon :size="12" :style="{ color: themeStore.accentColor }" />
      Create SDN Port
    </h4>
    <div class="space-y-3">
      <div class="space-y-1">
        <label class="text-[10px] text-zinc-500 font-bold uppercase">Port Name</label>
        <input v-model="name" placeholder="e.g., port-dev-service" class="form-input" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] text-zinc-500 font-bold uppercase">IP Assignment</label>
          <select v-model="ipType" class="form-input">
            <option value="dhcp">DHCP (Auto-allocated)</option>
            <option value="static" :disabled="!subnetId">Static IP Address</option>
          </select>
        </div>
        <div class="space-y-1" v-if="ipType === 'static'">
          <label class="text-[10px] text-zinc-500 font-bold uppercase">Static IP Address</label>
          <input v-model="staticIp" placeholder="e.g., 10.0.5.50" class="form-input" />
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button @click="handleCancel" class="btn-table">Cancel</button>
      <button @click="handleSubmit" :disabled="!name || (ipType === 'static' && !staticIp) || loading" class="btn-primary flex items-center gap-1.5">
        <Loader v-if="loading" :size="12" class="animate-spin" />
        Create Port
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Server as ServerIcon, Loader } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { networkService } from '@/services/network.service'

const props = defineProps<{
  networkId: string
  subnetId: string | null
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const themeStore = useThemeStore()

const name = ref('')
const ipType = ref('dhcp')
const staticIp = ref('')
const loading = ref(false)

function handleCancel() {
  name.value = ''
  ipType.value = 'dhcp'
  staticIp.value = ''
  emit('cancel')
}

async function handleSubmit() {
  try {
    loading.value = true
    let fixedIps: any[] = []
    if (ipType.value === 'static' && staticIp.value) {
      fixedIps = [{ ip_address: staticIp.value }]
      if (props.subnetId) {
        fixedIps[0].subnet_id = props.subnetId
      }
    }
    await networkService.createPort({
      networkId: props.networkId,
      name: name.value,
      fixedIps: fixedIps.length > 0 ? fixedIps : undefined
    })
    handleCancel()
    emit('saved')
  } catch (err: any) {
    alert('Failed to create port: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}
</script>
