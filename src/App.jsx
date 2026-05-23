import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from './store/useAuthStore'
import { BottomNav } from './components/Navigation/BottomNav'
import { NotificationToast } from './components/Notifications/NotificationToast'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MapPage from './pages/MapPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import ClanPage from './pages/ClanPage'
import NotificationsPage from './pages/NotificationsPage'

function AuthGuard({ children }) {
  const isAuthenticated = useAuthStore((s) => !!s.user)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-bg-base overflow-hidden">
      <main className="flex-1 overflow-hidden relative">{children}</main>
      <BottomNav />
      <NotificationToast />
    </div>
  )
}

// Supabase session tekshirilib bo'lguncha loading ko'rsatish
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        className="w-10 h-10 border-2 border-neon-purple/30 border-t-neon-purple rounded-full"
      />
      <p className="text-text-muted text-sm">Yuklanmoqda...</p>
    </div>
  )
}

export default function App() {
  const { initialize, isLoading, user } = useAuthStore()

  // Bir marta — mavjud Supabase sessionni tekshirish
  useEffect(() => {
    initialize()
  }, [])

  if (isLoading) return <LoadingScreen />

  const isAuthenticated = !!user

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/map" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/map" replace /> : <RegisterPage />}
      />

      {/* Protected */}
      <Route
        path="/map"
        element={
          <AuthGuard>
            <AppLayout><MapPage /></AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <AuthGuard>
            <AppLayout><LeaderboardPage /></AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <AuthGuard>
            <AppLayout><ProfilePage /></AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/clan"
        element={
          <AuthGuard>
            <AppLayout><ClanPage /></AppLayout>
          </AuthGuard>
        }
      />
      <Route
        path="/notifications"
        element={
          <AuthGuard>
            <AppLayout><NotificationsPage /></AppLayout>
          </AuthGuard>
        }
      />

      <Route path="*" element={<Navigate to={isAuthenticated ? '/map' : '/login'} replace />} />
    </Routes>
  )
}
