import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import LoadingScreen from '@/components/ui/LoadingScreen'
import RequireHost from '@/features/auth/RequireHost'
import LandingPage from './routes/LandingPage'
import HostLoginPage from './routes/HostLoginPage'
import HostRoomListPage from './routes/HostRoomListPage'
import HostRoomSetupPage from './routes/HostRoomSetupPage'
import HostLivePage from './routes/HostLivePage'
import ObsView from './routes/ObsView'
import CandidateJoinPage from './routes/CandidateJoinPage'
import CandidatePlayPage from './routes/CandidatePlayPage'

export default function App() {
  const { ready, error, init } = useAuthStore()

  useEffect(() => {
    init()
  }, [init])

  if (!ready) return <LoadingScreen />
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-poke-red-400">{error}</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host/login" element={<HostLoginPage />} />
        <Route
          path="/host"
          element={
            <RequireHost>
              <HostRoomListPage />
            </RequireHost>
          }
        />
        <Route
          path="/host/:roomCode/setup"
          element={
            <RequireHost>
              <HostRoomSetupPage />
            </RequireHost>
          }
        />
        <Route
          path="/host/:roomCode/live"
          element={
            <RequireHost>
              <HostLivePage />
            </RequireHost>
          }
        />
        <Route
          path="/obs/:roomCode"
          element={
            <RequireHost>
              <ObsView />
            </RequireHost>
          }
        />
        <Route path="/join" element={<CandidateJoinPage />} />
        <Route path="/play/:roomCode" element={<CandidatePlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}
