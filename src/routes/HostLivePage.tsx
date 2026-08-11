import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '../lib/rooms'
import { errorMessage } from '../lib/errors'
import { useQuizStore } from '../store/quizStore'
import Scoreboard from '../components/Scoreboard'
import LoadingScreen from '../components/LoadingScreen'
import PagePlaceholder from '../components/PagePlaceholder'

export default function HostLivePage() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { players, buzzerState, connect, disconnect } = useQuizStore()

  useEffect(() => {
    if (!roomCode) return
    getRoomByCode(roomCode)
      .then(setRoom)
      .catch((err) => setError(errorMessage(err, 'Raum konnte nicht geladen werden.')))
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    let cancelled = false
    connect(room.id).catch((err) => {
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

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-700">{room.name}</h1>
        <p className="text-white/50 text-sm mt-1">
          Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
        </p>
      </div>

      <div className="rounded-2xl bg-stage-800 border border-stage-600 p-6 text-center text-white/50">
        Video-/Buzzer-Steuerung folgt in Kürze.
      </div>

      <div>
        <h2 className="font-display text-lg font-700 mb-3">Kandidaten ({players.length})</h2>
        <Scoreboard players={players} winnerPlayerId={buzzerState?.winner_player_id} />
      </div>
    </div>
  )
}
