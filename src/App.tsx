import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './routes/LandingPage'
import HostLoginPage from './routes/HostLoginPage'
import HostRoomListPage from './routes/HostRoomListPage'
import HostRoomSetupPage from './routes/HostRoomSetupPage'
import HostLivePage from './routes/HostLivePage'
import ObsView from './routes/ObsView'
import CandidateJoinPage from './routes/CandidateJoinPage'
import CandidatePlayPage from './routes/CandidatePlayPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host/login" element={<HostLoginPage />} />
        <Route path="/host" element={<HostRoomListPage />} />
        <Route path="/host/:roomCode/setup" element={<HostRoomSetupPage />} />
        <Route path="/host/:roomCode/live" element={<HostLivePage />} />
        <Route path="/obs/:roomCode" element={<ObsView />} />
        <Route path="/join" element={<CandidateJoinPage />} />
        <Route path="/play/:roomCode" element={<CandidatePlayPage />} />
      </Routes>
    </BrowserRouter>
  )
}
