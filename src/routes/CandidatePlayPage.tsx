import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useAuthStore } from '@/features/auth/authStore'
import { useQuizStore } from '@/store/quizStore'
import { updatePlayerVdoUrl, getPlayerAvatarUrl } from '@/features/players/players'
import CamTile from '@/components/ui/CamTile'
import PokeballWatermark from '@/components/ui/PokeballWatermark'
import StaffLines from '@/components/ui/StaffLines'
import Button from '@/components/ui/Button'
import BuzzerButton from '@/features/buzzer/BuzzerButton'
import { useBuzzerHotkey, formatKeyCode } from '@/features/buzzer/useBuzzerHotkey'
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
  const { hotkey, recording, startRecording, clearHotkey } = useBuzzerHotkey()

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
      <PokeballWatermark />
      <div className="flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-800 text-sm tracking-tight shrink-0">
            <span className="text-poke-yellow-400">Musik</span>
            <span className="text-poke-red-500">Quiz</span>
          </span>
          <span className="text-white/30 text-xs truncate">{room.name}</span>
        </div>
        <p className="text-white/40 text-xs shrink-0">
          <button type="button" onClick={() => setEditingVdoUrl((v) => !v)} className="underline hover:text-white/80 mr-3">
            Kamera-Link
          </button>
          <button type="button" onClick={startRecording} className="underline hover:text-white/80 mr-3">
            {recording ? 'Taste drücken… (Esc)' : hotkey ? `Hotkey: ${formatKeyCode(hotkey)} (ändern)` : 'Hotkey festlegen'}
          </button>
          {hotkey && !recording && (
            <button type="button" onClick={clearHotkey} className="underline hover:text-white/80 mr-3">
              entfernen
            </button>
          )}
          Raumcode <span className="font-mono tracking-widest text-poke-yellow-400">{room.code}</span>
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

      <div className="relative isolate shrink-0">
        <StaffLines />
        <div
          className="grid gap-2 sm:gap-3 justify-center"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}
        >
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber" isHost />
          {players.map((player) => (
            <CamTile
              key={player.id}
              vdoUrl={player.vdo_url}
              label={player.id === myPlayer.id ? `${player.display_name} (Du)` : player.display_name}
              score={player.score}
              avatarUrl={getPlayerAvatarUrl(player.avatar_storage_path)}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-stretch justify-center gap-4 sm:gap-8">
        {/* Spacer in Buzzer-Breite (h-36 Knopf + Padding-Ringe = 11.75rem). Der Pokeball-Backdrop
            im Buzzer ist absolut positioniert und zählt nicht zur Flex-Breite -- nur der Knopf
            selbst tut das --, daher bleibt dieser Wert unabhängig von der Pokeball-Größe. */}
        <div className="w-[11.75rem] shrink-0" aria-hidden="true" />
        <ActiveClipPlayer heightVh={roomLayout.videoMaxHeight} />
        <BuzzerButton roomId={room.id} playerId={myPlayer.id} hotkey={hotkey} hotkeyRecording={recording} />
      </div>
    </div>
  )
}
