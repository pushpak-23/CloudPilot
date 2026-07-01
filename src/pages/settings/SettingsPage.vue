<template>
  <div class="p-8 space-y-6 max-w-4xl">
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight text-white">System Settings</h1>
      <p class="text-zinc-400 mt-1">Configure user profiles, API endpoints, regions, and multi-factor authentication.</p>
    </div>

    <!-- settings sections -->
    <div class="space-y-6">
      <!-- Section 1: User Profile -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3">User Profile</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Display Name</label>
            <input value="Administrator" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Email Address</label>
            <input value="admin@cloudpilot.internal" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <!-- Section 2: OpenStack API Configuration -->
      <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-4">
        <h2 class="font-semibold text-lg text-white border-b border-zinc-800 pb-3">OpenStack Credentials</h2>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-xs font-semibold text-zinc-400 uppercase">Keystone Identity Endpoint (v3)</label>
            <input value="https://identity.cloudpilot.internal:5000/v3" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Domain Name</label>
              <input value="default" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Project / Tenant</label>
              <input value="admin" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div class="space-y-2">
              <label class="text-xs font-semibold text-zinc-400 uppercase">Default Region</label>
              <input value="RegionOne" class="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
          <button class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3 py-1.5 rounded transition-colors">
            Setup MFA
          </button>
        </div>
        <hr class="border-zinc-850" />
        <div class="flex items-center justify-between py-2">
          <div>
            <div class="text-sm font-medium text-white">Console Session Timeout</div>
            <div class="text-xs text-zinc-500">Log out automatically after 30 minutes of inactivity.</div>
          </div>
          <input type="checkbox" checked class="accent-blue-500 h-4 w-4" />
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button class="px-4 py-2 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-400 hover:text-white transition-colors bg-transparent">
          Discard Changes
        </button>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Setting management logic here
</script>
