import { useMemo, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { activeDays, dailyCost, fmtDaily, fmtMoney } from '../lib/cost'
import { CHART_COLORS } from '../lib/icons'
import { useData } from '../store/data'
import BottomNav from '../components/BottomNav'
import Thumb from '../components/Thumb'

type Scope = 'all' | 'active' | 'retired'

export default function Stats() {
  const db = useData((s) => s.db)
  const [scope, setScope] = useState<Scope>('all')
  const [year, setYear] = useState<string>('recent')

  const filtered = useMemo(
    () =>
      db.assets.filter((a) =>
        scope === 'all' ? true : scope === 'active' ? !a.retiredAt : !!a.retiredAt,
      ),
    [db.assets, scope],
  )

  const totalSpend = filtered.reduce((s, a) => s + a.price, 0)
  const activeCount = db.assets.filter((a) => !a.retiredAt).length
  const retiredList = db.assets.filter((a) => a.retiredAt)
  const nowDaily = db.assets.filter((a) => !a.retiredAt).reduce((s, a) => s + dailyCost(a), 0)
  const avgService = retiredList.length
    ? Math.round(retiredList.reduce((s, a) => s + activeDays(a), 0) / retiredList.length)
    : 0

  const years = useMemo(() => {
    const ys = new Set(db.assets.map((a) => a.purchaseDate.slice(0, 4)))
    return [...ys].sort().reverse()
  }, [db.assets])

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    let keys: string[]
    if (year === 'recent') {
      const now = new Date()
      keys = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      })
    } else {
      keys = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
    }
    for (const a of filtered) {
      const k = a.purchaseDate.slice(0, 7)
      if (keys.includes(k)) map.set(k, (map.get(k) ?? 0) + a.price)
    }
    return keys.map((k) => ({ month: `${Number(k.slice(5, 7))}月`, amount: map.get(k) ?? 0 }))
  }, [filtered, year])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of filtered) {
      const key = a.categoryId ?? 'none'
      map.set(key, (map.get(key) ?? 0) + a.price)
    }
    return [...map.entries()]
      .map(([id, value]) => {
        const c = db.categories.find((x) => x.id === id)
        return { name: c?.name ?? '未分类', value }
      })
      .sort((a, b) => b.value - a.value)
  }, [filtered, db.categories])

  const top = useMemo(() => {
    const arr = [...filtered]
    if (scope === 'retired') {
      return arr.sort((a, b) => activeDays(b) - activeDays(a)).slice(0, 5)
    }
    return arr.sort((a, b) => dailyCost(b) - dailyCost(a)).slice(0, 5)
  }, [filtered, scope])

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-28 pt-safe">
      <header className="pb-4 pt-5">
        <h1 className="text-lg font-bold">统计</h1>
      </header>

      {/* 范围切换 */}
      <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 text-sm">
        {(
          [
            ['all', '全部'],
            ['active', '在用'],
            ['retired', '已退役'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setScope(k)}
            className={`flex-1 rounded-lg py-1.5 transition ${scope === k ? 'bg-white font-medium shadow-sm' : 'text-neutral-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 汇总卡 */}
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-rose-50 p-4">
          <p className="text-[11px] text-rose-400">总花费（{scope === 'all' ? '全部' : scope === 'active' ? '在用' : '已退役'}）</p>
          <p className="mt-1 text-xl font-bold text-rose-600">{fmtMoney(totalSpend)}</p>
          <p className="text-[11px] text-rose-300">{filtered.length} 件资产</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-200/60">
          <p className="text-[11px] text-neutral-400">每天合计消耗</p>
          <p className="mt-1 text-xl font-bold text-neutral-800">{fmtDaily(nowDaily)}</p>
          <p className="text-[11px] text-neutral-300">在用 {activeCount} 件</p>
        </div>
      </div>

      {retiredList.length > 0 && (
        <div className="mt-2.5 rounded-2xl bg-neutral-100 p-4 text-xs leading-relaxed text-neutral-500">
          已退役 <span className="font-semibold text-neutral-800">{retiredList.length}</span> 件 · 总价值{' '}
          <span className="font-semibold text-neutral-800">{fmtMoney(retiredList.reduce((s, a) => s + a.price, 0))}</span> ·
          平均服役 <span className="font-semibold text-neutral-800">{avgService}</span> 天
        </div>
      )}

      {/* 月度趋势 */}
      <Section title="花费趋势">
        <div className="mb-3 flex justify-end">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-lg bg-neutral-100 px-2 py-1 text-xs text-neutral-600 outline-none"
          >
            <option value="recent">近 12 个月</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y} 年
              </option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a3a3a3' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              formatter={(v) => [fmtMoney(Number(v)), '花费']}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
            />
            <Bar dataKey="amount" fill="#fb7185" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </Section>

      {/* 分类占比 */}
      {byCategory.length > 0 && (
        <Section title="分类占比">
          <div className="flex items-center">
            <ResponsiveContainer width="45%" height={180}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="92%" paddingAngle={2} strokeWidth={0}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [fmtMoney(Number(v)), n as string]}
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 pl-2">
              {byCategory.slice(0, 7).map((c, i) => (
                <div key={c.name} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="flex-1 truncate text-neutral-600">{c.name}</span>
                  <span className="text-neutral-400">{Math.round((c.value / (totalSpend || 1)) * 100)}%</span>
                  <span className="w-16 text-right font-medium text-neutral-700">{fmtMoney(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* TOP 5 */}
      {top.length > 0 && (
        <Section title={scope === 'retired' ? '服役最久 TOP 5' : '日均成本 TOP 5'}>
          <div className="space-y-2">
            {top.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-neutral-200/60">
                <span className="w-4 text-center text-sm font-bold text-neutral-300">{i + 1}</span>
                <Thumb asset={a} className="size-10" iconSize={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-[11px] text-neutral-400">
                    {scope === 'retired' ? `服役 ${activeDays(a)} 天` : `已用 ${activeDays(a)} 天`} · {fmtMoney(a.price)}
                  </p>
                </div>
                {scope !== 'retired' && <span className="text-sm font-semibold text-rose-600">{fmtDaily(dailyCost(a))}/天</span>}
                {scope === 'retired' && <span className="text-sm font-semibold text-neutral-500">{activeDays(a)} 天</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      <BottomNav />
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm shadow-neutral-200/60">
      <h2 className="mb-3 text-sm font-semibold text-neutral-800">{title}</h2>
      {children}
    </div>
  )
}
