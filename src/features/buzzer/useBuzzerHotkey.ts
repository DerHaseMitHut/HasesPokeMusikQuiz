import { useEffect, useState } from 'react'

const HOTKEY_STORAGE_KEY = 'musikquiz:buzzer-hotkey'

// KeyboardEvent.code -> Anzeigename. Nur für gängige Tasten, sonst wird der Rohcode gezeigt.
export function formatKeyCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`
  if (code.startsWith('Arrow')) return `Pfeil ${code.slice(5)}`
  if (code === 'Space') return 'Leertaste'
  return code
}

// Lokal (nicht Teil des geteilten Room-States) je Browser gespeicherter Buzzer-Hotkey.
// Steuerung (Button/Anzeige) und Auslösung (BuzzerButton) sitzen an unterschiedlichen Stellen
// im Baum, daher lebt der State hier statt in einer der beiden Komponenten.
export function useBuzzerHotkey() {
  const [hotkey, setHotkeyState] = useState<string | null>(() => localStorage.getItem(HOTKEY_STORAGE_KEY))
  const [recording, setRecording] = useState(false)

  // Hotkey aufnehmen: nächster Tastendruck wird gespeichert, Escape bricht ab.
  useEffect(() => {
    if (!recording) return
    function onKeyDown(e: KeyboardEvent) {
      e.preventDefault()
      if (e.code === 'Escape') {
        setRecording(false)
        return
      }
      localStorage.setItem(HOTKEY_STORAGE_KEY, e.code)
      setHotkeyState(e.code)
      setRecording(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [recording])

  function startRecording() {
    setRecording(true)
  }

  function clearHotkey() {
    localStorage.removeItem(HOTKEY_STORAGE_KEY)
    setHotkeyState(null)
  }

  return { hotkey, recording, startRecording, clearHotkey }
}
