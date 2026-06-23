import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { CoursePage } from './pages/CoursePage'
import { LessonPage } from './pages/LessonPage'
import { useAuthStore } from './stores/authStore'
import { FEATURES } from './lib/features'
import './App.css'

function AppRoutes() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    if (FEATURES.firebase) {
      return init()
    }
    init()
  }, [init])

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/courses/:slug" element={<CoursePage />} />
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
