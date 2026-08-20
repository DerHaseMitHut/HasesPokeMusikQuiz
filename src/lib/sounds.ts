import buzzUrl from '@/assets/sounds/chatot.mp3'
import correctUrl from '@/assets/sounds/levelup.mp3'
import wrongUrl from '@/assets/sounds/wrong-answer-3.mp3'

const SFX_VOLUME = 0.6

// Jeder Aufruf bekommt ein frisches Audio()-Objekt statt ein einzelnes wiederzuverwenden --
// so überlappen sich schnell aufeinanderfolgende Trigger sauber, statt die vorherige Wiedergabe
// abzuschneiden/zurückzuspulen.
function playAudio(url: string) {
  const audio = new Audio(url)
  audio.volume = SFX_VOLUME
  audio.play().catch(() => {})
}

export function playBuzzSound(): void {
  playAudio(buzzUrl)
}

export function playCorrectSound(): void {
  playAudio(correctUrl)
}

export function playWrongSound(): void {
  playAudio(wrongUrl)
}
