import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Identity } from '../types'

interface AuthState {
  identity: Identity | null
  setIdentity: (identity: Identity) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      identity: null,
      setIdentity: (identity) => set({ identity }),
      logout: () => set({ identity: null }),
    }),
    { name: 'asset-auth' },
  ),
)
