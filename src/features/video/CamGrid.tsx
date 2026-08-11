import { useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import CamTile from '@/components/ui/CamTile'
import type { PlayerRow } from '@/store/quizStore'

const HOST_IDENTITY = 'host'

export default function CamGrid({
  players,
  includeHost = true,
  onlyIdentities,
  winnerPlayerId,
}: {
  players: PlayerRow[]
  includeHost?: boolean
  /** Wenn gesetzt, werden nur Teilnehmer-Kacheln mit diesen player-IDs gezeigt (Host bleibt davon unberührt). */
  onlyIdentities?: string[]
  winnerPlayerId?: string | null
}) {
  const tracks = useTracks([Track.Source.Camera])

  const visible = tracks.filter((trackRef) => {
    if (trackRef.participant.identity === HOST_IDENTITY) return includeHost
    return onlyIdentities ? onlyIdentities.includes(trackRef.participant.identity) : true
  })

  if (visible.length === 0) return null

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {visible.map((trackRef) => {
        const isHost = trackRef.participant.identity === HOST_IDENTITY
        const player = isHost ? null : players.find((p) => p.id === trackRef.participant.identity)
        return (
          <CamTile
            key={trackRef.participant.identity}
            trackRef={trackRef}
            label={isHost ? 'Gastgeber' : (player?.display_name ?? trackRef.participant.name ?? '???')}
            score={player?.score}
            highlighted={!isHost && player?.id === winnerPlayerId}
          />
        )
      })}
    </div>
  )
}
