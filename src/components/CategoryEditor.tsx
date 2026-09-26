import { useState } from 'react'
import { X } from 'lucide-react'
import { iconComp } from '../lib/icons'
import { useData } from '../store/data'
import { toast } from '../store/toast'
import type { Category } from '../types'
import IconPicker from './IconPicker'

interface Props {
  category: Category | null
  onClose: () => void
  /** 新建成功后回调（用于自动选中） */
  onSaved?: (c: Category) => void
}

/** 新建 / 编辑分类的小弹窗（AssetForm 与设置页共用） */
export default function CategoryEditor({ category, onClose, onSaved }: Props) {
  const upsertCategory = useData((s) => s.upsertCategory)
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? 'other')
  const [saving, setSaving] = useState(false)
  const Icon = iconComp(icon)

  const submit = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const c: Category = {
        id: category?.id ?? `c_${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim(),
        icon,
      }
      await upsertCategory(c)
      onSaved?.(c)
      onClose()
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-safe sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <Icon size={18} />
            </span>
            <h3 className="text-base font-semibold">{category ? '编辑分类' : '新建分类'}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="分类名称，如：首饰"
          maxLength={10}
          className="mb-4 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
        />

        <div className="mb-5 max-h-64 overflow-y-auto">
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <button
          onClick={submit}
          disabled={!name.trim() || saving}
          className="w-full rounded-xl bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  )
}
