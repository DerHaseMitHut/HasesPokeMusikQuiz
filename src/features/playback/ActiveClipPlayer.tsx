import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useQuizStore, type PlaybackStateRow } from '@/store/quizStore'
import { getClipPublicUrl, getSongPublic } from '@/features/songs/songs'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'

const DRIFT_HARD_SEEK_SECONDS = 0.75
const DRIFT_SOFT_SECONDS = 0.05
const SYNC_INTERVAL_MS = 2000
const OFFSET_REFRESH_MS = 60_000
const VOLUME_STORAGE_KEY = 'musikquiz:volume'

export default function ActiveClipPlayer({ heightVh, showVolumeControl }: { heightVh: number; showVolumeControl?: boolean }) {
  const playbackState = useQuizStore((s) => s.playbackState)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playbackRef = useRef<PlaybackStateRow | null>(playbackState)
  const offsetRef = useRef(0)
  const [clipUrl, setClipUrl] = useState<string | null>(null)
  // Lautstärke ist bewusst lokal (localStorage) statt Teil des geteilten Room-States -- jeder
  // soll sie für sich selbst einstellen können, ohne andere zu beeinflussen.
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(VOLUME_STORAGE_KEY)
    return saved ? Number(saved) : 1
  })

  useEffect(() => {
    playbackRef.current = playbackState
  }, [playbackState])

  useEffect(() => {
    let cancelled = false
    async function refreshOffset() {
      try {
        const offset = await getServerOffsetMs(true)
        if (!cancelled) offsetRef.current = offset
      } catch {
        // Netzwerkfehler ignorieren, letzten bekannten Offset weiterverwenden
      }
    }
    refreshOffset()
    const id = setInterval(refreshOffset, OFFSET_REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    const songId = playbackState?.current_song_id
    const clip = playbackState?.current_clip
    if (!songId || !clip) {
      setClipUrl(null)
      return
    }
    let cancelled = false
    getSongPublic(songId).then((song) => {
      if (cancelled || !song) return
      const path = clip === 'solution' ? song.solution_storage_path : song.riddle_storage_path
      setClipUrl(path ? getClipPublicUrl(path) : null)
    })
    return () => {
      cancelled = true
    }
  }, [playbackState?.current_song_id, playbackState?.current_clip])

  useEffect(() => {
    const id = setInterval(() => {
      const video = videoRef.current
      const state = playbackRef.current
      if (!video || !state || !clipUrl) return
      applySync(video, state, offsetRef.current)
    }, SYNC_INTERVAL_MS)
    return () => clearInterval(id)
  }, [clipUrl])

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume
  }, [volume, clipUrl])

  function handleLoadedMetadata() {
    const video = videoRef.current
    const state = playbackRef.current
    if (!video || !state) return
    video.currentTime = expectedPositionSeconds(state, offsetRef.current)
    video.volume = volume
    if (state.is_playing) video.play().catch(() => {})
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v))
  }

  // height als konkrete vh-Einheit (nicht % eines Flex-Elternteils) ist immer "definit" --
  // dadurch berechnet aspect-ratio die Breite zuverlässig automatisch, ganz ohne die früher
  // nötige Container-Query-Krücke. min(heightVh, 100%) deckelt zusätzlich auf die tatsächlich
  // verfügbare Höhe der Zeile (setzt items-stretch beim Elternteil voraus, siehe Route-Dateien)
  // -- sonst würde die Slider-Einstellung auf kurzen/kleinen Fenstern Geschwister wie den
  // Buzzer aus dem Viewport drängen statt selbst zu schrumpfen. max-width fängt den Fall ab,
  // dass die berechnete Breite den verfügbaren Platz sprengen würde (schmale Fenster).
  // w-full auf diesem Wrapper würde ihn per flex-basis:auto->100% über die gesamte verfügbare
  // Zeilenbreite spannen (viel breiter als das eigentliche Video), wodurch Geschwister wie
  // HintPanel am Rand dieser breiten Zone statt bündig neben dem sichtbaren Video landen --
  // ohne w-full schrumpft der Wrapper auf die tatsächliche Videobreite, und die Zeile zentriert
  // die ganze Gruppe (HintPanel + Video + Buzzer) eng zusammen.
  return (
    <div className="h-full flex items-center justify-center">
      <div
        className="relative bg-black rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: '55 / 29', height: `min(${heightVh}vh, 100%)`, width: 'auto', maxWidth: '100%' }}
      >
        {clipUrl ? (
          <video
            key={clipUrl}
            ref={videoRef}
            src={clipUrl}
            className="w-full h-full object-contain"
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <p className="text-white/40">Kein Song geladen.</p>
        )}

        {showVolumeControl && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5">
            <span className="text-white/60 text-xs">🔊</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-poke-yellow-400"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function applySync(video: HTMLVideoElement, state: PlaybackStateRow, offsetMs: number) {
  const expected = expectedPositionSeconds(state, offsetMs)
  const drift = video.currentTime - expected

  if (!state.is_playing) {
    video.pause()
    if (Math.abs(drift) > DRIFT_HARD_SEEK_SECONDS) video.currentTime = expected
    video.playbackRate = 1
    return
  }

  if (video.paused) video.play().catch(() => {})

  if (Math.abs(drift) > DRIFT_HARD_SEEK_SECONDS) {
    video.currentTime = expected
    video.playbackRate = 1
  } else if (Math.abs(drift) > DRIFT_SOFT_SECONDS) {
    video.playbackRate = drift > 0 ? 0.98 : 1.02
  } else {
    video.playbackRate = 1
  }
}
