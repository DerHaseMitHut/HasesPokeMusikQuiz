import { useEffect, useRef, useState } from 'react'
import { updateRoomLayout } from '@/features/rooms/rooms'
import { errorMessage } from '@/lib/errors'
import { DEFAULT_ROOM_LAYOUT, type RoomLayoutSettings } from '@/store/quizStore'
import Card from './Card'

const FIELDS: { key: keyof RoomLayoutSettings; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'camSize', label: 'Kamera-Größe', min: 140, max: 560, step: 10, unit: 'px' },
  { key: 'videoMaxHeight', label: 'Video-Größe', min: 20, max: 70, step: 2, unit: 'vh' },
]

export default function LayoutSettingsPanel({ roomId, layout }: { roomId: string; layout: RoomLayoutSettings }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(layout)
  const [error, setError] = useState<string | null>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) setDraft(layout)
  }, [layout, open])

  function handleChange(key: keyof RoomLayoutSettings, value: number) {
    const next = { ...draft, [key]: value }
    setDraft(next)
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      updateRoomLayout(roomId, next)
        .then(() => setError(null))
        .catch((err) => setError(errorMessage(err, 'Speichern fehlgeschlagen.')))
    }, 300)
  }

  function handleReset() {
    setDraft(DEFAULT_ROOM_LAYOUT)
    updateRoomLayout(roomId, DEFAULT_ROOM_LAYOUT)
      .then(() => setError(null))
      .catch((err) => setError(errorMessage(err, 'Speichern fehlgeschlagen.')))
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Layout anpassen"
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-stage-800 border border-stage-600 hover:border-poke-yellow-400 text-white/70 hover:text-white transition-colors"
      >
        ⚙
      </button>
      {open && (
        <Card className="absolute right-0 top-10 z-20 w-72 shadow-[0_0_40px_-12px_rgba(0,0,0,0.7)]">
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-700 text-sm">Layout anpassen</h3>
              <button type="button" onClick={handleReset} className="text-xs text-white/50 hover:text-white/80 underline">
                Zurücksetzen
              </button>
            </div>
            {FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1 text-xs text-white/70">
                <span className="flex justify-between">
                  <span>{field.label}</span>
                  <span className="text-poke-yellow-400 font-700">
                    {draft[field.key]}
                    {field.unit}
                  </span>
                </span>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={draft[field.key]}
                  onChange={(e) => handleChange(field.key, Number(e.target.value))}
                  className="accent-poke-yellow-400"
                />
              </label>
            ))}
            {error && <p className="text-[11px] text-poke-red-400">{error}</p>}
            <p className="text-[10px] text-white/40">
              Seitenverhältnisse (16:9 Kameras, 55:29 Video) bleiben immer erhalten. Gilt live für alle Ansichten.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
