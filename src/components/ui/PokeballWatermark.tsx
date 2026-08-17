import PokeballIcon from './PokeballIcon'
import chatotUrl from '@/assets/decor/chatot.png'
import krawummsUrl from '@/assets/decor/krawumms.png'
import rotomUrl from '@/assets/decor/rotom.png'

// Dezentes Hintergrund-Wasserzeichen für die dichten Live-Screens (Host/Kandidat/OBS) --
// füllt die unvermeidbare Restfläche neben Kameras/Video optisch, statt sie leer zu lassen.
// Bewusst sehr niedrige Opacity + pointer-events-none + -z-10, damit nichts mit den
// eigentlichen Inhalten konkurriert.
// Ein weiterer Pokeball sitzt zusätzlich zentriert hinter dem Buzzer (siehe BuzzerButton.tsx)
// und folgt damit dem Buzzer statt an einer festen Bildschirmposition zu raten. Der zweite
// (rechte) Ball hier landet an ungefähr derselben Stelle -- die Kandidatenansicht blendet ihn
// daher per hideRightBall aus, damit dort nicht zwei Bälle übereinanderliegen; Host/OBS (ohne
// Buzzer) zeigen ihn weiterhin.
const BALLS = [
  'fixed -top-24 -left-16 w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] opacity-[0.08] rotate-[18deg]',
  'fixed top-[62%] -right-20 w-[22vw] h-[22vw] max-w-[320px] max-h-[320px] opacity-[0.09] -translate-y-1/2 rotate-[-15deg]',
]

// PNGs haben bereits einen echten Alpha-Kanal (transparent) -- reine Opacity reicht, kein
// mix-blend-mode nötig (der würde auf dunklem Untergrund ohnehin alles Richtung Schwarz ziehen).
// saturate/brightness sorgen dafür, dass die Motive trotz niedriger Opacity noch kräftig
// eingefärbt wirken statt ausgewaschen zu grau zu verblassen.
// Krawumms ist horizontal gespiegelt (-scale-x-100), damit es ins Bild statt aus dem
// Bildschirmrand heraus blickt.
const MON_FILTER = 'saturate(1.6) brightness(1.15)'
const POKEMON = [
  { src: chatotUrl, className: 'fixed -bottom-14 -right-16 w-[25.5vw] max-w-[345px] opacity-[0.26] rotate-[10deg]' },
  { src: krawummsUrl, className: 'fixed -bottom-12 -left-8 w-[22.5vw] max-w-[315px] opacity-[0.24] -rotate-6 -scale-x-100' },
  { src: rotomUrl, className: 'fixed top-1/2 -left-10 w-[19.5vw] max-w-[285px] opacity-[0.26] -translate-y-1/2 rotate-[-10deg]' },
]

export default function PokeballWatermark({ hideRightBall }: { hideRightBall?: boolean } = {}) {
  const balls = hideRightBall ? BALLS.slice(0, 1) : BALLS
  return (
    <>
      {balls.map((className, i) => (
        <PokeballIcon key={`ball-${i}`} className={`pointer-events-none -z-10 ${className}`} />
      ))}
      {POKEMON.map((p, i) => (
        <img
          key={`mon-${i}`}
          src={p.src}
          alt=""
          className={`pointer-events-none -z-10 ${p.className}`}
          style={{ filter: MON_FILTER }}
        />
      ))}
    </>
  )
}
