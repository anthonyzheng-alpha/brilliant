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
    >
      <button
        type="button"
        className="app-header__dropdown-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
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
