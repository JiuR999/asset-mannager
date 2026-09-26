import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { ChartPie, House, Plus, Settings } from 'lucide-react'
import { useUi } from '../store/ui'
import { useTheme } from '../store/theme'

const tabs = [
  { to: '/', icon: House, label: '首页' },
  { to: '/stats', icon: ChartPie, label: '统计' },
  { to: '/settings', icon: Settings, label: '设置' },
] as const

export default function BottomNav() {
  const openForm = useUi((s) => s.openForm)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navStyle = useTheme((s) => s.navStyle)

  const activeIndex = tabs.findIndex((t) =>
    t.to === '/' ? pathname === '/' : pathname.startsWith(t.to),
  )

  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 pointer-events-none">
        <div className="flex justify-center">
          {navStyle === 'liquid' ? (
            <LiquidPill activeIndex={activeIndex} />
          ) : (
            <GlassPill activeIndex={activeIndex} />
          )}
        </div>
      </nav>

      <button
        onClick={() => {
          openForm(null)
          navigate('/')
        }}
        aria-label="添加资产"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-hero-from to-hero-to text-white shadow-lg shadow-black/20 transition active:scale-95"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </>
  )
}

const pillBase =
  'pointer-events-auto mb-4 flex items-center gap-1 rounded-full border border-line bg-surface/80 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl'

function GlassPill({ activeIndex }: { activeIndex: number }) {
  return (
    <div className={pillBase}>
      {tabs.map((t, i) => {
        const Icon = t.icon
        const active = i === activeIndex
        return (
          <NavLink
            key={t.to}
            to={t.to}
            className={`flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
              active ? 'bg-accent-soft text-accent-ink' : 'text-ink-faint'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {t.label}
          </NavLink>
        )
      })}
    </div>
  )
}

function LiquidPill({ activeIndex }: { activeIndex: number }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [rect, setRect] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIndex]
    const parent = parentRef.current
    if (!el || !parent) return
    const a = el.getBoundingClientRect()
    const b = parent.getBoundingClientRect()
    setRect({ left: a.left - b.left, width: a.width })
  }, [activeIndex])

  return (
    <div ref={parentRef} className={`relative ${pillBase}`}>
      {rect && (
        <span
          className="liquid-blob absolute top-1.5 bottom-1.5 rounded-full bg-accent-soft"
          style={{ left: rect.left, width: rect.width }}
        />
      )}
      {tabs.map((t, i) => {
        const Icon = t.icon
        const active = i === activeIndex
        return (
          <NavLink
            key={t.to}
            to={t.to}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            className={`relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
              active ? 'text-accent-ink' : 'text-ink-faint'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {t.label}
          </NavLink>
        )
      })}
    </div>
  )
}