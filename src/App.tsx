import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { CoursePage } from './pages/CoursePage'
import { LessonPage } from './pages/LessonPage'
import { ReviewPage } from './pages/ReviewPage'
import { useAuthStore } from './stores/authStore'
import { FEATURES } from './lib/features'
import './App.css'

function AppRoutes() {
  const init = useAuthStore((s) => s.init)
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()
  const baselineSet = useRef(false)
  const prevUid = useRef<string | null>(null)

  useEffect(() => {
    if (FEATURES.firebase) {
      return init()
    }
    init()
  }, [init])

  useEffect(() => {
    if (loading) return
    const curr = user?.uid ?? null
    if (!baselineSet.current) {
      baselineSet.current = true
      prevUid.current = curr
      return
    }
    if (prevUid.current !== curr) {
      prevUid.current = curr
      navigate('/')
    }
  }, [user, loading, navigate])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses/:slug" element={<CoursePage />} />
      <Route path="/courses/:slug/review" element={<ReviewPage />} />
      <Route path="/courses/:slug/lessons/:lessonId" element={<LessonPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
