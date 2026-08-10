import { create } from 'zustand'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

export interface PlayerRow {
  id: string
  room_id: string
  user_id: string
  display_name: string
  score: number
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

interface QuizState {
  roomId: string | null
  players: PlayerRow[]
  playbackState: PlaybackStateRow | null
  buzzerState: BuzzerStateRow | null
  channel: RealtimeChannel | null
  connect: (roomId: string) => Promise<void>
  disconnect: () => void
}

export const useQuizStore = create<QuizState>((set, get) => ({
  roomId: null,
  players: [],
  playbackState: null,
  buzzerState: null,
  channel: null,

  connect: async (roomId) => {
    const current = get()
    if (current.roomId === roomId && current.channel) return
    current.channel?.unsubscribe()

    const [playersRes, playbackRes, buzzerRes] = await Promise.all([
      supabase.from('players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true }),
      supabase.from('playback_state').select('*').eq('room_id', roomId).maybeSingle(),
      supabase.from('buzzer_state').select('*').eq('room_id', roomId).maybeSingle(),
    ])

    set({
      roomId,
      players: playersRes.data ?? [],
      playbackState: playbackRes.data ?? null,
      buzzerState: buzzerRes.data ?? null,
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
      .subscribe()

    set({ channel })
  },

  disconnect: () => {
    get().channel?.unsubscribe()
    set({ roomId: null, players: [], playbackState: null, buzzerState: null, channel: null })
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
