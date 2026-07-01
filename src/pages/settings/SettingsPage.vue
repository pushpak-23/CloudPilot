<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto">
    <div>
      <h1
        class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent"
      >
        System Settings
      </h1>
      <p class="text-zinc-400 mt-1 max-w-3xl">Configure user profiles, API endpoints, regions, appearance, and multi-factor authentication.</p>
    </div>

    <!-- settings sections -->
    <div class="space-y-6">

      <!-- Section 0: Appearance & Theme -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-5">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
          <Palette :size="20" :style="{ color: themeStore.accentColor }" />
          Appearance & Theme
        </h2>
        <div class="space-y-3">
          <div class="text-sm font-medium text-white">Accent Color</div>
          <p class="text-xs text-zinc-500">Select a primary accent color for the entire application. Changes are applied instantly and saved automatically.</p>
          <div class="flex flex-wrap gap-3 pt-1">
            <button
              v-for="preset in themePresets"
              :key="preset.name"
              @click="themeStore.setTheme(preset.name)"
              class="group relative flex flex-col items-center gap-2 cursor-pointer bg-transparent border-0 p-0"
              :title="preset.label"
            >
              <div
                class="w-10 h-10 rounded-full transition-all duration-200 ring-offset-2 ring-offset-zinc-950"
                :class="themeStore.activeTheme === preset.name ? 'ring-2 scale-110' : 'hover:scale-105'"
                :style="{
                  backgroundColor: `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`,
                  ringColor: themeStore.activeTheme === preset.name ? `hsl(${preset.h}, ${preset.s}%, ${preset.l}%)` : undefined,
                  boxShadow: themeStore.activeTheme === preset.name
                    ? `0 0 0 2px #09090b, 0 0 0 4px hsl(${preset.h}, ${preset.s}%, ${preset.l}%)`
                    : 'none',
                }"
              >
                <Check
                  v-if="themeStore.activeTheme === preset.name"
                  :size="18"
                  class="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              </div>
              <span
                class="text-[10px] font-semibold uppercase tracking-wider transition-colors"
                :class="themeStore.activeTheme === preset.name ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'"
              >
                {{ preset.label }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Section 1: User Profile -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3">User Profile</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Display Name</label>
            <input value="Administrator" class="form-input" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Email Address</label>
            <input value="admin@cloudpilot.internal" class="form-input" />
          </div>
        </div>
      </div>

      <!-- Section 2: OpenStack API Configuration -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3">OpenStack Credentials</h2>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Keystone Identity Endpoint (v3)</label>
            <input value="https://identity.cloudpilot.internal:5000/v3" class="form-input font-mono" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Domain Name</label>
              <input value="default" class="form-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Project / Tenant</label>
              <input value="admin" class="form-input" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Default Region</label>
              <input value="RegionOne" class="form-input" />
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Security & Sessions -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3">Security & Multi-Factor Auth</h2>
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-white">Require Multi-Factor Authentication (MFA)</div>
            <div class="text-xs text-zinc-500">Adds an extra layer of security to your admin account using TOTP tokens.</div>
          </div>
          <button
            class="text-white font-medium text-xs px-3 py-1.5 rounded transition-colors"
            :style="{ backgroundColor: themeStore.accentColor }"
          >
            Setup MFA
          </button>
        </div>
        <hr class="border-zinc-850" />
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-white">Console Session Timeout</div>
            <div class="text-xs text-zinc-500">Log out automatically after 30 minutes of inactivity.</div>
          </div>
          <input type="checkbox" checked class="h-4 w-4" :style="{ accentColor: themeStore.accentColor }" />
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button class="px-4 py-2 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors bg-transparent cursor-pointer">
          Discard Changes
        </button>
        <button class="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Palette } from 'lucide-vue-next'
import { useThemeStore, themePresets } from '@/stores/theme'

const themeStore = useThemeStore()
</script>
