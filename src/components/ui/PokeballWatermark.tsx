import PokeballIcon from './PokeballIcon'
import chatotUrl from '@/assets/decor/chatot.png'
import krawummsUrl from '@/assets/decor/krawumms.png'
import rotomUrl from '@/assets/decor/rotom.png'

// Dezentes Hintergrund-Wasserzeichen für die dichten Live-Screens (Host/Kandidat/OBS) --
// füllt die unvermeidbare Restfläche neben Kameras/Video optisch, statt sie leer zu lassen.
// Bewusst sehr niedrige Opacity + pointer-events-none + -z-10, damit nichts mit den
// eigentlichen Inhalten konkurriert.
const BALLS = [
  'fixed -bottom-24 -right-24 w-[30vw] h-[30vw] max-w-[460px] max-h-[460px] opacity-[0.05] -rotate-12',
  'fixed -top-24 -left-16 w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] opacity-[0.04] rotate-[18deg]',
]

// PNGs wurden vorab (scratchpad/strip_white.py) von weißem Hintergrund auf echte
// Transparenz gebracht -- mix-blend-mode wäre hier falsch, da "multiply" auf dunklem
// Untergrund alles Richtung Schwarz zieht statt es verschwinden zu lassen.
const POKEMON = [
  { src: chatotUrl, className: 'fixed -top-10 -right-14 w-[17vw] max-w-[230px] opacity-[0.14] rotate-[8deg]' },
  { src: krawummsUrl, className: 'fixed -bottom-12 left-1/4 w-[15vw] max-w-[210px] opacity-[0.12] -rotate-6' },
  { src: rotomUrl, className: 'fixed top-1/2 -left-10 w-[13vw] max-w-[190px] opacity-[0.14] -translate-y-1/2 rotate-[-10deg]' },
]

export default function PokeballWatermark() {
  return (
    <>
      {BALLS.map((className, i) => (
        <PokeballIcon key={`ball-${i}`} className={`pointer-events-none -z-10 ${className}`} />
      ))}
      {POKEMON.map((p, i) => (
        <img key={`mon-${i}`} src={p.src} alt="" className={`pointer-events-none -z-10 ${p.className}`} />
      ))}
    </>
  )
}
