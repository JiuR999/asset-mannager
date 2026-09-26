import { useMemo, useState } from 'react'
import { ArchiveRestore, CalendarDays, Pencil } from 'lucide-react'
import { Navigate, useParams } from 'react-router'
import { useData } from '../store/data'
import { useUi } from '../store/ui'
import { toast } from '../store/toast'
import { activeDays, dailyCost, fmtDaily, fmtMoney, todayStr } from '../lib/cost'
import { categoryColor, iconComp } from '../lib/icons'
import Thumb from '../components/Thumb'
import FloatingBack from '../components/FloatingBack'

export default function AssetDetail() {
  const { id } = useParams()
  const db = useData((s) => s.db)
  const saveAsset = useData((s) => s.saveAsset)
  const openForm = useUi((s) => s.openForm)

  const [retiring, setRetiring] = useState(false)
  const [retireDate, setRetireDate] = useState(todayStr())

  const asset = useMemo(() => db.assets.find((a) => a.id === id), [db.assets, id])
  if (!asset) return <Navigate to="/" replace />

  const cat = db.categories.find((c) => c.id === asset.categoryId)
  const Icon = iconComp(asset.icon ?? cat?.icon)
  const retired = !!asset.retiredAt
  const days = activeDays(asset)

  const retire = async () => {
    try {
      await saveAsset({ ...asset, retiredAt: retireDate || todayStr() })
      toast('已标记退役')
      setRetiring(false)
    } catch (e) {
      toast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  const restore = async () => {
    try {
      await saveAsset({ ...asset, retiredAt: null })
      toast('已恢复在用')
    } catch (e) {
      toast(e instanceof Error ? e.message : '操作失败', 'error')
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-16 pt-safe">
      <FloatingBack />
      <header className="flex items-center justify-end pb-4 pt-4">
        <button
          onClick={() => openForm(asset.id)}
          className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs text-ink-soft"
        >
          <Pencil size={13} /> 编辑
        </button>
      </header>

      {/* 大图 */}
      {asset.photo ? (
        <Thumb asset={asset} className="aspect-[4/3] w-full" iconSize={64} />
      ) : (
        <div className={`flex aspect-[4/3] w-full items-center justify-center rounded-3xl ${categoryColor(asset.categoryId ?? '?')}`}>
          <Icon size={72} />
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <h1 className="text-xl font-bold">{asset.name}</h1>
        {retired && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-ink-faint">已退役</span>}
        {cat && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent-ink">{cat.name}</span>}
      </div>

      {/* 核心数字 */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
        <Stat label={retired ? '服役日均' : '日均成本'} value={fmtDaily(dailyCost(asset))} accent />
        <Stat label={retired ? '服役天数' : '已用天数'} value={`${days} 天`} />
        <Stat label="金额" value={fmtMoney(asset.price)} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-faint">
        <CalendarDays size={13} />
        购买于 {asset.purchaseDate}
        {retired && ` · 退役于 ${asset.retiredAt}`}
      </div>

      {retired && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm text-ink-soft">
          这件资产陪伴了 <span className="font-semibold text-ink">{days}</span> 天，
          总价值 <span className="font-semibold text-ink">{fmtMoney(asset.price)}</span>，
          折合每天 <span className="font-semibold text-ink">{fmtDaily(dailyCost(asset))}</span>。
        </div>
      )}

      {asset.note && (
        <div className="mt-4 rounded-2xl bg-surface p-4 text-sm text-ink-soft shadow-sm">
          {asset.note}
        </div>
      )}

      {/* 操作 */}
      <div className="mt-6">
        {retired ? (
          <button
            onClick={restore}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface py-3 text-sm font-medium text-ink"
          >
            <ArchiveRestore size={16} /> 恢复在用
          </button>
        ) : (
          <button
            onClick={() => {
              setRetireDate(todayStr())
              setRetiring(true)
            }}
            className="w-full rounded-xl border border-line bg-surface py-3 text-sm font-medium text-ink"
          >
            已出坑？标记退役
          </button>
        )}
      </div>

      {/* 退役弹层 */}
      {retiring && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setRetiring(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-surface p-5 pb-safe sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-1 text-base font-semibold">标记退役</h3>
            <p className="mb-4 text-xs text-ink-faint">选择处置日期（卖出/送人/报废），之后不再计入每日成本。</p>
            <input
              value={retireDate}
              onChange={(e) => setRetireDate(e.target.value)}
              type="date"
              className="mb-4 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <button onClick={() => setRetiring(false)} className="flex-1 rounded-xl bg-surface-2 py-3 text-sm text-ink-soft">
                取消
              </button>
              <button onClick={retire} className="flex-1 rounded-xl bg-accent py-3 text-sm font-medium text-white">
                确认退役
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? 'bg-accent-soft' : 'bg-surface shadow-sm'}`}>
      <div className={`text-lg font-bold ${accent ? 'text-accent-ink' : 'text-ink'}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-faint">{label}</div>
    </div>
  )
}
