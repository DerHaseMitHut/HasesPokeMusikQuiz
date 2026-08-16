import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { getRoomByCode, type Room } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { useQuizStore } from '@/store/quizStore'
import CamTile from '@/components/ui/CamTile'
import PokeballWatermark from '@/components/ui/PokeballWatermark'
import StaffLines from '@/components/ui/StaffLines'
import ActiveClipPlayer from '@/features/playback/ActiveClipPlayer'
import LoadingScreen from '@/components/ui/LoadingScreen'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function ObsView() {
  const { roomCode } = useParams<{ roomCode: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
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
  if (token !== room.obs_token) {
    return <PagePlaceholder title="Kein Zugriff" note="Ungültiger oder fehlender Zugangs-Token. Den vollständigen OBS-Link aus dem Raum-Setup verwenden." />
  }

  const sorted = [...players].sort((a, b) => b.score - a.score)

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden p-3 gap-2">
      <PokeballWatermark />
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-display font-800 text-base tracking-tight">
          <span className="text-poke-yellow-400">Musik</span>
          <span className="text-poke-red-500">Quiz</span>
        </span>
        <span className="text-white/30 text-sm">{room.name}</span>
      </div>

      <div className="relative isolate shrink-0">
        <StaffLines />
        <div
          className="grid gap-2 sm:gap-3 justify-center"
          style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${roomLayout.camSize}px, ${roomLayout.camSize}px))` }}
        >
          <CamTile vdoUrl={room.vdo_url} label="Gastgeber" isHost />
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

      <div className="flex-1 min-h-0 flex items-stretch justify-center">
        <ActiveClipPlayer heightVh={roomLayout.videoMaxHeight} />
      </div>
    </div>
  )
}
