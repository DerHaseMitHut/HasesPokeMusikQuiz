import { useEffect, useRef, useState } from 'react'
import type { Song } from './songs'
import Card from '@/components/ui/Card'

// Ersetzt ein natives <select> für die Live-Song-Auswahl -- bei 20-30 vorbereiteten Runden
// wird die Browser-Dropdown-Liste unübersichtlich lang. Zeigt stattdessen ein Popover mit
// Rundennummer, Suche und begrenzter, scrollbarer Höhe. Öffnet nach oben (bottom-full), weil
// die Aktionsleiste am unteren Bildschirmrand sitzt.
export default function SongSelectPanel({
  songs,
  currentSongId,
  onSelect,
  disabled,
}: {
  songs: Song[]
  currentSongId: string | null | undefined
  onSelect: (songId: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const current = songs.find((s) => s.id === currentSongId)
  const filtered = query.trim() ? songs.filter((s) => s.title.toLowerCase().includes(query.trim().toLowerCase())) : songs

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || songs.length === 0}
        className="rounded-lg bg-stage-900/80 border border-stage-600 px-3 py-2 text-sm outline-none hover:border-poke-yellow-400 disabled:opacity-50 max-w-[220px] truncate text-left"
      >
        {songs.length === 0 ? 'Keine Songs' : current ? `${current.order_index + 1}. ${current.title}` : 'Song wählen…'}
      </button>
      {open && (
        <Card className="absolute left-0 bottom-full mb-2 z-20 w-72 shadow-[0_0_40px_-12px_rgba(0,0,0,0.7)]">
          <div className="p-3 flex flex-col gap-2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen…"
              className="rounded-lg bg-stage-900/80 border border-stage-600 px-3 py-1.5 text-sm outline-none focus:border-poke-yellow-400"
            />
            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {filtered.length === 0 && <p className="text-white/40 text-xs px-2 py-1.5">Keine Treffer.</p>}
              {filtered.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    onSelect(song.id)
                    setOpen(false)
                  }}
                  className={`text-left rounded-lg px-2.5 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                    song.id === currentSongId ? 'bg-poke-yellow-400/20 text-poke-yellow-300' : 'hover:bg-stage-700 text-white/80'
                  }`}
                >
                  <span className="text-white/40 font-mono text-xs w-6 shrink-0 text-right">{song.order_index + 1}.</span>
                  <span className="truncate flex-1">{song.title}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
