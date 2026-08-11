import { useEffect, useRef, useState } from 'react'
import { useQuizStore, type PlaybackStateRow } from '@/store/quizStore'
import { getClipPublicUrl, getSongPublic } from '@/features/songs/songs'
import { getServerOffsetMs, expectedPositionSeconds } from '@/features/playback/playbackSync'

const DRIFT_HARD_SEEK_SECONDS = 0.75
const DRIFT_SOFT_SECONDS = 0.05
const SYNC_INTERVAL_MS = 2000
const OFFSET_REFRESH_MS = 60_000

export default function ActiveClipPlayer() {
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

  function handleLoadedMetadata() {
    const video = videoRef.current
    const state = playbackRef.current
    if (!video || !state) return
    video.currentTime = expectedPositionSeconds(state, offsetRef.current)
    if (state.is_playing) video.play().catch(() => {})
  }

  return (
    <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center">
      {clipUrl ? (
        <video
          key={clipUrl}
          ref={videoRef}
          src={clipUrl}
          className="w-full h-full"
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
        />
      ) : (
        <p className="text-white/40">Kein Song geladen.</p>
      )}
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
