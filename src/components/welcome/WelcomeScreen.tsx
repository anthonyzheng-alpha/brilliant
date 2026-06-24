import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { courses } from '../../content'
import { useAuthStore } from '../../stores/authStore'
import { isFirebaseConfigured } from '../../lib/firebase'
import { FEATURES } from '../../lib/features'
import './WelcomeScreen.css'

type WelcomeScreenProps = {
  onDismiss: () => void
}

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.35 },
}

const panelMotion = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  const firebaseReady = isFirebaseConfigured()
  const animate = FEATURES.animations

  // Dismiss only once authentication actually succeeds; cancelling the popup
  // leaves the user null so the welcome screen stays put.
  useEffect(() => {
    if (user) onDismiss()
  }, [user, onDismiss])

  const handleSignIn = () => {
    void signInWithGoogle()
  }

  const Overlay = animate ? motion.div : 'div'
  const Panel = animate ? motion.div : 'div'
  const overlayProps = animate ? overlayMotion : {}
  const panelProps = animate ? panelMotion : {}

  return (
    <Overlay className="welcome" role="dialog" aria-modal="true" aria-label="Welcome" {...overlayProps}>
      <Panel className="welcome__panel" {...panelProps}>
        <p className="welcome__eyebrow">Welcome to Algebra</p>
        <h1 className="welcome__title">Learn algebra by doing</h1>
        <p className="welcome__sub">
          Interactive puzzles that build intuition before notation. Sign in to save
          your progress across devices, or jump straight in.
        </p>

        <ul className="welcome__chips" aria-label="Courses">
          {courses.map((course, index) => {
            const Chip = animate ? motion.li : 'li'
            const chipProps = animate
              ? {
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: 0.15 + index * 0.08, duration: 0.3 },
                }
              : {}
            return (
              <Chip key={course.id} className="welcome__chip" {...chipProps}>
                {course.title}
              </Chip>
            )
          })}
        </ul>

        <div className="welcome__actions">
          {firebaseReady && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSignIn}
              disabled={loading}
            >
              Sign in with Google
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={onDismiss}>
            Continue as guest
          </button>
        </div>
      </Panel>
    </Overlay>
  )
}
