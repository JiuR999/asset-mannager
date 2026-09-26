import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId = 'normal' | 'glass' | 'swiss' | 'biophilic' | 'softmed' | 'epaper'

/** 底部导航实现：css = 纯 CSS 弹簧拖拽版，webgl = 液态玻璃高光版 */
export type NavStyle = 'css' | 'webgl'

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
      navStyle: 'css',
      setTheme: (theme) => set({ theme }),
      setCustomAccent: (customAccent) => set({ customAccent }),
      setNavStyle: (navStyle) => set({ navStyle }),
    }),
    { name: 'asset-theme' },
  ),
)