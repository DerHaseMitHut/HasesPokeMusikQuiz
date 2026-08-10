import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import LoadingScreen from './LoadingScreen'

export default function RequireHost({ children }: { children: React.ReactNode }) {
  const { ready, isHost } = useAuthStore()

  if (!ready) return <LoadingScreen />
  if (!isHost) return <Navigate to="/host/login" replace />

  return <>{children}</>
}
