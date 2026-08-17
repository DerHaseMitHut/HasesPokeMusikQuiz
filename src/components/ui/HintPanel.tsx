// Sitzt links neben dem Videofenster (Host/Kandidat/OBS, siehe jeweilige Route) und belegt
// dabei bewusst eine feste Breite (11.75rem, wie der frühere leere Spacer in
// CandidatePlayPage), damit das Video unabhängig davon, ob gerade Tipps angezeigt werden,
// optisch mittig bleibt.
export default function HintPanel({ hint1, hint2 }: { hint1?: string | null; hint2?: string | null }) {
  const hints = [hint1, hint2].filter((h): h is string => Boolean(h))

  return (
    <div className="w-[11.75rem] shrink-0 flex flex-col justify-center gap-2.5" aria-hidden={hints.length === 0}>
      {hints.map((hint, i) => (
        <div key={i} className="hint-pop holo-border rounded-xl p-px">
          <div className="rounded-[11px] bg-stage-800/95 backdrop-blur-sm px-3 py-2.5">
            <p className="text-[10px] font-display font-700 text-poke-yellow-400 tracking-wide uppercase mb-1">Tipp {i + 1}</p>
            <p className="text-sm text-white/90 leading-snug">{hint}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
