import PokeballIcon from './PokeballIcon'

// Dezentes Hintergrund-Wasserzeichen für die dichten Live-Screens (Host/Kandidat/OBS) --
// füllt die unvermeidbare Restfläche neben Kameras/Video optisch, statt sie leer zu lassen.
export default function PokeballWatermark() {
  return (
    <PokeballIcon className="pointer-events-none fixed -bottom-24 -right-24 w-[36vw] h-[36vw] max-w-[560px] max-h-[560px] opacity-[0.04] -rotate-12 -z-10" />
  )
}
