<template>
  <div class="p-8 h-[calc(100vh-6.25rem)] flex flex-col space-y-4">
    <div>
      <h1 class="text-3xl font-extrabold tracking-tight bg-linear-to-r from-white to-zinc-400 bg-clip-text text-transparent">AI Co-Pilot</h1>
      <p class="text-zinc-400 mt-1 max-w-3xl">Chat-driven cloud automation, diagnostic summaries, and OpenTofu generation.</p>
    </div>

    <!-- Chat Workspace -->
    <div class="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
      <!-- Chat Header -->
      <div class="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span class="font-semibold text-sm text-white">CloudPilot LLM-v1</span>
        </div>
        <button class="text-xs text-zinc-400 hover:text-white border border-zinc-800 rounded px-2.5 py-1 bg-zinc-900">
          Clear Conversation
        </button>
      </div>

      <!-- Messages Body -->
      <div class="flex-1 overflow-auto p-6 space-y-6">
        <!-- Message 1: User -->
        <div class="flex items-start gap-4 justify-end">
          <div class="max-w-[70%] bg-blue-600/10 border border-blue-500/20 text-zinc-100 rounded-2xl rounded-tr-none px-4 py-3 text-sm">
            Find unused block storage volumes in the "Production-Env" project.
          </div>
          <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            ME
          </div>
        </div>

        <!-- Message 2: Assistant -->
        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            AI
          </div>
          <div class="max-w-[75%] bg-zinc-900/60 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none px-5 py-4 text-sm space-y-3">
            <p>I scanned the volumes in <code class="bg-zinc-850 px-1.5 py-0.5 rounded text-xs text-blue-400 font-mono">Production-Env</code> and matched attachments across OpenStack Nova API. I found **2 idle volumes** that are currently unattached and have seen no read/write ops in the last 14 days:</p>
            <div class="bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-xs space-y-1.5 font-mono">
              <div class="flex justify-between"><span class="text-zinc-400">ID: vol-db-temp-01</span><span class="text-amber-500">Size: 400 GB</span></div>
              <div class="flex justify-between"><span class="text-zinc-400">ID: vol-logs-dump</span><span class="text-amber-500">Size: 1.5 TB</span></div>
            </div>
            <p>This accounts for **1.9 TB** of unused SSD storage. Would you like me to generate an **OpenTofu config plan** to safely archive and clean these up?</p>
          </div>
        </div>

        <!-- Message 3: User -->
        <div class="flex items-start gap-4 justify-end">
          <div class="max-w-[70%] bg-blue-600/10 border border-blue-500/20 text-zinc-100 rounded-2xl rounded-tr-none px-4 py-3 text-sm">
            Yes, please generate the OpenTofu code.
          </div>
          <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
            ME
          </div>
        </div>

        <!-- Message 4: Assistant -->
        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            AI
          </div>
          <div class="max-w-[75%] bg-zinc-900/60 border border-zinc-800 text-zinc-100 rounded-2xl rounded-tl-none px-5 py-4 text-sm space-y-3">
            <p>Here is the OpenTofu code to remove the orphaned resources. You can run this directly in our integrated Automation console:</p>
            <pre class="bg-zinc-950 border border-zinc-850 rounded-lg p-4 text-xs font-mono text-emerald-400 overflow-x-auto">
# OpenTofu plan to destroy orphaned resources
resource "openstack_blockstorage_volume_v3" "vol_db_temp_01" {
  name        = "vol-db-temp-01"
  size        = 400
  # State: IDLE
}

resource "openstack_blockstorage_volume_v3" "vol_logs_dump" {
  name        = "vol-logs-dump"
  size        = 1500
  # State: IDLE
}</pre>
            <div class="flex gap-2">
              <button class="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3 py-1.5 rounded transition-colors">
                Apply Plan
              </button>
              <button class="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs px-3 py-1.5 rounded transition-colors">
                Copy Code
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Footer -->
      <div class="p-4 border-t border-zinc-800 bg-zinc-900/20">
        <form @submit.prevent class="flex items-center gap-3 bg-zinc-900 border border-zinc-850 rounded-lg p-2 focus-within:ring-1 focus-within:ring-blue-500 transition-shadow">
          <input placeholder="Ask AI Co-pilot for actions, resource lookups, or configurations..." class="flex-1 bg-transparent border-0 outline-none text-sm text-white px-3 py-1.5" />
          <button class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors">
            Ask
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// AI chat logic can reside here in future sprints
</script>
