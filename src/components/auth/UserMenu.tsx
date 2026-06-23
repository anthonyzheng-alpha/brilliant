import { useAuthStore } from '../../stores/authStore'
import './Auth.css'

export function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  if (!user) return null

  return (
    <div className="user-menu">
      {user.photoURL && (
        <img src={user.photoURL} alt="" className="user-menu__avatar" width={32} height={32} />
      )}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  )
}
