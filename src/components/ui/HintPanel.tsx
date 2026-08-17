// Sitzt links neben dem Videofenster (Host/Kandidat/OBS, siehe jeweilige Route) und belegt
// dabei bewusst eine feste Breite (11.75rem, wie der Buzzer-Knopf in BuzzerButton), damit das
// Video unabhängig davon, ob gerade Tipps angezeigt werden, optisch mittig bleibt. Die Höhe
// folgt derselben min(heightVh, 100%)-Formel wie ActiveClipPlayer, dadurch ist die Gesamthöhe
// der beiden Tipp-Slots zusammen immer exakt so hoch wie das Videofenster daneben.
function hintFontClass(text: string): string {
  if (text.length > 140) return 'text-xs'
  if (text.length > 80) return 'text-sm'
  return 'text-base'
}

function HintSlot({ n, text }: { n: 1 | 2; text?: string | null }) {
  if (!text) return <div className="flex-1 min-h-0" aria-hidden="true" />
  return (
    <div className="hint-pop holo-border rounded-xl p-px flex-1 min-h-0">
      <div className="w-full h-full rounded-[11px] bg-stage-800/95 backdrop-blur-sm px-4 py-3 flex flex-col overflow-hidden">
        <p className="text-xs font-display font-700 text-poke-yellow-400 tracking-wide uppercase mb-1.5 shrink-0">Tipp {n}</p>
        <p className={`${hintFontClass(text)} text-white/90 leading-snug break-words overflow-y-auto`}>{text}</p>
      </div>
    </div>
  )
}

export default function HintPanel({
  hint1,
  hint2,
  heightVh,
}: {
  hint1?: string | null
  hint2?: string | null
  heightVh: number
}) {
  return (
    <div className="w-[11.75rem] shrink-0 flex flex-col gap-2.5" style={{ height: `min(${heightVh}vh, 100%)` }}>
      <HintSlot n={1} text={hint1} />
      <HintSlot n={2} text={hint2} />
    </div>
  )
}
