<template>
  <div class="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden select-none">
    <!-- Neon grid background effects -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.06),transparent_60%)]"></div>
    <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full filter blur-[100px]"></div>
    <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-650/5 rounded-full filter blur-[100px]"></div>

    <div class="max-w-md w-full relative z-10 my-8">
      <!-- Logo Header -->
      <div class="text-center mb-6 flex flex-col items-center">
        <div class="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 border border-blue-400/20">
          <Cloud :size="26" class="text-white" />
        </div>
        <h1 class="text-3xl font-black text-white tracking-widest uppercase">CloudPilot</h1>
        <p class="text-zinc-500 text-xs font-semibold tracking-wider uppercase mt-1">Keystone Control Plane Portal</p>
      </div>

      <!-- Login Card -->
      <div class="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative">
        <!-- Accent Line -->
        <div class="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-t-2xl"></div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Username Input -->
          <div class="space-y-1.5">
            <label for="username" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Username</label>
            <div class="relative flex items-center">
              <User class="absolute left-3 text-zinc-500" :size="16" />
              <input
                id="username"
                type="text"
                v-model="username"
                required
                placeholder="Enter Keystone User ID"
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-1.5">
            <label for="password" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
            <div class="relative flex items-center">
              <Lock class="absolute left-3 text-zinc-500" :size="16" />
              <input
                id="password"
                type="password"
                v-model="password"
                required
                placeholder="••••••••••••"
                class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-650 outline-none transition-colors"
              />
            </div>
          </div>

          <!-- Collapsible Settings Header -->
          <div class="pt-2 border-t border-zinc-800/50">
            <button
              type="button"
              @click="showSettings = !showSettings"
              class="w-full flex items-center justify-between text-[11px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider py-1.5 outline-none transition-colors cursor-pointer"
            >
              <div class="flex items-center gap-1.5">
                <Settings :size="14" class="text-zinc-500" />
                <span>OpenStack Connection Settings</span>
              </div>
              <ChevronDown v-if="!showSettings" :size="14" class="text-zinc-500" />
              <ChevronUp v-else :size="14" class="text-zinc-500" />
            </button>

            <!-- Collapsible Settings Panel -->
            <div v-show="showSettings" class="mt-4 space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40 transition-all duration-300">
              <!-- Auth URL -->
              <div class="space-y-1">
                <label for="authUrl" class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Keystone Auth URL</label>
                <input
                  id="authUrl"
                  type="url"
                  v-model="authUrl"
                  placeholder="https://identity.example.com:5000/v3"
                  class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none transition-colors"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Domain Name -->
                <div class="space-y-1">
                  <label for="domainName" class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">User Domain</label>
                  <input
                    id="domainName"
                    type="text"
                    v-model="domainName"
                    placeholder="Default"
                    class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>

                <!-- Project Name -->
                <div class="space-y-1">
                  <label for="projectName" class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Project Scope</label>
                  <input
                    id="projectName"
                    type="text"
                    v-model="projectName"
                    placeholder="admin"
                    class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <!-- Region Name -->
                <div class="space-y-1">
                  <label for="regionName" class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Region</label>
                  <input
                    id="regionName"
                    type="text"
                    v-model="regionName"
                    placeholder="RegionOne"
                    class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-700 outline-none transition-colors"
                  />
                </div>

                <!-- Ignore SSL -->
                <div class="flex items-center gap-2 pt-4">
                  <input
                    id="ignoreSsl"
                    type="checkbox"
                    v-model="ignoreSsl"
                    class="rounded border-zinc-800 bg-zinc-950 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label for="ignoreSsl" class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider cursor-pointer">Ignore SSL Verification</label>
                </div>
              </div>

              <!-- Custom CA Certificate -->
              <div v-show="!ignoreSsl" class="space-y-1 pt-1">
                <label for="caCert" class="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">CA Certificate (PEM Format)</label>
                <textarea
                  id="caCert"
                  v-model="caCert"
                  rows="4"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  class="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg p-2 text-[10px] font-mono text-zinc-300 placeholder-zinc-700 outline-none transition-colors resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div v-if="error" class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle :size="14" class="shrink-0 mt-0.5" />
            <span class="break-words">{{ error }}</span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-blue-600/15 border border-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Loader v-if="authStore.loading" class="animate-spin" :size="16" />
            <span v-else>Authenticate</span>
          </button>
        </form>
      </div>

      <!-- Footer Info -->
      <p class="text-center text-[10px] text-zinc-600 uppercase tracking-wider mt-6 select-none">
        CloudPilot Platform Security Gateway v0.1.0
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Cloud, User, Lock, AlertCircle, Loader, Settings, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Input States
const username = ref('infra-analysing-memb')
const password = ref('esec@P61#ANALYSE')

// OpenStack connection configuration fields (defaults matching real lab auth.sh context)
const showSettings = ref(false)
const authUrl = ref('https://192.168.101.10:5000/v3')
const domainName = ref('infra-services')
const projectName = ref('infra-analysing')
const regionName = ref('RegionOne')
const ignoreSsl = ref(true)
const caCert = ref('')

const error = ref('')

async function handleLogin() {
  error.value = ''
  if (!username.value.trim()) {
    error.value = 'Please provide a username context.'
    return
  }

  try {
    await authStore.login({
      username: username.value.trim(),
      password: password.value,
      project: projectName.value.trim(),
      domain: domainName.value.trim(),
      auth_url: authUrl.value.trim() || undefined,
      region: regionName.value.trim() || undefined,
      ca_cert: ignoreSsl.value ? undefined : caCert.value.trim() || undefined
    })
    router.push({ name: 'dashboard' })
  } catch (err: any) {
    error.value = err.message || 'Authentication rejected by Keystone. Check credentials.'
  }
}
</script>
