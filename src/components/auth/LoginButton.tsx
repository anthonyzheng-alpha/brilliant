import { useAuthStore } from '../../stores/authStore'
import { isFirebaseConfigured } from '../../lib/firebase'
import './Auth.css'

export function LoginButton() {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signInWithGoogle)

  if (!isFirebaseConfigured() || user) return null

  return (
    <button
      type="button"
      className="btn btn--ghost btn--sm"
      onClick={() => signIn()}
      disabled={loading}
    >
      Sign in with Google
    </button>
  )
}
