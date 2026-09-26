import type { ThemeId } from '../store/theme'

export interface AccentPalette {
  accent: string
  accent2: string
  accentSoft: string
  accentInk: string
  heroFrom: string
  heroTo: string
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return [2, 132, 199]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [h * 360, s, l]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = (((h % 360) + 360) % 360) / 360
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  let r: number
  let g: number
  let b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return [r * 255, g * 255, b * 255]
}

/** 由主色推导一整套 accent 变体（深/浅/渐变），用于「普通」主题自定义配色 */
export function deriveAccent(hex: string): AccentPalette {
  const [r, g, b] = hexToRgb(hex)
  const [h, s, l] = rgbToHsl(r, g, b)
  const accent = rgbToHex(r, g, b)
  const accent2 = rgbToHex(...hslToRgb(h, s, clamp(l - 0.08, 0, 1)))
  const accentInk = rgbToHex(...hslToRgb(h, clamp(s + 0.05, 0, 1), clamp(l - 0.18, 0.18, 0.45)))
  const accentSoft = rgbToHex(r * 0.13 + 255 * 0.87, g * 0.13 + 255 * 0.87, b * 0.13 + 255 * 0.87)
  const heroFrom = rgbToHex(...hslToRgb(h, s, clamp(l + 0.05, 0, 1)))
  const heroTo = rgbToHex(...hslToRgb(clamp(h - 12, 0, 360), clamp(s + 0.06, 0, 1), clamp(l + 0.02, 0, 1)))
  return { accent, accent2, accentSoft, accentInk, heroFrom, heroTo }
}

/** 玻璃拟态：靛紫系 */
const GLASS_PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#0ea5e9',
  '#3b82f6',
  '#a78bfa',
  '#06b6d4',
  '#60a5fa',
  '#c084fc',
  '#22d3ee',
  '#818cf8',
]

/** 瑞士极简：中性灰阶 */
const SWISS_PALETTE = [
  '#0f172a',
  '#334155',
  '#475569',
  '#64748b',
  '#94a3b8',
  '#1e293b',
  '#52525b',
  '#a1a1aa',
  '#3f3f46',
  '#cbd5e1',
]

/** 亲自然：苔绿系 */
const BIOPHILIC_PALETTE = [
  '#2f7d5f',
  '#3f9d78',
  '#4aae86',
  '#25624a',
  '#6fae93',
  '#2b8a6a',
  '#57b894',
  '#1f5c46',
  '#7cc2a1',
  '#3c8a6a',
]

/** 由主色派生一组合谐的图表色板（普通主题跟随自定义配色） */
function spreadFromHue(h: number, s: number, l: number): string[] {
  const offsets = [0, 24, -20, 40, -40, 12, -28, 52, -52, 8]
  const lights = [0, -0.04, 0.04, -0.08, 0.08, -0.02, 0.02, -0.1, 0.1, 0]
  return offsets.map((off, i) => {
    const nh = (h + off + 360) % 360
    const nl = clamp(l + lights[i], 0.28, 0.72)
    const ns = clamp(s * 0.9, 0.35, 0.85)
    return rgbToHex(...hslToRgb(nh, ns, nl))
  })
}

export function chartPalette(theme: ThemeId, customAccent: string | null): string[] {
  if (theme === 'normal') {
    const [r, g, b] = hexToRgb(customAccent ?? '#0284c7')
    const [h, s, l] = rgbToHsl(r, g, b)
    return spreadFromHue(h, s, l)
  }
  if (theme === 'glass') return GLASS_PALETTE
  if (theme === 'swiss') return SWISS_PALETTE
  return BIOPHILIC_PALETTE
}