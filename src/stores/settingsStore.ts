import { create } from 'zustand'
import { loadSettings, saveSettings } from '../lib/storage'

type SettingsStore = {
  aiEnabled: boolean
  setAiEnabled: (value: boolean) => void
  toggleAiEnabled: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  aiEnabled: loadSettings().aiEnabled,

  setAiEnabled: (value) => {
    saveSettings({ aiEnabled: value })
    set({ aiEnabled: value })
  },

  toggleAiEnabled: () => {
    get().setAiEnabled(!get().aiEnabled)
  },
}))
