import { create } from 'zustand'
import { loadSettings, saveSettings } from '../lib/storage'
import type { Theme } from '../lib/theme'

type SettingsStore = {
  aiEnabled: boolean
  theme: Theme
  setAiEnabled: (value: boolean) => void
  toggleAiEnabled: () => void
  setTheme: (theme: Theme) => void
}

// Reflect the active theme on the document so the CSS variables switch.
function applyTheme(theme: Theme): void {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

const initial = loadSettings()
applyTheme(initial.theme)

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  aiEnabled: initial.aiEnabled,
  theme: initial.theme,

  setAiEnabled: (value) => {
    saveSettings({ aiEnabled: value, theme: get().theme })
    set({ aiEnabled: value })
  },

  toggleAiEnabled: () => {
    get().setAiEnabled(!get().aiEnabled)
  },

  setTheme: (theme) => {
    saveSettings({ aiEnabled: get().aiEnabled, theme })
    applyTheme(theme)
    set({ theme })
  },
}))
