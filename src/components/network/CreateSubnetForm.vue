<template>
  <div v-if="show" class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in duration-150">
    <h4 class="text-xs font-bold text-white uppercase flex items-center gap-1.5">
      <LinkIcon :size="12" :style="{ color: themeStore.accentColor }" />
      Add Subnet to Network
    </h4>
    <div class="space-y-3">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] text-zinc-500 font-bold uppercase">Subnet Name</label>
          <input v-model="name" placeholder="e.g., subnet-private" class="form-input" />
        </div>
        <div class="space-y-1">
          <label class="text-[10px] text-zinc-500 font-bold uppercase">CIDR Block (IP Range)</label>
          <input v-model="cidr" placeholder="e.g., 10.0.10.0/24" class="form-input" />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="text-[10px] text-zinc-500 font-bold uppercase">Gateway IP (Optional)</label>
          <input v-model="gatewayIp" placeholder="e.g., 10.0.10.1" class="form-input" />
        </div>
        <div class="flex items-center pt-5 gap-2 select-none">
          <input type="checkbox" id="dhcp-check-sub" v-model="enableDhcp" class="h-4 w-4" :style="{ accentColor: themeStore.accentColor }" />
          <label for="dhcp-check-sub" class="text-xs text-zinc-400 font-semibold cursor-pointer">Enable DHCP</label>
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2 pt-2">
      <button @click="handleCancel" class="btn-table">Cancel</button>
      <button @click="handleSubmit" :disabled="!name || !cidr || loading" class="btn-primary flex items-center gap-1.5">
        <Loader v-if="loading" :size="12" class="animate-spin" />
        Save Subnet
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Link as LinkIcon, Loader } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'
import { networkService } from '@/services/network.service'

const props = defineProps<{
  networkId: string
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const themeStore = useThemeStore()

const name = ref('')
const cidr = ref('')
const gatewayIp = ref('')
const enableDhcp = ref(true)
const loading = ref(false)

function handleCancel() {
  name.value = ''
  cidr.value = ''
  gatewayIp.value = ''
  enableDhcp.value = true
  emit('cancel')
}

async function handleSubmit() {
  try {
    loading.value = true
    await networkService.createSubnet({
      networkId: props.networkId,
      name: name.value,
      cidr: cidr.value,
      gatewayIp: gatewayIp.value || undefined,
      enableDhcp: enableDhcp.value
    })
    handleCancel()
    emit('saved')
  } catch (err: any) {
    alert('Failed to create subnet: ' + (err.message || err))
  } finally {
    loading.value = false
  }
}
</script>
