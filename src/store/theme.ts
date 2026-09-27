import type { PaperBg } from '../lib/paperBg'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeId =
  | 'normal'
  | 'glass'
  | 'liquid'
  | 'swiss'
  | 'biophilic'
  | 'softmed'
  | 'epaper'
  | 'epaper-pro'

/** 底部导航实现：css = 纯 CSS 弹簧拖拽版，webgl = 液态玻璃高光版 */
export type NavStyle = 'css' | 'webgl'

interface ThemeState {
  theme: ThemeId
  /** 「普通 / 玻璃拟态 / 液态玻璃」主题的自定义主色（null = 各自默认色） */
  customAccent: string | null
  /** 「电子纸 Pro」的纸张背景（null = 跟随主题默认米白） */
  paperBg: PaperBg
  navStyle: NavStyle
  /** 全局圆角缩放倍数（1 = 主题默认） */
  radiusScale: number
  setTheme: (theme: ThemeId) => void
  setCustomAccent: (hex: string | null) => void
  setPaperBg: (paperBg: PaperBg) => void
  setNavStyle: (navStyle: NavStyle) => void
  setRadiusScale: (radiusScale: number) => void
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'normal',
      customAccent: null,
      paperBg: null,
      navStyle: 'css',
      radiusScale: 1,
      setTheme: (theme) => set({ theme, radiusScale: 1 }),
      setCustomAccent: (customAccent) => set({ customAccent }),
      setPaperBg: (paperBg) => set({ paperBg }),
      setNavStyle: (navStyle) => set({ navStyle }),
      setRadiusScale: (radiusScale) => set({ radiusScale }),
    }),
    { name: 'asset-theme' },
  ),
)
