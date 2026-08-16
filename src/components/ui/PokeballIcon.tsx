export default function PokeballIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="#111" strokeWidth="4" />
      <path d="M4 50a46 46 0 0 1 92 0z" fill="var(--color-poke-red-500)" stroke="#111" strokeWidth="4" />
      <rect x="4" y="47" width="92" height="6" fill="#111" />
      <circle cx="50" cy="50" r="14" fill="#fff" stroke="#111" strokeWidth="4" />
      <circle cx="50" cy="50" r="6" fill="#fff" stroke="#111" strokeWidth="3" />
    </svg>
  )
}
