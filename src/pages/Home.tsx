import { useMemo, useState, type ReactNode } from 'react'
import { CloudOff, Search } from 'lucide-react'
import { useData } from '../store/data'
import { useUi } from '../store/ui'
import { dailyCost, fmtDaily, fmtMoney, totalDaily } from '../lib/cost'
import AssetCard from '../components/AssetCard'
import BottomNav from '../components/BottomNav'

type Tab = 'active' | 'retired'
type Sort = 'daily' | 'price' | 'date'

export default function Home() {
  const db = useData((s) => s.db)
  const identityName = useData((s) => s.space)
  const sync = useData((s) => s.sync)
  const retrySync = useData((s) => s.retrySync)
  const openForm = useUi((s) => s.openForm)

  const [tab, setTab] = useState<Tab>('active')
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [sort, setSort] = useState<Sort>('daily')

  const active = useMemo(() => db.assets.filter((a) => !a.retiredAt), [db.assets])
  const sumDaily = useMemo(() => totalDaily(db.assets), [db.assets])
  const sumValue = useMemo(() => active.reduce((s, a) => s + a.price, 0), [active])

  const list = useMemo(() => {
    let arr = db.assets.filter((a) => (tab === 'active' ? !a.retiredAt : !!a.retiredAt))
    if (cat !== null) arr = arr.filter((a) => a.categoryId === cat)
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter((a) => a.name.toLowerCase().includes(q) || a.note.toLowerCase().includes(q))
    arr = [...arr].sort((a, b) => {
      if (sort === 'daily') return dailyCost(b) - dailyCost(a)
      if (sort === 'price') return b.price - a.price
      return b.purchaseDate.localeCompare(a.purchaseDate)
    })
    return arr
  }, [db.assets, tab, cat, query, sort])

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-28 pt-safe">
      {/* 顶栏 */}
      <header className="flex items-center justify-between pb-3 pt-5">
        <div>
          <h1 className="text-lg font-bold">嗨，{identityName}</h1>
          <p className="text-xs text-ink-faint">彦豆小库</p>
        </div>
        <SyncBadge sync={sync} onRetry={retrySync} />
      </header>

      {/* 总览卡 */}
      <div className="rounded-2xl bg-gradient-to-br from-hero-from to-hero-to p-4 text-white shadow-md shadow-black/10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/80">在用 {active.length} 件 · 合计 {fmtMoney(sumValue)}</p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {fmtDaily(sumDaily)}
              <span className="ml-1 text-sm font-normal text-white/80">/ 天</span>
            </p>
          </div>
          <p className="text-right text-[11px] leading-tight text-white/80">
            每天为这些
            <br />
            资产支付的钱
          </p>
        </div>
      </div>

      {/* 在用 / 已退役 */}
      <div className="mt-4 flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
        {(
          [
            ['active', `在用 (${active.length})`],
            ['retired', `已退役 (${db.assets.length - active.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg py-1.5 transition ${tab === k ? 'bg-surface font-medium shadow-sm' : 'text-ink-soft'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 搜索 + 排序 */}
      <div className="mt-3 flex gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface px-3 shadow-sm">
          <Search size={16} className="shrink-0 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索资产"
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="rounded-xl bg-surface px-2 text-xs text-ink-soft shadow-sm outline-none"
        >
          <option value="daily">按日均</option>
          <option value="price">按金额</option>
          <option value="date">按日期</option>
        </select>
      </div>

      {/* 分类筛选 */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={cat === null} onClick={() => setCat(null)}>
          全部
        </Chip>
        {db.categories.map((c) => (
          <Chip key={c.id} active={cat === c.id} onClick={() => setCat(cat === c.id ? null : c.id)}>
            {c.name}
          </Chip>
        ))}
      </div>

      {/* 列表 */}
      <div className="mt-3 space-y-2.5">
        {list.map((a) => (
          <AssetCard key={a.id} asset={a} />
        ))}
        {list.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-ink-faint">
              {tab === 'active' ? '还没有在用的资产' : '没有已退役的资产'}
            </p>
            {tab === 'active' && (
              <button
                onClick={() => openForm(null)}
                className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white"
              >
                记录第一件资产
              </button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function SyncBadge({ sync, onRetry }: { sync: string; onRetry: () => void }) {
  if (sync === 'error') {
    return (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-xs text-danger"
      >
        <CloudOff size={13} /> 同步失败·重试
      </button>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-ink-faint">
      <span className={`size-1.5 rounded-full ${sync === 'saving' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
      {sync === 'saving' ? '同步中' : '已同步'}
    </span>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
        active ? 'bg-accent text-white' : 'bg-surface text-ink-soft shadow-sm'
      }`}
    >
      {children}
    </button>
  )
}
