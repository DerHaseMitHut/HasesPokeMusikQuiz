import { normalizeVdoUrl } from '@/lib/vdoNinja'

export default function CamTile({
  vdoUrl,
  label,
  score,
  highlighted,
}: {
  vdoUrl: string | null | undefined
  label: string
  score?: number
  highlighted?: boolean
}) {
  const url = normalizeVdoUrl(vdoUrl)

  return (
    <div
      className={`relative aspect-video rounded-xl overflow-hidden bg-stage-900 border transition-colors ${
        highlighted ? 'border-poke-yellow-400 shadow-[var(--shadow-glow-yellow)]' : 'border-stage-600'
      }`}
    >
      {url ? (
        <iframe
          src={url}
          className="w-full h-full"
          allow="camera;microphone;autoplay;fullscreen;display-capture"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">Keine Kamera</div>
      )}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-2 py-1 bg-black/60">
        <span className="truncate text-sm font-700">{label}</span>
        {score !== undefined && <span className="text-sm font-display font-700 text-poke-yellow-400 shrink-0">{score}</span>}
      </div>
    </div>
  )
}
