<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/80 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div
      class="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/10">
        <div>
          <h2 class="text-xl font-bold text-white">SSH Keypair Configuration</h2>
          <p class="text-xs text-zinc-500 mt-0.5">Generate a new keypair or import an existing public key.</p>
        </div>
        <button
          @click="handleClose"
          class="text-zinc-500 hover:text-zinc-300 transition-colors text-lg font-semibold cursor-pointer bg-transparent border-0"
        >
          ✕
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-zinc-800 bg-zinc-950/20 px-6">
        <button
          @click="activeTab = 'create'"
          :class="[
            'py-3.5 px-4 text-sm font-semibold border-b-2 transition-all relative -mb-[2px] cursor-pointer',
            activeTab === 'create'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          ]"
        >
          Create Keypair
        </button>
        <button
          @click="activeTab = 'import'"
          :class="[
            'py-3.5 px-4 text-sm font-semibold border-b-2 transition-all relative -mb-[2px] cursor-pointer',
            activeTab === 'import'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          ]"
        >
          Import Keypair
        </button>
      </div>

      <!-- Form Content -->
      <div class="p-6 space-y-5 flex-1">
        <!-- Error Banner -->
        <div
          v-if="error"
          class="p-3.5 bg-red-950/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <div class="space-y-4">
          <!-- Keypair Name (Used in both tabs) -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Keypair Name</label>
            <input
              v-model="name"
              placeholder="e.g., admin-ssh-key"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600 outline-none"
              required
            />
          </div>

          <!-- Create tab instructions -->
          <div v-if="activeTab === 'create'" class="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-3">
            <div class="text-xs text-zinc-400 leading-relaxed">
              Generating a keypair provisions a public key on the OpenStack metadata server and returns a matching private key.
            </div>
            <div class="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-500 text-xs">
              <span class="text-sm leading-none">⚠️</span>
              <div class="leading-relaxed">
                <strong class="font-semibold block mb-0.5">Private Key Download:</strong>
                Your browser will automatically download the private key (<span class="font-mono bg-zinc-950 px-1 py-0.5 rounded border border-zinc-850 text-zinc-300">{{ name || 'keypair' }}.pem</span>) file. Store this securely; it cannot be recovered or downloaded again.
              </div>
            </div>
          </div>

          <!-- Import tab public key textarea -->
          <div v-if="activeTab === 'import'" class="space-y-1.5">
            <label class="text-xs font-bold text-zinc-400 uppercase tracking-wider">Public Key Data</label>
            <textarea
              v-model="publicKey"
              rows="6"
              placeholder="Paste your SSH public key here (e.g. 'ssh-rsa AAAAB3NzaC1yc2E... user@host')"
              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-zinc-600 outline-none resize-none"
              required
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div class="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/10">
        <button
          @click="handleClose"
          class="px-4.5 py-2.5 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded-lg text-sm text-zinc-400 bg-transparent cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          @click="submit"
          :disabled="isSubmitDisabled"
          class="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center gap-2"
        >
          <Loader v-if="loading" class="animate-spin" :size="14" />
          <span>{{ activeTab === 'create' ? 'Generate & Download' : 'Import Keypair' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AlertCircle, Loader } from 'lucide-vue-next'
import { useComputeStore } from '@/stores/compute'

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{
  (e: 'close'): void
}>()

const computeStore = useComputeStore()

const activeTab = ref<'create' | 'import'>('create')
const name = ref('')
const publicKey = ref('')
const loading = ref(false)
const error = ref('')

const isSubmitDisabled = computed(() => {
  if (loading.value) return true
  if (!name.value.trim()) return true
  if (activeTab.value === 'import' && !publicKey.value.trim()) return true
  return false
})

function handleClose() {
  name.value = ''
  publicKey.value = ''
  error.value = ''
  loading.value = false
  emit('close')
}

async function submit() {
  if (isSubmitDisabled.value) return

  loading.value = true
  error.value = ''

  try {
    const isImport = activeTab.value === 'import'
    const key = await computeStore.addKeypair(
      name.value.trim(),
      isImport ? publicKey.value.trim() : undefined
    )

    // Trigger download of private key if generated
    if (!isImport && key?.privateKey) {
      const blob = new Blob([key.privateKey], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${key.name}.pem`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    handleClose()
  } catch (err: any) {
    error.value = err.message || 'An error occurred while creating the SSH keypair.'
  } finally {
    loading.value = false
  }
}
</script>
