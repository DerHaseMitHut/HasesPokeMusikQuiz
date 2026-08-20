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
  // Chrome & Co. blockieren automatisches Abspielen MIT TON, wenn es nicht direkt aus einer
  // Nutzer-Geste (Klick) ausgelöst wurde -- bei Kandidaten startet das Video aber über die
  // Sync-Logik, nicht über einen Klick auf einen Play-Knopf. Der Regler ändert dann zwar
  // video.volume korrekt, es ist aber trotzdem nichts zu hören. Wenn play() deshalb
  // fehlschlägt, zeigen wir einen Button, dessen Klick (= echte Nutzer-Geste) die Sperre
  // aufhebt.
  const [soundBlocked, setSoundBlocked] = useState(false)

  function attemptPlay(video: HTMLVideoElement) {
    video
      .play()
      .then(() => setSoundBlocked(false))
      .catch(() => setSoundBlocked(true))
  }

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
      applySync(video, state, offsetRef.current, attemptPlay)
    }, SYNC_INTERVAL_MS)
    return () => clearInterval(id)
  }, [clipUrl])

  // Sofort reagieren statt bis zu SYNC_INTERVAL_MS (2s) auf den nächsten periodischen Tick zu
  // warten -- sonst fühlen sich Play/Pause/"Von vorne" spürbar verzögert an, obwohl der DB-
  // Schreibvorgang selbst schnell war.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !playbackState || !clipUrl) return
    applySync(video, playbackState, offsetRef.current, attemptPlay)
  }, [playbackState?.is_playing, playbackState?.position_seconds, playbackState?.current_clip, clipUrl])

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume
  }, [volume, clipUrl])

  function handleLoadedMetadata() {
    const video = videoRef.current
    const state = playbackRef.current
    if (!video || !state) return
    video.currentTime = expectedPositionSeconds(state, offsetRef.current)
    video.volume = volume
    if (state.is_playing) attemptPlay(video)
  }

  // videoRef direkt setzen UND sofort die Lautstärke anwenden, statt auf den nächsten Render-
  // Zyklus/Effect zu warten -- garantiert, dass ein neu gemountetes <video> (key={clipUrl}
  // wechselt bei jedem Songwechsel) nie kurz mit falscher Lautstärke startet.
  function setVideoNode(el: HTMLVideoElement | null) {
    videoRef.current = el
    if (el) el.volume = volume
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v))
    if (videoRef.current) videoRef.current.volume = v
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
            ref={setVideoNode}
            src={clipUrl}
            className="w-full h-full object-contain"
            muted={false}
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
          />
        ) : (
          <p className="text-white/40">Kein Song geladen.</p>
        )}

        {soundBlocked && (
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) attemptPlay(videoRef.current)
            }}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 text-white text-sm font-700 hover:bg-black/70 transition-colors"
          >
            🔇 Ton blockiert – zum Aktivieren klicken
          </button>
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

function applySync(
  video: HTMLVideoElement,
  state: PlaybackStateRow,
  offsetMs: number,
  attemptPlay: (video: HTMLVideoElement) => void,
) {
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
  // Promise mit einem Fehler abbrechen ("interrupted by a new load request"). Das wurde bisher
  // fälschlich als von der Autoplay-Policy blockiert interpretiert (siehe attemptPlay/
  // soundBlocked), obwohl es reine Selbstsabotage durch die falsche Reihenfolge war -- sichtbar
  // als "Video spielt eine Sekunde, dann deckt das Ton-blockiert-Overlay alles zu".
  if (Math.abs(drift) > DRIFT_HARD_SEEK_SECONDS) {
    video.currentTime = expected
    video.playbackRate = 1
  } else if (Math.abs(drift) > DRIFT_SOFT_SECONDS) {
    video.playbackRate = drift > 0 ? 0.98 : 1.02
  } else {
    video.playbackRate = 1
  }

  if (video.paused) attemptPlay(video)
}
