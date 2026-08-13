import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useQuizStore } from '@/store/quizStore'
import CamTile from '@/components/ui/CamTile'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function ObsView() {
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
    connect(room.id).catch((err) => setError(errorMessage(err, 'Verbindung zum Raum fehlgeschlagen.')))
    return () => disconnect()
  }, [room, connect, disconnect])

  if (error) return <PagePlaceholder title="Fehler" note={error} />
  if (room === undefined) return <LoadingScreen />
  if (room === null) return <PagePlaceholder title="Raum nicht gefunden" note={`Kein Raum mit Code „${roomCode}“.`} />

  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen w-full flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 px-1">
        <span className="font-display font-800 text-lg tracking-tight">
          <span className="text-poke-yellow-400">Musik</span>
          <span className="text-poke-red-500">Quiz</span>
        </span>
        <span className="text-white/40 text-sm">— {room.name}</span>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex items-center">
          <ActiveClipPlayer />
        </div>

        <div className="w-72 flex flex-col gap-3 shrink-0 overflow-y-auto">
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
    </div>
  )
}
