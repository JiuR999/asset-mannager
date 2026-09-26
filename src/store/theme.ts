import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'normal' | 'glass' | 'swiss' | 'biophilic'

interface ThemeState {
  theme: ThemeId
  /** 「普通」主题下的自定义主色（null = 默认清透冰蓝） */
  customAccent: string | null
  setTheme: (theme: ThemeId) => void
  setCustomAccent: (hex: string | null) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'normal',
      customAccent: null,
      setTheme: (theme) => set({ theme }),
      setCustomAccent: (customAccent) => set({ customAccent }),
    }),
    { name: 'asset-theme' },
  ),
)