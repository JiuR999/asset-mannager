import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ChartPie, House, Plus, Settings, type LucideIcon } from 'lucide-react'
import { LiquidGlassNav } from 'webgl-liquid-glass'
import { useUi } from '../store/ui'
import { useTheme } from '../store/theme'

const tabs = [
  { to: '/', label: '首页', icon: House },
  { to: '/stats', label: '统计', icon: ChartPie },
  { to: '/settings', label: '设置', icon: Settings },
] as { to: string; label: string; icon: LucideIcon }[]

export default function BottomNav() {
  const openForm = useUi((s) => s.openForm)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const navStyle = useTheme((s) => s.navStyle)

  const activeIndex = tabs.findIndex((t) =>
    t.to === '/' ? pathname === '/' : pathname.startsWith(t.to),
  )
  const activeTo = tabs[activeIndex]?.to ?? '/'

  return (
    <>
      {navStyle === 'webgl' ? (
        <WebGLNav navigate={navigate} activeTo={activeTo} />
      ) : (
        <CssNav navigate={navigate} activeIndex={activeIndex} />
      )}

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

function WebGLNav({ navigate, activeTo }: { navigate: (to: string) => void; activeTo: string }) {
  const items = useMemo(
    () =>
      tabs.map((t) => {
        const Icon = t.icon
        return { id: t.to, label: t.label, icon: <Icon size={22} strokeWidth={2} /> }
      }),
    [],
  )

  return (
    <LiquidGlassNav
      items={items}
      activeItem={activeTo}
      onItemChange={(id) => navigate(id)}
      activeColor="var(--accent-ink)"
      inactiveColor="var(--ink-faint)"
      style={{
        zIndex: 40,
        bottom: 'calc(20px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        background: 'color-mix(in srgb, var(--surface) 65%, transparent)',
        boxShadow:
          '0 8px 32px rgba(15, 23, 42, 0.12), inset 0 0 0 1px color-mix(in srgb, var(--line) 85%, transparent)',
      }}
    />
  )
}

const PILL =
  'pointer-events-auto touch-pan-y mb-4 flex items-center gap-1 rounded-full border border-line bg-surface/80 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl'

function CssNav({ navigate, activeIndex }: { navigate: (to: string) => void; activeIndex: number }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [geom, setGeom] = useState<{ left: number; width: number; step: number } | null>(null)

  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)

  const startXRef = useRef<number | null>(null)
  const dragRef = useRef(0)
  const activatedRef = useRef(false)
  const didDragRef = useRef(false)

  useLayoutEffect(() => {
    const measure = () => {
      const parent = parentRef.current
      const a = itemRefs.current[0]
      const b = itemRefs.current[1]
      if (!parent || !a || !b) return
      const pa = parent.getBoundingClientRect()
      const ra = a.getBoundingClientRect()
      const rb = b.getBoundingClientRect()
      setGeom({ left: ra.left - pa.left, width: ra.width, step: rb.left - ra.left })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const clampDrag = (dx: number): number => {
    if (!geom) return 0
    const maxD = activeIndex === 0 ? 0 : geom.step
    const minD = activeIndex === tabs.length - 1 ? 0 : -geom.step
    return Math.max(minD, Math.min(maxD, dx))
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') return
    startXRef.current = e.clientX
    activatedRef.current = false
    didDragRef.current = false
    dragRef.current = 0
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startXRef.current == null) return
    const dx = e.clientX - startXRef.current
    if (!activatedRef.current && Math.abs(dx) > 6) {
      activatedRef.current = true
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (activatedRef.current) {
      const clamped = clampDrag(dx)
      dragRef.current = clamped
      setDrag(clamped)
    }
  }

  const endDrag = () => {
    if (startXRef.current == null) return
    startXRef.current = null
    if (!activatedRef.current) return
    activatedRef.current = false
    setDragging(false)
    setDrag(0)
    const step = geom?.step ?? 0
    let target = activeIndex
    if (step > 0) {
      if (dragRef.current <= -step / 2) target = activeIndex + 1
      else if (dragRef.current >= step / 2) target = activeIndex - 1
    }
    target = Math.max(0, Math.min(tabs.length - 1, target))
    dragRef.current = 0
    if (target !== activeIndex) {
      didDragRef.current = true
      navigate(tabs[target].to)
    }
  }

  const stretch = geom && dragging ? 1 + Math.min(Math.abs(drag) / geom.step, 1) * 0.4 : 1

  return (
    <nav className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div
        ref={parentRef}
        className={`${PILL} ${dragging ? 'select-none' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (dragging) endDrag()
        }}
      >
      {geom && (
        <span
          className={`nav-blob absolute bottom-1.5 top-1.5 rounded-full ${dragging ? '' : 'nav-blob-settle'}`}
          style={{
            left: geom.left,
            width: geom.width,
            transform: `translateX(${activeIndex * geom.step + drag}px) scaleX(${stretch})`,
          }}
        />
      )}
      {tabs.map((t, i) => {
        const Icon = t.icon
        const active = i === activeIndex
        return (
          <button
            key={t.to}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            type="button"
            aria-label={t.label}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              if (didDragRef.current) return
              navigate(t.to)
            }}
            className={`relative flex min-w-[4.25rem] flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[11px] transition-colors ${
              active ? 'text-accent-ink' : 'text-ink-faint'
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            {t.label}
          </button>
        )
      })}
      </div>
    </nav>
  )
}