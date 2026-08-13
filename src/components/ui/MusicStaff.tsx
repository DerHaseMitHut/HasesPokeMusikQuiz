// Dekoratives Notenlinien-Band, das HINTER einer Kamera-Reihe liegt — die Kameras selbst
// sind die "Noten" auf den Linien, deshalb hier bewusst nur die fünf Linien und kein
// eigenes Notensymbol (das würde mit den Kameras konkurrieren statt sie zu sein).
export default function MusicStaff({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className={className} aria-hidden="true">
      {[4, 12, 20, 28, 36].map((y) => (
        <line
          key={y}
          x1={0}
          y1={y}
          x2={1000}
          y2={y}
          stroke="var(--color-poke-yellow-400)"
          strokeOpacity={0.4}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}
