import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/authStore'
import { useQuizStore } from '@/store/quizStore'
import { updatePlayerVdoUrl } from '@/features/players/players'
import CamTile from '@/components/ui/CamTile'
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
  const vdoUrlInputRef = useRef<HTMLInputElement>(null)
  const [savingVdoUrl, setSavingVdoUrl] = useState(false)

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

  async function handleSaveVdoUrl(event: FormEvent) {
    event.preventDefault()
    if (!myPlayer) return
    setSavingVdoUrl(true)
    setError(null)
    try {
      await updatePlayerVdoUrl(myPlayer.id, vdoUrlInputRef.current?.value.trim() ?? '')
    } catch (err) {
      setError(errorMessage(err, 'Kamera-Link konnte nicht gespeichert werden.'))
    } finally {
      setSavingVdoUrl(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-lg mx-auto flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-700">{room.name}</h1>
        <p className="text-white/50 text-sm mt-1">
          Angemeldet als <span className="text-poke-yellow-400 font-700">{myPlayer.display_name}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <CamTile vdoUrl={room.vdo_url} label="Gastgeber" />
        <CamTile vdoUrl={myPlayer.vdo_url} label={myPlayer.display_name} score={myPlayer.score} />
      </div>

      <form onSubmit={handleSaveVdoUrl} className="flex gap-2">
        <input
          ref={vdoUrlInputRef}
          key={myPlayer.vdo_url}
          defaultValue={myPlayer.vdo_url ?? ''}
          placeholder="Dein VDO.Ninja-Link"
          className="flex-1 rounded-xl bg-stage-800 border border-stage-600 px-4 py-2 text-sm outline-none focus:border-poke-yellow-400"
        />
        <button
          type="submit"
          disabled={savingVdoUrl}
          className="rounded-xl bg-stage-700 hover:bg-stage-600 disabled:opacity-50 px-4 py-2 text-sm transition-colors shrink-0"
        >
          {savingVdoUrl ? '…' : 'Speichern'}
        </button>
      </form>

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
