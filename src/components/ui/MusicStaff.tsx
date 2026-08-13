// Dekoratives Notenlinien-Band mit Pokéball-Notenköpfen — der durchgängige
// Pokémon×Musik-Bezug für die sonst eher nüchternen Live-Screens (Cam-Reihe).
const NOTES = [
  { x: 60, y: 55 },
  { x: 230, y: 30 },
  { x: 760, y: 40 },
  { x: 930, y: 60 },
]

export default function MusicStaff({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 90" preserveAspectRatio="none" className={className} aria-hidden="true">
      {[15, 30, 45, 60, 75].map((y) => (
        <line key={y} x1={0} y1={y} x2={1000} y2={y} stroke="var(--color-poke-yellow-400)" strokeOpacity={0.3} strokeWidth={1.5} />
      ))}
      {NOTES.map((note, i) => (
        <g key={i} transform={`translate(${note.x} ${note.y})`}>
          <line x1={7} y1={0} x2={7} y2={-28} stroke="var(--color-poke-yellow-400)" strokeOpacity={0.55} strokeWidth={2} />
          <path d="M7 -28 Q 20 -24 16 -12" fill="none" stroke="var(--color-poke-yellow-400)" strokeOpacity={0.55} strokeWidth={2} strokeLinecap="round" />
          <circle r={8} fill="white" stroke="#111" strokeOpacity={0.6} strokeWidth={1.2} />
          <path d="M -8 0 A 8 8 0 0 0 8 0 Z" fill="var(--color-poke-red-500)" />
          <rect x={-8} y={-1} width={16} height={2} fill="#111" opacity={0.6} />
          <circle r={1.6} fill="#111" opacity={0.7} />
        </g>
      ))}
    </svg>
  )
}
