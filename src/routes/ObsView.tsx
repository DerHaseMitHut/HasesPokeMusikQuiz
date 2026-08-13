import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useQuizStore } from '@/store/quizStore'
import CamTile from '@/components/ui/CamTile'
import MusicStaff from '@/components/ui/MusicStaff'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function ObsView() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const { players, buzzerState, roomLayout, connect, disconnect } = useQuizStore()

  useEffect(() => {
    if (!roomCode) return
    getRoomByCode(roomCode)
      .then(setRoom)
      .catch((err) => setError(errorMessage(err, 'Raum konnte nicht geladen werden.')))
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    connect(room.id).catch((err) => setError(errorMessage(err, 'Verbindung zum Raum fehlgeschlagen.')))
    return () => disconnect()
  }, [room, connect, disconnect])

  if (error) return <PagePlaceholder title="Fehler" note={error} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />

  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden gap-2 p-3">
      <div className="flex items-center gap-2 px-1 shrink-0">
        <span className="font-display font-800 text-lg tracking-tight">
          <span className="text-poke-yellow-400">Musik</span>
          <span className="text-poke-red-500">Quiz</span>
        </span>
        <span className="text-white/40 text-sm">— {room.name}</span>
      </div>

      <div className="shrink-0 relative">
        <MusicStaff className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-12 w-full pointer-events-none" />
        <div
          className="relative grid gap-2 justify-center"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}
        >
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber" />
          {sorted.map((player) => (
            <CamTile
              key={player.id}
              vdoUrl={player.vdo_url}
              label={player.display_name}
              score={player.score}
              highlighted={player.id === buzzerState?.winner_player_id}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0">
        <ActiveClipPlayer />
      </div>
    </div>
  )
}
