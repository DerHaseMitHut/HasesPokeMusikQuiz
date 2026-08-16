import { create } from 'zustand'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface PlayerRow {
  id: string
  room_id: string
  user_id: string
  display_name: string
  score: number
  vdo_url: string | null
  joined_at: string
}

export interface PlaybackStateRow {
  room_id: string
  current_song_id: string | null
  current_clip: 'riddle' | 'solution'
  is_playing: boolean
  position_seconds: number
  updated_at: string
}

export interface BuzzerStateRow {
  room_id: string
  round_id: string
  current_song_id: string | null
  is_open: boolean
  winner_player_id: string | null
  opened_at: string | null
  won_at: string | null
}

// Host-einstellbare Basisgrößen. Seitenverhältnisse (16:9 Kameras, 55:29 Video) ergeben sich
// daraus automatisch in den Komponenten, statt separat gespeichert zu werden.
export interface RoomLayoutSettings {
  camSize: number // px, Zielbreite je Kamera-Kachel
  videoMaxHeight: number // vh, Deckelhöhe des Videobereichs
}

export const DEFAULT_ROOM_LAYOUT: RoomLayoutSettings = {
  camSize: 440,
  videoMaxHeight: 48,
}

interface QuizState {
  roomId: string | null
  players: PlayerRow[]
  playbackState: PlaybackStateRow | null
  buzzerState: BuzzerStateRow | null
  roomLayout: RoomLayoutSettings
  channel: RealtimeChannel | null
  connect: (roomId: string) => Promise<void>
  disconnect: () => void
}

// Modul-weiter (nicht Store-)Zustand, damit ein doppelter connect()-Aufruf für denselben
// Raum dedupliziert wird — React StrictMode ruft Effects im Dev-Modus zweimal auf, und ohne
// dieses Guard würde der zweite Aufruf versuchen, Listener an einen Channel zu hängen, der
// vom ersten (noch laufenden) Aufruf bereits subscribed wurde. Supabase erlaubt das nicht
// ("cannot add postgres_changes callbacks ... after subscribe()").
let inFlight: { roomId: string; promise: Promise<void> } | null = null

function mergeLayout(raw: unknown): RoomLayoutSettings {
  return { ...DEFAULT_ROOM_LAYOUT, ...(raw && typeof raw === 'object' ? raw : {}) }
}

export const useQuizStore = create<QuizState>((set, get) => ({
  roomId: null,
  players: [],
  playbackState: null,
  buzzerState: null,
  roomLayout: DEFAULT_ROOM_LAYOUT,
  channel: null,

  connect: async (roomId) => {
    const current = get()
    if (current.roomId === roomId && current.channel) return
    if (inFlight?.roomId === roomId) return inFlight.promise

    if (current.channel) supabase.removeChannel(current.channel)

    const promise = (async () => {
      const [playersRes, playbackRes, buzzerRes, roomRes] = await Promise.all([
        supabase.from('players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true }),
        supabase.from('playback_state').select('*').eq('room_id', roomId).maybeSingle(),
        supabase.from('buzzer_state').select('*').eq('room_id', roomId).maybeSingle(),
        supabase.from('rooms').select('layout').eq('id', roomId).maybeSingle(),
      ])

      set({
        roomId,
        players: playersRes.data ?? [],
        playbackState: playbackRes.data ?? null,
        buzzerState: buzzerRes.data ?? null,
        roomLayout: mergeLayout(roomRes.data?.layout),
      })

      const channel = supabase
        .channel(`room-${roomId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
          (payload: RealtimePostgresChangesPayload<PlayerRow>) => {
            set((state) => ({ players: applyChange(state.players, payload, (p) => p.id) }))
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'playback_state', filter: `room_id=eq.${roomId}` },
          (payload: RealtimePostgresChangesPayload<PlaybackStateRow>) => {
            if (payload.eventType !== 'DELETE') set({ playbackState: payload.new as PlaybackStateRow })
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'buzzer_state', filter: `room_id=eq.${roomId}` },
          (payload: RealtimePostgresChangesPayload<BuzzerStateRow>) => {
            if (payload.eventType !== 'DELETE') set({ buzzerState: payload.new as BuzzerStateRow })
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
          (payload: RealtimePostgresChangesPayload<{ layout: unknown }>) => {
            set({ roomLayout: mergeLayout((payload.new as { layout?: unknown } | undefined)?.layout) })
          },
        )
        .subscribe()

      set({ channel })
    })()

    inFlight = { roomId, promise }
    try {
      await promise
    } finally {
      if (inFlight?.roomId === roomId) inFlight = null
    }
  },

  disconnect: () => {
    const { channel } = get()
    if (channel) supabase.removeChannel(channel)
    set({ roomId: null, players: [], playbackState: null, buzzerState: null, roomLayout: DEFAULT_ROOM_LAYOUT, channel: null })
  },
}))

function applyChange<T extends { [key: string]: any }>(
  rows: T[],
  payload: RealtimePostgresChangesPayload<T>,
  key: (row: T) => unknown,
): T[] {
  if (payload.eventType === 'INSERT') {
    return [...rows, payload.new as T]
  }
  if (payload.eventType === 'UPDATE') {
    const updated = payload.new as T
    return rows.map((row) => (key(row) === key(updated) ? updated : row))
  }
  if (payload.eventType === 'DELETE') {
    const removed = payload.old as T
    return rows.filter((row) => key(row) !== key(removed))
  }
  return rows
}
