import { create } from 'zustand'
import {
  browserPopupRedirectResolver,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { clearAllLocalData } from '../lib/storage'
import { syncOnLogin } from '../lib/syncProgress'
import { useProgressStore } from './progressStore'
import { useGamificationStore } from './gamificationStore'
import { useStruggleStore } from './struggleStore'

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

    void getRedirectResult(auth).catch((e) => {
      console.error('Google redirect sign-in failed', e)
    })

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await syncOnLogin(user.uid)
          useProgressStore.getState().hydrate()
          useGamificationStore.getState().hydrate()
          useStruggleStore.getState().hydrate()
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
      await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver)
    } catch (e) {
      const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : ''
      const userCancelled =
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'

      const tryRedirect =
        !userCancelled &&
        (code === 'auth/popup-blocked' ||
          code === 'auth/internal-error' ||
          code === 'auth/operation-not-allowed' ||
          code === 'auth/unauthorized-domain')

      if (tryRedirect) {
        await signInWithRedirect(auth, googleProvider)
        return
      }

      if (userCancelled) return

      console.error('Google sign-in failed', e)
      const message =
        e && typeof e === 'object' && 'message' in e
          ? String(e.message)
          : 'Sign-in failed. Run `npm run deploy:auth` to enable Google sign-in in Firebase.'
      alert(message)
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    const auth = getFirebaseAuth()
    if (!auth) return
    await firebaseSignOut(auth)
    clearAllLocalData()
    useProgressStore.getState().hydrate()
    useGamificationStore.getState().hydrate()
    useStruggleStore.getState().hydrate()
    set({ user: null })
  },
}))
