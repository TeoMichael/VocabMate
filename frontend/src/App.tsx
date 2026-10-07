import { useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth'
import Layout from './components/Layout'
import { Loading } from './components/ui'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import VocabularyPage from './pages/VocabularyPage'
import VocabularyFormPage from './pages/VocabularyFormPage'
import PracticePage, { PracticeSessionPage } from './pages/PracticePage'
import WeakWordsPage from './pages/WeakWordsPage'
import WeeklyReviewPage from './pages/WeeklyReviewPage'
import StatisticsPage from './pages/StatisticsPage'
import { returnPath } from './lib/navigation'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Opening your learning space…" />
  return user ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  )
}

function PublicRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  return user ? <Navigate to={returnPath(location.state)} replace /> : <Outlet />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<AuthPage key="login" />} />
            <Route path="/register" element={<AuthPage key="register" register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="vocabulary" element={<VocabularyPage />} />
              <Route path="vocabulary/new" element={<VocabularyFormPage />} />
              <Route path="vocabulary/:id/edit" element={<VocabularyFormPage />} />
              <Route path="practice" element={<PracticePage />} />
              <Route path="practice/:id" element={<PracticeSessionPage />} />
              <Route path="weak-words" element={<WeakWordsPage />} />
              <Route path="weekly-review" element={<WeeklyReviewPage />} />
              <Route path="statistics" element={<StatisticsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
