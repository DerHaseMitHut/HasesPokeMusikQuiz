import { Link } from 'react-router-dom'
import { buttonClass } from '@/components/ui/Button'
import EqualizerBars from '@/components/ui/EqualizerBars'
import PokeballIcon from '@/components/ui/PokeballIcon'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex items-center gap-4">
        <PokeballIcon className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-[0_0_18px_rgba(255,203,5,0.45)]" />
        <h1 className="font-display text-5xl sm:text-6xl font-800 tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          <span className="text-poke-yellow-400">PokéMusik</span>
          <span className="text-poke-red-500">Quiz</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 text-poke-yellow-400/80 mb-4">
        <EqualizerBars className="h-4" />
        <p className="text-white/70 text-sm sm:text-base tracking-wide">
          Errate den Song, buzzere als Erster, sammle Punkte.
        </p>
        <EqualizerBars className="h-4" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <Link to="/host/login" className={buttonClass('primary', 'lg')}>
          Ich bin Gastgeber
        </Link>
        <Link to="/join" className={buttonClass('secondary', 'lg')}>
          Ich bin Kandidat
        </Link>
      </div>
    </div>
  )
}
