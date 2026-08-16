import PokeballIcon from './PokeballIcon'

type Ball = { className: string }

// Dezentes Hintergrund-Wasserzeichen für die dichten Live-Screens (Host/Kandidat/OBS) --
// mehrere Pokébälle in unterschiedlichen Größen/Ecken füllen die unvermeidbare Restfläche
// neben Kameras/Video optisch, statt sie leer zu lassen. Bewusst sehr niedrige Opacity und
// -z-10 + pointer-events-none, damit nichts mit den eigentlichen Inhalten konkurriert.
const BALLS: Ball[] = [
  'fixed -bottom-24 -right-24 w-[36vw] h-[36vw] max-w-[560px] max-h-[560px] opacity-[0.05] -rotate-12',
  'fixed -top-28 -left-20 w-[26vw] h-[26vw] max-w-[400px] max-h-[400px] opacity-[0.04] rotate-[18deg]',
  'fixed top-1/3 -right-16 w-[16vw] h-[16vw] max-w-[220px] max-h-[220px] opacity-[0.035] rotate-[-8deg]',
  'fixed -bottom-16 left-[8vw] w-[13vw] h-[13vw] max-w-[170px] max-h-[170px] opacity-[0.035] rotate-[6deg]',
].map((className) => ({ className }))

export default function PokeballWatermark() {
  return (
    <>
      {BALLS.map((ball, i) => (
        <PokeballIcon key={i} className={`pointer-events-none -z-10 ${ball.className}`} />
      ))}
    </>
  )
}
