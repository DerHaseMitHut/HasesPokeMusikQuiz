import type { Context } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { AccessToken, TrackSource } from 'livekit-server-sdk'
// netlify dev injiziert .env-Werte in den Vite-Prozess und die CLI selbst, aber nicht
// zuverlässig in den Function-Worker (deployEnvironment ist für ungelinkte Projekte leer).
// dotenv füllt process.env hier lokal auf; im echten Deploy existiert keine .env-Datei,
// dort liefert Netlify die Variablen ohnehin direkt über process.env.
import 'dotenv/config'

type Role = 'host' | 'player' | 'obs'

function isRole(value: unknown): value is Role {
  return value === 'host' || value === 'player' || value === 'obs'
}

export default async (req: Request, _context: Context): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  let body: { roomCode?: unknown; role?: unknown }
  try {
    body = (await req.json()) as { roomCode?: unknown; role?: unknown }
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  const roomCode = typeof body.roomCode === 'string' ? body.roomCode.toUpperCase() : null
  const role = isRole(body.role) ? body.role : null
  if (!roomCode || !role) {
    return new Response('roomCode und role sind erforderlich', { status: 400 })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
  const livekitUrl = process.env.VITE_LIVEKIT_URL
  const livekitApiKey = process.env.LIVEKIT_API_KEY
  const livekitApiSecret = process.env.LIVEKIT_API_SECRET
  if (!supabaseUrl || !supabaseAnonKey || !livekitUrl || !livekitApiKey || !livekitApiSecret) {
    return new Response('Server-Konfiguration unvollständig', { status: 500 })
  }

  // RLS greift auch hier — derselbe Anon-Key + das User-JWT wie im Browser,
  // kein Service-Role-Key nötig (siehe .env.example).
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('id')
    .eq('code', roomCode)
    .maybeSingle()
  if (roomError) {
    return new Response(roomError.message, { status: 500 })
  }
  if (!room) {
    return new Response('Raum nicht gefunden', { status: 404 })
  }

  let identity: string
  let name: string
  let canPublish: boolean
  let hidden: boolean

  if (role === 'host' || role === 'obs') {
    const { data: hostRow, error: hostError } = await supabase
      .from('hosts')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
    if (hostError) return new Response(hostError.message, { status: 500 })
    if (!hostRow) return new Response('Nur der Host darf diese Ansicht öffnen', { status: 403 })

    identity = role === 'host' ? 'host' : `obs-${crypto.randomUUID()}`
    name = 'Gastgeber'
    canPublish = role === 'host'
    hidden = role === 'obs'
  } else {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id, display_name')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (playerError) return new Response(playerError.message, { status: 500 })
    if (!player) return new Response('Du bist diesem Raum noch nicht beigetreten', { status: 403 })

    identity = player.id
    name = player.display_name
    canPublish = true
    hidden = false
  }

  const token = new AccessToken(livekitApiKey, livekitApiSecret, { identity, name, ttl: '4h' })
  token.addGrant({
    roomJoin: true,
    room: room.id,
    canPublish,
    canPublishSources: canPublish ? [TrackSource.CAMERA] : undefined,
    canSubscribe: true,
    hidden,
  })

  return new Response(JSON.stringify({ token: await token.toJwt(), url: livekitUrl }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
