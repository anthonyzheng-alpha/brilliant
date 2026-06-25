import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { StreakBadge } from '../gamification/StreakBadge'
import { LoginButton } from '../auth/LoginButton'
import { UserMenu } from '../auth/UserMenu'
import { FEATURES } from '../../lib/features'
import { courses } from '../../content'
import { useProgressStore } from '../../stores/progressStore'
import { useDebugStore } from '../../stores/debugStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { isCourseUnlocked } from '../../lib/courseUnlock'
import { THEMES } from '../../lib/theme'
import './Header.css'

export function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__logo">
        Algebra Wizard
      </Link>
      <nav className="app-header__nav">
        <Link to="/">Home</Link>
        <CoursesDropdown />
      </nav>
      <div className="app-header__actions">
        {import.meta.env.DEV && <DebugUnlockToggle />}
        <SettingsMenu />
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
  const isCourseComplete = useProgressStore((s) => s.isCourseComplete)
  const unlockAll = useDebugStore((s) => s.unlockAll)

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
        {courses.map((course) => {
          const locked =
            FEATURES.sequentialUnlock &&
            !unlockAll &&
            !isCourseUnlocked(course.id, isCourseComplete)
          if (locked) {
            return (
              <span
                key={course.id}
                className="app-header__dropdown-item--locked"
                role="menuitem"
                aria-disabled="true"
              >
                {course.title} 🔒
              </span>
            )
          }
          return (
            <Link
              key={course.id}
              to={`/courses/${course.slug}`}
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {course.title}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const toggleAiEnabled = useSettingsStore((s) => s.toggleAiEnabled)
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)

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
      className={`app-header__settings${open ? ' app-header__settings--open' : ''}`}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        className="app-header__settings-trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">⚙</span>
      </button>
      <div className="app-header__settings-panel" role="menu">
        <p className="app-header__settings-title">Settings</p>
        <div className="app-header__settings-group">
          <span className="app-header__settings-label">Theme</span>
          <div
            className="app-header__theme-picker"
            role="radiogroup"
            aria-label="Theme"
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={theme === t.id}
                aria-label={t.label}
                title={t.label}
                className={`app-header__theme-swatch${theme === t.id ? ' is-active' : ''}`}
                style={{ background: t.swatch }}
                onClick={() => setTheme(t.id)}
              />
            ))}
          </div>
        </div>
        <label className="app-header__settings-toggle">
          <input type="checkbox" checked={aiEnabled} onChange={toggleAiEnabled} />
          AI-powered practice
        </label>
        {!aiEnabled && (
          <p className="app-header__settings-warning" role="alert">
            AI is off. The diversity of problems presented by the overall review will decrease.
          </p>
        )}
      </div>
    </div>
  )
}

function DebugUnlockToggle() {
  const unlockAll = useDebugStore((s) => s.unlockAll)
  const toggleUnlockAll = useDebugStore((s) => s.toggleUnlockAll)

  return (
    <label className="app-header__debug-toggle" title="Dev only: unlock all courses and lessons">
      <input
        type="checkbox"
        checked={unlockAll}
        onChange={toggleUnlockAll}
      />
      Unlock all
    </label>
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
