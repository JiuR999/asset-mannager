import { useData } from '../store/data'
import { useImageUrl } from '../lib/useImage'
import { categoryColor, iconComp } from '../lib/icons'
import type { Asset } from '../types'
import { LoaderCircle } from 'lucide-react'

interface Props {
  asset: Asset
  className?: string
  iconSize?: number
}

/** 资产缩略图：有照片显示照片，否则显示分类/自定义图标 */
export default function Thumb({ asset, className = '', iconSize = 22 }: Props) {
  const space = useData((s) => s.space)
  const url = useImageUrl(asset.photo, space)
  const cat = useData((s) => s.db.categories.find((c) => c.id === asset.categoryId))
  const Icon = iconComp(asset.icon ?? cat?.icon)

  if (asset.photo) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-neutral-100 ${className}`}>
        {url ? (
          <img src={url} alt={asset.name} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-300">
            <LoaderCircle size={16} className="animate-spin" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-xl ${categoryColor(asset.categoryId ?? '?')} ${className}`}>
      <Icon size={iconSize} />
    </div>
  )
}
