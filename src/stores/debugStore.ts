import { create } from 'zustand'
import { loadDebug, saveDebug } from '../lib/storage'

type DebugStore = {
  unlockAll: boolean
  setUnlockAll: (value: boolean) => void
  toggleUnlockAll: () => void
}

export const useDebugStore = create<DebugStore>((set, get) => ({
  unlockAll: loadDebug().unlockAll,

  setUnlockAll: (value) => {
    saveDebug({ unlockAll: value })
    set({ unlockAll: value })
  },

  toggleUnlockAll: () => {
    get().setUnlockAll(!get().unlockAll)
  },
}))
