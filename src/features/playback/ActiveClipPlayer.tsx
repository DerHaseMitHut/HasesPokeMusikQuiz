import { useEffect, useRef, useState } from 'react'
import { useQuizStore, type PlaybackStateRow } from '@/store/quizStore'
import { getClipPublicUrl, getSongPublic } from '@/features/songs/songs'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'

const DRIFT_HARD_SEEK_SECONDS = 0.75
const DRIFT_SOFT_SECONDS = 0.05
const SYNC_INTERVAL_MS = 2000
const OFFSET_REFRESH_MS = 60_000

export default function ActiveClipPlayer({ heightVh }: { heightVh: number }) {
  const playbackState = useQuizStore((s) => s.playbackState)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const playbackRef = useRef<PlaybackStateRow | null>(playbackState)
  const offsetRef = useRef(0)
  const [clipUrl, setClipUrl] = useState<string | null>(null)

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

  // Sofort reagieren statt bis zu SYNC_INTERVAL_MS (2s) auf den nächsten periodischen Tick zu
  // warten -- sonst fühlen sich Play/Pause/"Von vorne" spürbar verzögert an, obwohl der DB-
  // Schreibvorgang selbst schnell war.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackState || !clipUrl) return
    applySync(video, playbackState, offsetRef.current)
  }, [playbackState?.is_playing, playbackState?.position_seconds, playbackState?.current_clip, clipUrl])

  function handleLoadedMetadata() {
    const video = videoRef.current
    const state = playbackRef.current
    if (!video || !state) return
    video.currentTime = expectedPositionSeconds(state, offsetRef.current)
    if (state.is_playing) video.play().catch(() => {})
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

  // Erst seeken/Playbackrate anpassen, DANACH erst play() anfordern -- ein currentTime-Sprung
  // während eine vorherige play()-Anfrage noch offen ist, lässt manche Browser das zugehörige
  // Promise mit einem Fehler abbrechen ("interrupted by a new load request").
  if (Math.abs(drift) > DRIFT_HARD_SEEK_SECONDS) {
    video.currentTime = expected
    video.playbackRate = 1
  } else if (Math.abs(drift) > DRIFT_SOFT_SECONDS) {
    video.playbackRate = drift > 0 ? 0.98 : 1.02
  } else {
    video.playbackRate = 1
  }

  if (video.paused) video.play().catch(() => {})
}
