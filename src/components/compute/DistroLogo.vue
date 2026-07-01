<template>
  <span :class="['inline-flex items-center justify-center shrink-0', sizeClass]" :title="distroName">
    <!-- Ubuntu -->
    <svg v-if="distro === 'ubuntu'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#ubuntuGrad)"/>
      <circle cx="12" cy="12" r="6.2" stroke="#ffffff" stroke-width="1.8"/>
      <path d="M12 4v4M6.5 13.5l3.5-2M17.5 13.5l-3.5-2" stroke="#E95420" stroke-width="2"/>
      <circle cx="12" cy="4.5" r="1.6" fill="#ffffff"/>
      <circle cx="5.5" cy="15.5" r="1.6" fill="#ffffff"/>
      <circle cx="18.5" cy="15.5" r="1.6" fill="#ffffff"/>
      <defs>
        <linearGradient id="ubuntuGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#E95420"/>
          <stop offset="100%" stop-color="#B83C1B"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Debian -->
    <svg v-else-if="distro === 'debian'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#debianGrad)"/>
      <path d="M12 6c-2.8 0-5 2.2-5 5 0 2.2 1.3 4.1 3.2 4.9.4.2.9.1 1-.2.2-.4.1-.9-.2-1.1-1.3-.5-2.2-1.8-2.2-3.3 0-2.1 1.7-3.8 3.8-3.8s3.8 1.7 3.8 3.8c0 1.2-.6 2.3-1.5 2.9-.4.3-.5.7-.3 1.1.2.4.7.5 1.1.2 1.4-1 2.3-2.6 2.3-4.4 0-2.8-2.2-5-5-5z" fill="#ffffff"/>
      <path d="M11 15c.3-.3.3-.8 0-1.1s-.8-.3-1.1 0l-1.2 1.2c-.3.3-.3.8 0 1.1s.8.3 1.1 0l1.2-1.2z" fill="#ffffff"/>
      <defs>
        <linearGradient id="debianGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#D70A53"/>
          <stop offset="100%" stop-color="#9E0034"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- CentOS -->
    <svg v-else-if="distro === 'centos'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#20232A"/>
      <path d="M12 5l2.5 4.5h-5L12 5zm5 7l-4.5-2.5v5L17 12zm-5 5l-2.5-4.5h5L12 17zm-5-5l4.5 2.5v-5L7 12z" fill="#D24726"/>
      <path d="M12 5.5l2.2 4h-4.4l2.2-4zm4.5 6.5l-4-2.2v4.4l4-2.2zm-4.5 4.5l-2.2-4h4.4l-2.2 4zM7.5 12l4 2.2v-4.4L7.5 12z" fill="#107C41"/>
      <path d="M12 7l1.5 3h-3L12 7zm3.5 5l-3-1.5v3l3-1.5zm-3.5 3.5l-1.5-3h3l-1.5 3zM8.5 12l3 1.5v-3L8.5 12z" fill="#0072C6"/>
      <path d="M12 8.5L13 11h-2l1-2.5zm2.5 3.5l-2.5-1v2l2.5-1zm-2.5 2.5l-1-2.5h2l-1 2.5zm-2.5-2.5l2.5 1v-2l-2.5 1z" fill="#F8A51D"/>
      <circle cx="12" cy="12" r="1.5" fill="#ffffff"/>
    </svg>

    <!-- RedHat / RHEL -->
    <svg v-else-if="distro === 'redhat'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#rhelGrad)"/>
      <path d="M5.5 15.5c0-1.2 2.5-2.8 6.5-2.8s6.5 1.6 6.5 2.8c0 .6-.6 1.2-3 1.2H8.5c-2.4 0-3-.6-3-1.2z" fill="#ffffff"/>
      <path d="M9 13.5c0-1.8 1.2-3.8 3-3.8s3 2 3 3.8H9z" fill="#ffffff"/>
      <path d="M3.5 16.8c0-.6 2.5-.9 8.5-.9s8.5.3 8.5.9c0 .9-2.5 1.7-8.5 1.7s-8.5-.8-8.5-1.7z" fill="#ffffff" opacity="0.75"/>
      <defs>
        <linearGradient id="rhelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#EE0000"/>
          <stop offset="100%" stop-color="#990000"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Fedora -->
    <svg v-else-if="distro === 'fedora'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#fedoraGrad)"/>
      <path d="M12.5 5.5c-2.3 0-4.2 1.9-4.2 4.2 0 1.1.4 2.1 1.2 2.9l2-2v-1.8c0-.6.4-1.1 1.1-1.1h1.1v2.2h-1.1c-.3 0-.6.3-.6.6v1.3l2.9 2.9c.8-.8 1.2-1.8 1.2-2.9 0-2.3-1.9-4.2-4.2-4.2z" fill="#ffffff"/>
      <path d="M11.5 18.5c2.3 0 4.2-1.9 4.2-4.2 0-1.1-.4-2.1-1.2-2.9l-2 2v1.8c0 .6-.4 1.1-1.1 1.1h-1.1v-2.2h1.1c.3 0 .6-.3.6-.6v-1.3l-2.9-2.9c-.8.8-1.2 1.8-1.2 2.9 0 2.3 1.9 4.2 4.2 4.2z" fill="#ffffff" opacity="0.85"/>
      <defs>
        <linearGradient id="fedoraGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3C6EB4"/>
          <stop offset="100%" stop-color="#244575"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Rocky Linux -->
    <svg v-else-if="distro === 'rocky'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#1C1F26"/>
      <path d="M12 4.5c4.1 0 7.5 3.4 7.5 7.5s-3.4 7.5-7.5 7.5-7.5-3.4-7.5-7.5 3.4-7.5 7.5-7.5z" stroke="#10B981" stroke-width="2.2" stroke-dasharray="32 12" stroke-linecap="round"/>
      <path d="M9.5 8.5h2.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H9.5v3.5h-1.5v-6.5zm1.5 2c.3 0 .5-.2 0.5-.5s-.2-.5-.5-.5h-1v1h1z" fill="#ffffff"/>
      <path d="M13 12.5L15.5 17h-2L11.2 13H13z" fill="#10B981"/>
    </svg>

    <!-- Alma Linux -->
    <svg v-else-if="distro === 'alma'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="#0C0F14"/>
      <path d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M12 5.5c3.6 0 6.5 2.9 6.5 6.5s-2.9 6.5-6.5 6.5" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M5.5 12c0-3.6 2.9-6.5 6.5-6.5" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    </svg>

    <!-- Alpine -->
    <svg v-else-if="distro === 'alpine'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#alpineGrad)"/>
      <path d="M5.5 18l6.5-12 6.5 12H5.5z" fill="#ffffff"/>
      <path d="M9 18l3-5.5 3 5.5H9z" fill="#0E5A84"/>
      <path d="M12 6.5l1.8 3.5h-3.6L12 6.5z" fill="#0E5A84" opacity="0.4"/>
      <defs>
        <linearGradient id="alpineGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0E5A84"/>
          <stop offset="100%" stop-color="#062E44"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Windows -->
    <svg v-else-if="distro === 'windows'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7.8" height="7.8" fill="#0078D4" rx="0.5"/>
      <rect x="12.7" y="3.5" width="7.8" height="7.8" fill="#0078D4" rx="0.5"/>
      <rect x="3.5" y="12.7" width="7.8" height="7.8" fill="#0078D4" rx="0.5"/>
      <rect x="12.7" y="12.7" width="7.8" height="7.8" fill="#0078D4" rx="0.5"/>
    </svg>

    <!-- openSUSE -->
    <svg v-else-if="distro === 'suse'" class="w-full h-full" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="url(#suseGrad)"/>
      <path d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5s2.9 6.5 6.5 6.5 6.5-2.9 6.5-6.5S15.6 5.5 12 5.5zm0 11c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5zm2-6.5c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z" fill="#ffffff"/>
      <defs>
        <linearGradient id="suseGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#73BA25"/>
          <stop offset="100%" stop-color="#4B7A18"/>
        </linearGradient>
      </defs>
    </svg>

    <!-- Generic Linux -->
    <svg v-else class="w-full h-full text-zinc-450" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>(), {
  size: 'sm'
})

const distro = computed(() => {
  const n = (props.name || '').toLowerCase()
  if (n.includes('ubuntu')) return 'ubuntu'
  if (n.includes('debian')) return 'debian'
  if (n.includes('centos')) return 'centos'
  if (n.includes('redhat') || n.includes('rhel') || n.includes('red hat')) return 'redhat'
  if (n.includes('fedora')) return 'fedora'
  if (n.includes('rocky')) return 'rocky'
  if (n.includes('alma')) return 'alma'
  if (n.includes('alpine')) return 'alpine'
  if (n.includes('suse') || n.includes('open suse') || n.includes('opensuse')) return 'suse'
  if (n.includes('win') || n.includes('microsoft')) return 'windows'
  return 'generic'
})

const distroName = computed(() => {
  const d = distro.value
  return d.charAt(0).toUpperCase() + d.slice(1)
})

const sizeClass = computed(() => {
  if (props.size === 'xs') return 'w-3.5 h-3.5'
  if (props.size === 'sm') return 'w-5 h-5'
  if (props.size === 'md') return 'w-8 h-8'
  if (props.size === 'lg') return 'w-12 h-12'
  return 'w-5 h-5'
})
</script>
