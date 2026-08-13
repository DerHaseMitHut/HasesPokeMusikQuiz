import { normalizeVdoUrl } from '@/lib/vdoNinja'

export default function CamTile({
  vdoUrl,
  label,
  score,
  highlighted,
  onKick,
}: {
  vdoUrl: string | null | undefined
  label: string
  score?: number
  highlighted?: boolean
  onKick?: () => void
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
      {onKick && (
        <button
          type="button"
          onClick={onKick}
          title="Kandidat entfernen"
          className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 hover:bg-poke-red-500 text-white/70 hover:text-white text-sm leading-none transition-colors"
        >
          ×
        </button>
      )}
      <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-2 px-2 py-1 bg-black/60">
        <span className="truncate text-sm font-700">{label}</span>
        {score !== undefined && <span className="text-sm font-display font-700 text-poke-yellow-400 shrink-0">{score}</span>}
      </div>
    </div>
  )
}
