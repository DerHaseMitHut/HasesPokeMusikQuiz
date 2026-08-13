import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/authStore'
import { useQuizStore } from '@/store/quizStore'
import { updatePlayerVdoUrl } from '@/features/players/players'
import CamTile from '@/components/ui/CamTile'
import MusicStaff from '@/components/ui/MusicStaff'
import Button from '@/components/ui/Button'
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

  const { players, roomLayout, connect, disconnect } = useQuizStore()
  const [playersLoaded, setPlayersLoaded] = useState(false)
  const vdoUrlInputRef = useRef<HTMLInputElement>(null)
  const [editingVdoUrl, setEditingVdoUrl] = useState(false)
  const [savingVdoUrl, setSavingVdoUrl] = useState(false)
  const [vdoUrlError, setVdoUrlError] = useState<string | null>(null)

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
    setVdoUrlError(null)
    try {
      await updatePlayerVdoUrl(myPlayer.id, vdoUrlInputRef.current?.value.trim() ?? '')
      setEditingVdoUrl(false)
    } catch (err) {
      setVdoUrlError(errorMessage(err, 'Kamera-Link konnte nicht gespeichert werden.'))
    } finally {
      setSavingVdoUrl(false)
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden p-3 sm:p-4 gap-2 sm:gap-3">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-800 leading-tight">{room.name}</h1>
          <p className="text-white/50 text-xs">
            Angemeldet als <span className="text-poke-yellow-400 font-700">{myPlayer.display_name}</span>
            {' · '}
            <button type="button" onClick={() => setEditingVdoUrl((v) => !v)} className="underline hover:text-white/80">
              Kamera-Link
            </button>
          </p>
        </div>
        <p className="text-white/40 text-xs shrink-0">
          Raumcode: <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
        </p>
      </div>

      {editingVdoUrl && (
        <form onSubmit={handleSaveVdoUrl} className="shrink-0 flex gap-2 items-start">
          <div className="flex-1 flex flex-col gap-1">
            <input
              ref={vdoUrlInputRef}
              autoFocus
              defaultValue={myPlayer.vdo_url ?? ''}
              placeholder="Dein Kamera-Link"
              className="w-full rounded-lg bg-stage-900/80 border border-stage-600 px-3 py-1.5 text-sm outline-none focus:border-poke-yellow-400 focus:shadow-[0_0_0_3px_rgba(255,203,5,0.15)] transition-shadow"
            />
            {vdoUrlError && <p className="text-poke-red-400 text-xs">{vdoUrlError}</p>}
          </div>
          <Button type="submit" variant="ghost" size="sm" disabled={savingVdoUrl} className="shrink-0">
            {savingVdoUrl ? '…' : 'Speichern'}
          </Button>
        </form>
      )}

      <div className="shrink-0 relative">
        <MusicStaff className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 w-full pointer-events-none" />
        <div
          className="relative grid gap-3 sm:gap-4 justify-center"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}
        >
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber" />
          {players.map((player) => (
            <CamTile
              key={player.id}
              vdoUrl={player.vdo_url}
              label={player.id === myPlayer.id ? `${player.display_name} (Du)` : player.display_name}
              score={player.score}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-2 sm:gap-3 min-h-0">
        <div className="flex-[2] min-w-0 flex flex-col gap-2 sm:gap-3 min-h-0">
          <div className="flex-1 min-h-0 min-w-0" style={{ maxHeight: `${roomLayout.videoMaxHeight}vh` }}>
            <ActiveClipPlayer />
          </div>
          <div className="shrink-0 flex justify-center">
            <BuzzerButton roomId={room.id} playerId={myPlayer.id} />
          </div>
        </div>

        <div className="shrink-0 min-h-0 flex flex-col gap-2 overflow-y-auto" style={{ width: roomLayout.scoreboardWidth }}>
          <h2 className="font-display text-base font-700 text-white/70 shrink-0">Punktestand</h2>
          <Scoreboard players={players} highlightPlayerId={myPlayer.id} />
        </div>
      </div>
    </div>
  )
}
