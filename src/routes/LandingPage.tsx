import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8 flex items-center gap-3">
        <PokeballIcon className="h-12 w-12" />
        <h1 className="font-display text-4xl sm:text-5xl font-800 tracking-tight">
          <span className="text-poke-yellow-400">Musik</span>
          <span className="text-poke-red-500">Quiz</span>
        </h1>
      </div>
      <p className="max-w-md text-stage-600/0 text-white/70 mb-12">
        Errate den Song, buzzere als Erster, sammle Punkte.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/host/login"
          className="font-display font-700 text-lg px-8 py-4 rounded-2xl bg-poke-red-500 hover:bg-poke-red-400 transition-colors shadow-[var(--shadow-glow-red)]"
        >
          Ich bin Gastgeber
        </Link>
        <Link
          to="/join"
          className="font-display font-700 text-lg px-8 py-4 rounded-2xl bg-poke-blue-600 hover:bg-poke-blue-500 transition-colors"
        >
          Ich bin Kandidat
        </Link>
      </div>
    </div>
  )
}

function PokeballIcon({ className }: { className?: string }) {
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
