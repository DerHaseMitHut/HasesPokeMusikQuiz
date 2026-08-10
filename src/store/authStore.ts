import { create } from 'zustand'
import { ensureAnonymousSession, isCurrentUserHost } from '../lib/auth'

interface AuthState {
  userId: string | null
  isHost: boolean
  ready: boolean
  error: string | null
  init: () => Promise<void>
  refreshHostStatus: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  isHost: false,
  ready: false,
  error: null,

  init: async () => {
    try {
      const userId = await ensureAnonymousSession()
      const isHost = await isCurrentUserHost()
      set({ userId, isHost, ready: true, error: null })
    } catch (err) {
      set({
        ready: true,
        error: err instanceof Error ? err.message : 'Anmeldung fehlgeschlagen.',
      })
    }
  },

  refreshHostStatus: async () => {
    const isHost = await isCurrentUserHost()
    set({ isHost })
  },
}))
