import { NavLink, useNavigate } from 'react-router'
import { ChartPie, House, Plus, Settings } from 'lucide-react'
import { useUi } from '../store/ui'

const tabs = [
  { to: '/', icon: House, label: '首页' },
  { to: '/stats', icon: ChartPie, label: '统计' },
] as const

export default function BottomNav() {
  const openForm = useUi((s) => s.openForm)
  const navigate = useNavigate()

  const item = (to: string, Icon: typeof House, label: string) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
          isActive ? 'text-rose-600' : 'text-neutral-400'
        }`
      }
    >
      <Icon size={22} strokeWidth={2} />
      {label}
    </NavLink>
  )

  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-neutral-200 bg-white/95 backdrop-blur">
      {tabs.map((t) => item(t.to, t.icon, t.label))}
      <button
        onClick={() => {
          openForm(null)
          navigate('/')
        }}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] text-neutral-400"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-rose-500 text-white shadow-md shadow-rose-200">
          <Plus size={22} strokeWidth={2.5} />
        </span>
        <span className="-mt-0.5">添加</span>
      </button>
      {item('/settings', Settings, '设置')}
    </nav>
  )
}
