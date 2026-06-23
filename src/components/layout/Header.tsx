import { Link } from 'react-router-dom'
import { StreakBadge } from '../gamification/StreakBadge'
import { LoginButton } from '../auth/LoginButton'
import { UserMenu } from '../auth/UserMenu'
import { FEATURES } from '../../lib/features'
import './Header.css'

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__logo">
        Algebra
      </Link>
      <nav className="app-header__nav">
        <Link to="/">Home</Link>
        <Link to="/courses/solving-equations">Courses</Link>
      </nav>
      <div className="app-header__actions">
        {FEATURES.gamification && <StreakBadge />}
        {FEATURES.firebase && <AuthSlot />}
      </div>
    </header>
  )
}

function AuthSlot() {
  return (
    <>
      <LoginButton />
      <UserMenu />
    </>
  )
}
