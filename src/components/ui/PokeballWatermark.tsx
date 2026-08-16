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

// PNGs haben bereits einen echten Alpha-Kanal (transparent) -- reine Opacity reicht, kein
// mix-blend-mode nötig (der würde auf dunklem Untergrund ohnehin alles Richtung Schwarz ziehen).
const POKEMON = [
  { src: chatotUrl, className: 'fixed -bottom-14 -right-16 w-[25.5vw] max-w-[345px] opacity-[0.14] rotate-[10deg]' },
  { src: krawummsUrl, className: 'fixed -bottom-12 -left-8 w-[22.5vw] max-w-[315px] opacity-[0.12] -rotate-6' },
  { src: rotomUrl, className: 'fixed top-1/2 -left-10 w-[19.5vw] max-w-[285px] opacity-[0.14] -translate-y-1/2 rotate-[-10deg]' },
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
