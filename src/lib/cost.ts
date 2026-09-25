import type { Asset } from '../types'

const DAY_MS = 86_400_000

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function toLocalDateStr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function todayStr(): string {
  return toLocalDateStr(new Date())
}

/** a → b 的自然天数差，至少 1 */
export function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.floor((startOfDay(b) - startOfDay(a)) / DAY_MS))
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** 已使用（或服役）天数 */
export function activeDays(a: Asset, now = new Date()): number {
  const start = parseDate(a.purchaseDate)
  const end = a.retiredAt ? parseDate(a.retiredAt) : now
  return daysBetween(start, end)
}

export function dailyCost(a: Asset, now = new Date()): number {
  return a.price / activeDays(a, now)
}

export function totalDaily(assets: Asset[], now = new Date()): number {
  return assets.filter((a) => !a.retiredAt).reduce((sum, a) => sum + dailyCost(a, now), 0)
}

export function fmtMoney(n: number): string {
  return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

export function fmtDaily(n: number): string {
  return '¥' + n.toFixed(2)
}
