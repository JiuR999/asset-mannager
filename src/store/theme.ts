import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'normal' | 'glass' | 'swiss' | 'biophilic'

export type NavStyle = 'glass' | 'liquid'

interface ThemeState {
  theme: ThemeId
  /** 「普通」主题下的自定义主色（null = 默认清透冰蓝） */
  customAccent: string | null
  navStyle: NavStyle
  setTheme: (theme: ThemeId) => void
  setCustomAccent: (hex: string | null) => void
  setNavStyle: (navStyle: NavStyle) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'normal',
      customAccent: null,
      navStyle: 'glass',
      setTheme: (theme) => set({ theme }),
      setCustomAccent: (customAccent) => set({ customAccent }),
      setNavStyle: (navStyle) => set({ navStyle }),
    }),
    { name: 'asset-theme' },
  ),
)