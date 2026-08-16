const LINES = 5

// Dezentes Notenlinien-Motiv, das hinter der Kamerareihe "durchläuft" (in den Lücken
// zwischen den Kacheln sichtbar) -- rein CSS/Unicode, kein Bild-Asset nötig.
export default function StaffLines({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 -z-10 flex flex-col justify-between h-12 sm:h-16 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: LINES }).map((_, i) => (
        <div key={i} className="h-px bg-white/[0.07]" />
      ))}
      <span
        className="absolute -left-2 top-1/2 -translate-y-1/2 text-white/[0.09] select-none"
        style={{ fontSize: '4.5rem', lineHeight: 1, fontFamily: "'Segoe UI Symbol','Noto Music','Apple Symbols',sans-serif" }}
      >
        𝄞
      </span>
    </div>
  )
}
