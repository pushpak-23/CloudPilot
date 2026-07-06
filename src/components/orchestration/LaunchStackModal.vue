<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto" @click.self="$emit('close')">
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
      <div class="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/20">
        <h3 class="font-bold text-base text-white flex items-center gap-2">
          <Layers :size="18" :style="{ color: 'var(--accent)' }" /> Launch Heat Orchestration Stack
        </h3>
        <button @click="$emit('close')" class="text-zinc-500 hover:text-white transition-colors cursor-pointer text-lg font-bold bg-transparent border-0 outline-none">
          &times;
        </button>
      </div>

      <div class="p-6 space-y-4 text-left overflow-y-auto max-h-[70vh]">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Stack Name</label>
          <input v-model="name" placeholder="e.g., prod-lb-cluster" class="form-input" />
        </div>

        <!-- Template picker -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Choose Template Profile</label>
          <select v-model="profile" class="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="ha_web">High Availability Web Service (HAProxy + 2 Node VMs)</option>
            <option value="pg_pool">PostgreSQL Standby Replica Pool (Primary + 2 Standbys)</option>
            <option value="custom">Paste Custom Template YAML</option>
          </select>
        </div>

        <!-- Parameters form -->
        <div v-if="profile !== 'custom'" class="bg-zinc-950/60 border border-zinc-850 rounded-lg p-4 space-y-4">
          <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Parameters Inputs</h4>
          
          <div class="grid grid-cols-2 gap-4">
            <div v-for="(val, key) in params" :key="key" class="space-y-1.5">
              <label class="text-[9px] font-bold text-zinc-500 uppercase">{{ String(key).replace('_', ' ') }}</label>
              <input v-model="params[key]" class="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white" />
            </div>
          </div>
        </div>

        <!-- Template YAML text area -->
        <div class="space-y-1.5">
          <label class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Template Definition (HOT)</label>
          <textarea
            v-model="yaml"
            rows="6"
            class="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            :readonly="profile !== 'custom'"
          ></textarea>
        </div>
      </div>

      <div class="p-5 border-t border-zinc-800 bg-zinc-950/20 flex justify-end gap-3">
        <button @click="$emit('close')" class="px-4 py-2 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-white transition-all bg-transparent cursor-pointer">
          Cancel
        </button>
        <button
          @click="submit"
          :disabled="!name.trim() || deploying"
          class="px-4.5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer border-0"
          :style="{ backgroundColor: 'var(--accent)' }"
        >
          Deploy Stack
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Layers } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  deploying: boolean
  samples: Record<string, { yaml: string; params: Record<string, string>; title: string }>
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'launch', data: { name: string; templateType: string; parameters: Record<string, string>; yaml: string }): void
}>()

const name = ref('')
const profile = ref('ha_web')
const params = ref<Record<string, string>>({})
const yaml = ref('')

watch(profile, (newVal) => {
  const sample = props.samples[newVal]
  if (sample) {
    params.value = { ...sample.params }
    yaml.value = sample.yaml
  }
}, { immediate: true })

watch(() => props.show, (newVal) => {
  if (newVal) {
    name.value = ''
    profile.value = 'ha_web'
    const sample = props.samples.ha_web
    if (sample) {
      params.value = { ...sample.params }
      yaml.value = sample.yaml
    }
  }
})

function submit() {
  if (!name.value.trim()) return
  const chosenProfile = props.samples[profile.value]
  const title = chosenProfile ? chosenProfile.title : 'Custom HOT Stack'

  emit('launch', {
    name: name.value.trim(),
    templateType: title,
    parameters: { ...params.value },
    yaml: yaml.value
  })
}
</script>
