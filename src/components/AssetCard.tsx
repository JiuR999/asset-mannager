import { Link } from 'react-router'
import { activeDays, dailyCost, fmtDaily, fmtMoney } from '../lib/cost'
import { useData } from '../store/data'
import type { Asset } from '../types'
import Thumb from './Thumb'

export default function AssetCard({ asset }: { asset: Asset }) {
  const cat = useData((s) => s.db.categories.find((c) => c.id === asset.categoryId))
  const retired = !!asset.retiredAt

  return (
    <Link
      to={`/asset/${asset.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-neutral-200/60 transition active:scale-[0.98]"
    >
      <Thumb asset={asset} className="size-12" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[15px] font-medium">{asset.name}</span>
          {retired && (
            <span className="shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-400">已退役</span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-neutral-400">
          {cat?.name ?? '未分类'} · {retired ? `服役 ${activeDays(asset)} 天` : `已用 ${activeDays(asset)} 天`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`text-[15px] font-semibold ${retired ? 'text-neutral-400' : 'text-rose-600'}`}>
          {fmtDaily(dailyCost(asset))}
        </div>
        <div className="text-xs text-neutral-400">{fmtMoney(asset.price)}</div>
      </div>
    </Link>
  )
}
