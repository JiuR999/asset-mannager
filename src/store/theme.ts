import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'normal' | 'glass' | 'swiss' | 'biophilic'

interface ThemeState {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'normal',
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'asset-theme' },
  ),
)