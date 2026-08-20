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

  // Lautstärke läuft über einen Web-Audio-GainNode statt HTMLMediaElement.volume: Letzteres hat
  // auf manchen Windows-Setups (Audiotreiber/Hardwarebeschleunigung) einen bekannten Bug, bei
  // dem .volume korrekt gesetzt wird und sich auch korrekt zurückliest, die tatsächliche
  // Ausgabelautstärke sich aber trotzdem nicht ändert. Ein GainNode multipliziert die
  // Audiosamples direkt im Signalpfad und umgeht dieses Problem vollständig. Nur aufgebaut, wenn
  // showVolumeControl aktiv ist (Host/Kandidat) -- OBS hat keinen Regler und bleibt bei der
  // simplen Variante, um dort kein neues AudioContext-Autoplay-Risiko einzugehen.
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    playbackRef.current = playbackState
  }, [playbackState])

  useEffect(() => {
    if (gainNodeRef.current) gainNodeRef.current.gain.value = volume
  }, [volume])

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
      audioCtxRef.current?.resume().catch(() => {})
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
    // Der Klick, der is_playing auf true setzt, liegt zu diesem Zeitpunkt bereits einen Async-
    // Roundtrip zurück (kein direkter Nutzergesten-Kontext mehr) -- resume() hier trotzdem
    // anzustoßen kostet nichts und greift zuverlässig, sobald der Browser Autoplay für diese
    // Seite erlaubt (was play() an dieser Stelle nachweislich bereits darf).
    audioCtxRef.current?.resume().catch(() => {})
  }, [playbackState?.is_playing, playbackState?.position_seconds, playbackState?.current_clip, clipUrl])

  function ensureAudioGraph(video: HTMLVideoElement) {
    if (sourceVideoRef.current === video) return // schon verkabelt (z.B. Ref-Callback-Re-Invoke ohne echtes Remount)

    if (!audioCtxRef.current) {
      const ctx = new AudioContext()
      const gain = ctx.createGain()
      gain.gain.value = volume
      gain.connect(ctx.destination)
      audioCtxRef.current = ctx
      gainNodeRef.current = gain
    }

    sourceNodeRef.current?.disconnect()
    // createMediaElementSource darf pro <video>-Element nur einmal aufgerufen werden -- bei uns
    // unkritisch, da key={clipUrl} bei jedem Songwechsel ohnehin ein frisches Element erzeugt.
    const source = audioCtxRef.current.createMediaElementSource(video)
    source.connect(gainNodeRef.current!)
    sourceNodeRef.current = source
    sourceVideoRef.current = video

    audioCtxRef.current.resume().catch(() => {})
  }

  useEffect(() => {
    return () => {
      sourceNodeRef.current?.disconnect()
      gainNodeRef.current?.disconnect()
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  // Browser erlauben AudioContext.resume() nur innerhalb eines echten Nutzer-Gesten-Handlers.
  // Die resume()-Aufrufe oben (Sync-Interval, State-Change-Effect) greifen dafür nicht zuverlässig,
  // weil dazwischen ein Async-Roundtrip über Supabase-Realtime liegt -- der Browser wertet das nicht
  // mehr als "gerade eben geklickt". Dieser Listener fängt stattdessen die allererste echte
  // Interaktion irgendwo auf der Seite ab (beim Host z.B. schon der Klick auf "Play" selbst) und
  // schaltet den Ton darüber zuverlässig frei, statt darauf zu hoffen, dass jemand zufällig den
  // Regler anfasst.
  useEffect(() => {
    if (!showVolumeControl) return
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart']
    const tryResume = () => {
      audioCtxRef.current?.resume().catch(() => {})
      events.forEach((ev) => window.removeEventListener(ev, tryResume))
    }
    events.forEach((ev) => window.addEventListener(ev, tryResume))
    return () => events.forEach((ev) => window.removeEventListener(ev, tryResume))
  }, [showVolumeControl])

  function handleLoadedMetadata() {
    const video = videoRef.current
    const state = playbackRef.current
    if (!video || !state) return
    video.currentTime = expectedPositionSeconds(state, offsetRef.current)
    if (state.is_playing) video.play().catch(() => {})
  }

  // videoRef direkt setzen und den Audio-Graph sofort verkabeln, statt auf den nächsten Render-
  // Zyklus/Effect zu warten -- ein neu gemountetes <video> (key={clipUrl} wechselt bei jedem
  // Songwechsel) soll nie kurz ohne Lautstärkeanbindung starten.
  function setVideoNode(el: HTMLVideoElement | null) {
    videoRef.current = el
    if (!el) return
    if (showVolumeControl) {
      ensureAudioGraph(el)
    } else {
      el.volume = 1
    }
  }

  function handleVolumeChange(e: ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value)
    setVolume(v)
    localStorage.setItem(VOLUME_STORAGE_KEY, String(v))
    if (gainNodeRef.current) gainNodeRef.current.gain.value = v
    audioCtxRef.current?.resume().catch(() => {})
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
            // crossOrigin muss vor src gesetzt sein und stammt vom Supabase-Storage-Clip (anderer
            // Origin als die App) -- ohne dieses Attribut speist Chrome trotz des vom Storage
            // gesendeten Access-Control-Allow-Origin: * NUR STILLE in den GainNode ein
            // ("MediaElementAudioSource outputs zeroes due to CORS access restrictions"), während
            // der native Videopfad unkontrolliert in voller Lautstärke weiterläuft. Das war die
            // eigentliche Ursache dafür, dass der Regler bisher nie tatsächlich leiser gemacht hat.
            crossOrigin="anonymous"
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
