import { supabase } from '@/lib/supabaseClient'

export type VideoRole = 'host' | 'player' | 'obs'

export async function fetchLiveKitToken(roomCode: string, role: VideoRole): Promise<{ token: string; url: string }> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token
  if (!accessToken) throw new Error('Nicht angemeldet.')

  const res = await fetch('/.netlify/functions/livekit-token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ roomCode, role }),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }
  return res.json()
}
