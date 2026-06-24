import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StreakBadge } from '../gamification/StreakBadge'
import { LoginButton } from '../auth/LoginButton'
import { UserMenu } from '../auth/UserMenu'
import { FEATURES } from '../../lib/features'
import { courses } from '../../content'
import './Header.css'

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__logo">
        Algebra
      </Link>
      <nav className="app-header__nav">
        <Link to="/">Home</Link>
        <CoursesDropdown />
      </nav>
      <div className="app-header__actions">
        {FEATURES.gamification && <StreakBadge />}
        {FEATURES.firebase && <AuthSlot />}
      </div>
    </header>
  )
}

function CoursesDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | null>(null)

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = () => {
    clearCloseTimer()
    setOpen(true)
  }

  // Small delay so moving the cursor across the gap into the menu doesn't close it.
  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => clearCloseTimer, [])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div
      className={`app-header__dropdown${open ? ' app-header__dropdown--open' : ''}`}
      ref={ref}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        className="app-header__dropdown-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onFocus={openMenu}
      >
        Courses
        <span className="app-header__dropdown-caret" aria-hidden="true">
          ▾
        </span>
      </button>
      <div className="app-header__dropdown-menu" role="menu">
        {courses.map((course) => (
          <Link
            key={course.id}
            to={`/courses/${course.slug}`}
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {course.title}
          </Link>
        ))}
      </div>
    </div>
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
