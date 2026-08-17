// Sitzt links neben dem Videofenster (Host/Kandidat/OBS, siehe jeweilige Route) und belegt
// dabei bewusst eine feste Breite (11.75rem, wie der Buzzer-Knopf in BuzzerButton), damit das
// Video unabhängig davon, ob gerade Tipps angezeigt werden, optisch mittig bleibt.
//
// Struktur bewusst identisch zum äußeren Wrapper von ActiveClipPlayer (h-full + items-center,
// dann ein innerer Block mit expliziter min(heightVh, 100%)-Höhe): nur wenn beide denselben
// "voll gestreckter Rahmen, darin zentrierter Inhalt gleicher Höhe"-Aufbau verwenden, landen
// Tipp-Boxen und Video auf derselben vertikalen Position statt gegeneinander versetzt.
function hintFontClass(text: string): string {
  if (text.length > 140) return 'text-base'
  if (text.length > 80) return 'text-lg'
  return 'text-xl'
}

function HintSlot({ n, text }: { n: 1 | 2; text?: string | null }) {
  if (!text) return <div className="flex-1 min-h-0" aria-hidden="true" />
  return (
    <div className="hint-pop holo-border rounded-xl p-px flex-1 min-h-0">
      <div className="w-full h-full rounded-[11px] bg-stage-800/95 backdrop-blur-sm px-4 py-3 flex flex-col overflow-hidden">
        <p className="text-xs font-display font-700 text-poke-yellow-400 tracking-wide uppercase mb-1.5 shrink-0">Tipp {n}</p>
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <p className={`${hintFontClass(text)} text-white/90 leading-snug break-words text-center overflow-y-auto`}>{text}</p>
        </div>
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
    <div className="w-[11.75rem] h-full shrink-0 flex items-center justify-center">
      <div className="w-full flex flex-col gap-2.5" style={{ height: `min(${heightVh}vh, 100%)` }}>
        <HintSlot n={1} text={hint1} />
        <HintSlot n={2} text={hint2} />
      </div>
    </div>
  )
}
