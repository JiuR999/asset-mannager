import { useLocation, useNavigate } from 'react-router'
import { ChartPie, House, Plus, Settings } from 'lucide-react'
import { LiquidGlassNav } from 'webgl-liquid-glass'
import { useUi } from '../store/ui'

const tabs = [
  { id: '/', label: '首页', icon: <House size={20} strokeWidth={2} /> },
  { id: '/stats', label: '统计', icon: <ChartPie size={20} strokeWidth={2} /> },
  { id: '/settings', label: '设置', icon: <Settings size={20} strokeWidth={2} /> },
]

export default function BottomNav() {
  const openForm = useUi((s) => s.openForm)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeItem =
    tabs.find((t) => (t.id === '/' ? pathname === '/' : pathname.startsWith(t.id)))?.id ?? '/'

  return (
    <>
      <LiquidGlassNav
        items={tabs}
        activeItem={activeItem}
        onItemChange={(id) => navigate(id)}
        activeColor="var(--accent-ink)"
        inactiveColor="var(--ink-faint)"
        style={{
          zIndex: 40,
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          background: 'color-mix(in srgb, var(--surface) 65%, transparent)',
          boxShadow:
            '0 8px 32px rgba(15, 23, 42, 0.12), inset 0 0 0 1px color-mix(in srgb, var(--line) 85%, transparent)',
        }}
      />

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