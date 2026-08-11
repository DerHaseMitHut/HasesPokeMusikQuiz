import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '../lib/rooms'
import { errorMessage } from '../lib/errors'
import { useAuthStore } from '../store/authStore'
import { useQuizStore } from '../store/quizStore'
import Scoreboard from '../components/Scoreboard'
import BuzzerButton from '../components/BuzzerButton'
import LoadingScreen from '../components/LoadingScreen'
import PagePlaceholder from '../components/PagePlaceholder'

export default function CandidatePlayPage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const userId = useAuthStore((s) => s.userId)
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { players, connect, disconnect } = useQuizStore()
  const [playersLoaded, setPlayersLoaded] = useState(false)

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

      <div className="rounded-2xl bg-stage-800 border border-stage-600 p-6 text-center text-white/50">
        Video folgt in Kürze.
      </div>

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
