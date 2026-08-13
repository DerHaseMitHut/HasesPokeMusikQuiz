import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { LiveKitRoom } from '@livekit/components-react'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/authStore'
import { useQuizStore } from '@/store/quizStore'
import { useLiveKitToken } from '@/features/video/useLiveKitToken'
import CamGrid from '@/features/video/CamGrid'
import Scoreboard from '@/components/ui/Scoreboard'
import BuzzerButton from '@/features/buzzer/BuzzerButton'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function CandidatePlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const userId = useAuthStore((s) => s.userId)
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { players, connect, disconnect } = useQuizStore()
  const [playersLoaded, setPlayersLoaded] = useState(false)
  const { token: videoToken, url: videoUrl, error: tokenError } = useLiveKitToken(room?.code, 'player')
  const [videoError, setVideoError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) return
    getRoomByCode(roomCode)
      .then(setRoom)
      .catch((err) => setError(errorMessage(err, 'Raum konnte nicht geladen werden.')))
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    let cancelled = false
    connect(room.id)
      .then(() => {
        if (!cancelled) setPlayersLoaded(true)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Verbindung zum Raum fehlgeschlagen.'))
      })
    return () => {
      cancelled = true
      disconnect()
    }
  }, [room, connect, disconnect])

  if (error) return <PagePlaceholder title="Fehler" note={error} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />
  if (!playersLoaded) return <LoadingScreen />

  const myPlayer = players.find((p) => p.user_id === userId)
  if (!myPlayer) return <Navigate to={`/join?code=${room.code}`} replace />

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-700">{room.name}</h1>
        <p className="text-white/50 text-sm mt-1">
          Angemeldet als <span className="text-poke-yellow-400 font-700">{myPlayer.display_name}</span>
        </p>
      </div>

      {(tokenError || videoError) && <p className="text-poke-red-400 text-sm text-center">{tokenError ?? videoError}</p>}

      {videoToken && videoUrl && (
        <LiveKitRoom
          serverUrl={videoUrl}
          token={videoToken}
          video
          audio={false}
          connect
          onError={(err) => setVideoError(errorMessage(err, 'Kamera-Verbindung fehlgeschlagen.'))}
        >
          <CamGrid players={players} includeHost onlyIdentities={[myPlayer.id]} />
        </LiveKitRoom>
      )}

      <ActiveClipPlayer />

      <div className="flex justify-center">
        <BuzzerButton roomId={room.id} playerId={myPlayer.id} />
      </div>

      <div>
        <h2 className="font-display text-lg font-700 mb-3">Punktestand</h2>
        <Scoreboard players={players} highlightPlayerId={myPlayer.id} />
      </div>
    </div>
  )
}
