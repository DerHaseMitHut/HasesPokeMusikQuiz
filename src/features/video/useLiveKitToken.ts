import { useEffect, useState } from 'react'
import { errorMessage } from '@/lib/errors'
import { fetchLiveKitToken, type VideoRole } from './livekitToken'

export function useLiveKitToken(roomCode: string | undefined, role: VideoRole) {
  const [token, setToken] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomCode) return
    let cancelled = false
    fetchLiveKitToken(roomCode, role)
      .then((result) => {
        if (cancelled) return
        setToken(result.token)
        setUrl(result.url)
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Kamera-Verbindung fehlgeschlagen.'))
      })
    return () => {
      cancelled = true
    }
  }, [roomCode, role])

  return { token, url, error }
}
