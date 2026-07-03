import { defineStore } from 'pinia'

export interface ThemePreset {
  name: string
  label: string
  h: number
  s: number
  l: number
}

export const themePresets: ThemePreset[] = [
  { name: 'blue',    label: 'Blue',    h: 217, s: 91, l: 60 },
  { name: 'amber',   label: 'Amber',   h: 38,  s: 92, l: 50 },
  { name: 'emerald', label: 'Emerald', h: 160, s: 84, l: 39 },
  { name: 'rose',    label: 'Rose',    h: 350, s: 89, l: 60 },
  { name: 'violet',  label: 'Violet',  h: 263, s: 70, l: 50 },
  { name: 'cyan',    label: 'Cyan',    h: 188, s: 94, l: 43 },
]

const STORAGE_KEY = 'cp_accent_theme'

function applyThemeToDOM(preset: ThemePreset) {
  const root = document.documentElement
  root.style.setProperty('--accent-h', String(preset.h))
  root.style.setProperty('--accent-s', `${preset.s}%`)
  root.style.setProperty('--accent-l', `${preset.l}%`)
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    activeTheme: 'blue' as string,
  }),

  getters: {
    currentPreset(state): ThemePreset {
      return themePresets.find(p => p.name === state.activeTheme) ?? themePresets[0] ?? { name: 'blue', label: 'Blue', h: 217, s: 91, l: 60 }
    },
    /** Returns the accent color as an HSL string for use in inline styles */
    accentColor(): string {
      const p = this.currentPreset
      return `hsl(${p.h}, ${p.s}%, ${p.l}%)`
    },
    accentColorHover(): string {
      const p = this.currentPreset
      return `hsl(${p.h}, ${p.s}%, ${Math.min(p.l + 8, 80)}%)`
    },
    accentColorMuted(): string {
      const p = this.currentPreset
      return `hsl(${p.h}, ${p.s}%, 20%)`
    },
    accentColorSubtle(): string {
      const p = this.currentPreset
      return `hsla(${p.h}, ${p.s}%, ${p.l}%, 0.1)`
    },
    accentColorBorder(): string {
      const p = this.currentPreset
      return `hsla(${p.h}, ${p.s}%, ${p.l}%, 0.25)`
    },
    accentShadow(): string {
      const p = this.currentPreset
      return `0 10px 15px -3px hsla(${p.h}, ${p.s}%, ${p.l}%, 0.15)`
    },
  },

  actions: {
    setTheme(name: string) {
      const preset = themePresets.find(p => p.name === name)
      if (!preset) return
      this.activeTheme = name
      applyThemeToDOM(preset)
      localStorage.setItem(STORAGE_KEY, name)
    },

    /** Call once on app startup to restore persisted theme */
    initTheme() {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && themePresets.find(p => p.name === saved)) {
        this.activeTheme = saved
      }
      applyThemeToDOM(this.currentPreset)
    },
  },
})
