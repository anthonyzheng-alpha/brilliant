import { create } from 'zustand'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { syncOnLogin } from '../lib/syncProgress'
import { useProgressStore } from './progressStore'
import { useGamificationStore } from './gamificationStore'

type AuthStore = {
  user: User | null
  loading: boolean
  initialized: boolean
  init: () => () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  init: () => {
    const auth = getFirebaseAuth()
    if (!auth || !isFirebaseConfigured()) {
      set({ loading: false, initialized: true })
      return () => {}
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await syncOnLogin(user.uid)
          useProgressStore.getState().hydrate()
          useGamificationStore.getState().hydrate()
        } catch (e) {
          console.error('Sync on login failed', e)
        }
      }
      set({ user, loading: false, initialized: true })
    })

    set({ initialized: true })
    return unsub
  },

  signInWithGoogle: async () => {
    const auth = getFirebaseAuth()
    if (!auth) {
      alert('Firebase is not configured. Add VITE_FIREBASE_* env variables.')
      return
    }
    set({ loading: true })
    try {
      await signInWithPopup(auth, googleProvider)
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    await firebaseSignOut(auth)
    set({ user: null })
  },
}))
