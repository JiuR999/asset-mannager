import { useMemo, useRef, useState } from 'react'
import { Camera, ImagePlus, LoaderCircle, Trash, X } from 'lucide-react'
import { useData } from '../store/data'
import { useUi } from '../store/ui'
import { toast } from '../store/toast'
import { todayStr } from '../lib/cost'
import { iconComp } from '../lib/icons'
import type { Asset } from '../types'
import IconPicker from './IconPicker'
import CategoryEditor from './CategoryEditor'
import { categoryColor } from '../lib/icons'

export default function AssetForm() {
  const open = useUi((s) => s.assetFormOpen)
  const editingId = useUi((s) => s.editingId)
  const closeForm = useUi((s) => s.closeForm)
  const db = useData((s) => s.db)
  const saveAsset = useData((s) => s.saveAsset)
  const removeAsset = useData((s) => s.removeAsset)

  const editing = useMemo<Asset | undefined>(
    () => (editingId ? db.assets.find((a) => a.id === editingId) : undefined),
    [editingId, db.assets],
  )

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayStr())
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [icon, setIcon] = useState('other')
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [catEditor, setCatEditor] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const albumRef = useRef<HTMLInputElement>(null)

  // 打开时同步编辑数据
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (open && editing && loadedId !== editing.id) {
    setLoadedId(editing.id)
    setName(editing.name)
    setPrice(String(editing.price))
    setPurchaseDate(editing.purchaseDate)
    setCategoryId(editing.categoryId)
    setIcon(editing.icon ?? 'other')
    setPhoto(editing.photo)
    setPhotoFile(null)
    setNote(editing.note ?? '')
  }
  if (open && !editing && loadedId !== null) {
    setLoadedId(null)
    setName('')
    setPrice('')
    setPurchaseDate(todayStr())
    setCategoryId(null)
    setIcon('other')
    setPhoto(null)
    setPhotoFile(null)
    setNote('')
  }
  if (!open) return null

  const Icon = iconComp(icon)

  const pickPhoto = (file: File | undefined) => {
    if (!file) return
    setPhotoFile(file)
    setPhoto(URL.createObjectURL(file))
  }

  const submit = async () => {
    const p = Number(price)
    if (!name.trim()) return toast('请填写名称', 'error')
    if (!Number.isFinite(p) || p <= 0) return toast('请填写有效金额', 'error')
    setSaving(true)
    try {
      await saveAsset({
        id: editing?.id,
        name: name.trim(),
        price: p,
        purchaseDate,
        categoryId,
        icon,
        photo: photoFile ? undefined : photo,
        photoFile,
        note: note.trim(),
      })
      toast(editing ? '已保存' : '已添加')
      closeForm()
    } catch (e) {
      toast(e instanceof Error ? e.message : '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!editing) return
    if (!confirm(`确定删除「${editing.name}」吗？`)) return
    try {
      await removeAsset(editing.id)
      toast('已删除')
      closeForm()
    } catch (e) {
      toast(e instanceof Error ? e.message : '删除失败', 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={closeForm}>
      <div
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-white sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-base font-semibold">{editing ? '编辑资产' : '添加资产'}</h3>
          <button onClick={closeForm} className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {/* 照片 / 图标 */}
          <div className="flex gap-3">
            <div className="relative size-20 shrink-0">
              {photo ? (
                <img src={photo} alt="" className="size-20 rounded-2xl object-cover" />
              ) : (
                <div className={`flex size-20 items-center justify-center rounded-2xl ${categoryColor(categoryId ?? '?')}`}>
                  <Icon size={32} />
                </div>
              )}
              {photo && (
                <button
                  onClick={() => {
                    setPhoto(null)
                    setPhotoFile(null)
                  }}
                  className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-neutral-900/80 text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                <Camera size={14} /> 拍照
              </button>
              <button
                onClick={() => albumRef.current?.click()}
                className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700"
              >
                <ImagePlus size={14} /> 从相册选择
              </button>
              <span className="text-[11px] text-neutral-400">不拍照也可用左侧图标</span>
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
            <input ref={albumRef} type="file" accept="image/*" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
          </div>

          {/* 名称 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：iPhone 15"
              maxLength={30}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
            />
          </div>

          {/* 金额 + 日期 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">金额（元）</label>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="5999"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">购买日期</label>
              <input
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                type="date"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* 分类 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">分类</label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setCategoryId(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                  categoryId === null ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                未分类
              </button>
              {db.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                    categoryId === c.id ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <button
                onClick={() => setCatEditor(true)}
                className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-xs text-rose-600"
              >
                ＋ 新建
              </button>
            </div>
          </div>

          {/* 图标 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">图标 {photo && '（已拍照，图标作备用）'}</label>
            <div className="max-h-36 overflow-y-auto pr-1">
              <IconPicker value={icon} onChange={setIcon} />
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={200}
              placeholder="选填"
              className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
            />
          </div>

          {editing && (
            <button onClick={del} className="flex items-center gap-1.5 text-sm text-rose-600">
              <Trash size={15} /> 删除该资产
            </button>
          )}
        </div>

        <div className="pb-safe px-5 pb-4 pt-1">
          <button
            onClick={submit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving && <LoaderCircle size={16} className="animate-spin" />}
            {saving ? '保存中…' : editing ? '保存修改' : '添加'}
          </button>
        </div>
      </div>

      {catEditor && (
        <CategoryEditor
          category={null}
          onSaved={(c) => setCategoryId(c.id)}
          onClose={() => setCatEditor(false)}
        />
      )}
    </div>
  )
}
