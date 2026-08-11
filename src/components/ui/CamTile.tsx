import { VideoTrack, type TrackReference } from '@livekit/components-react'

export default function CamTile({
  trackRef,
  label,
  score,
  highlighted,
}: {
  trackRef: TrackReference
  label: string
  score?: number
  highlighted?: boolean
}) {
  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden bg-stage-900 border transition-colors ${
        highlighted ? 'border-poke-yellow-400 shadow-[var(--shadow-glow-yellow)]' : 'border-stage-600'
      }`}
    >
      <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-2 py-1 bg-black/60">
        <span className="truncate text-sm font-700">{label}</span>
        {score !== undefined && <span className="text-sm font-display font-700 text-poke-yellow-400 shrink-0">{score}</span>}
      </div>
    </div>
  )
}
