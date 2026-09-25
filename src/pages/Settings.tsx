import { useEffect, useState } from 'react'
import { Download, LogOut, Plus, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useData } from '../store/data'
import { toast } from '../store/toast'
import { categoryColor, iconComp } from '../lib/icons'
import { todayStr } from '../lib/cost'
import CategoryEditor from '../components/CategoryEditor'
import type { Category } from '../types'

export default function Settings() {
  const identity = useAuth((s) => s.identity)!
  const logout = useAuth((s) => s.logout)
  const db = useData((s) => s.db)
  const space = useData((s) => s.space)
  const listSpaces = useData((s) => s.listSpaces)
  const load = useData((s) => s.load)
  const removeCategory = useData((s) => s.removeCategory)
  const reset = useData((s) => s.reset)

  const [spaces, setSpaces] = useState<string[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const isOwner = identity.mode === 'owner'

  useEffect(() => {
    if (isOwner) {
      listSpaces()
        .then(setSpaces)
        .catch(() => setSpaces([]))
    }
  }, [isOwner, listSpaces])

  const switchSpace = (s: string) => {
    if (s === space) return
    load(s)
    toast(`已切换到空间「${s}」`)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `assets-${space}-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doLogout = () => {
    if (!confirm('确定退出登录吗？')) return
    reset()
    logout()
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-28 pt-safe">
      <header className="pb-4 pt-5">
        <h1 className="text-lg font-bold">设置</h1>
      </header>

      {/* 身份 */}
      <div className="rounded-2xl bg-white p-4 shadow-sm shadow-neutral-200/60">
        <div className="flex items-center gap-3">
          <div className={`flex size-11 items-center justify-center rounded-2xl ${isOwner ? 'bg-neutral-900 text-white' : 'bg-rose-100 text-rose-600'}`}>
            {isOwner ? <ShieldCheck size={22} /> : <User size={22} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{space}</p>
            <p className="text-xs text-neutral-400">
              {isOwner ? '主人 · GitHub 登录' : '访客'} · 数据存于私有仓库的 data/{space}/ 文件夹
            </p>
          </div>
        </div>

        {isOwner && spaces.length > 0 && (
          <div className="mt-3 border-t border-neutral-100 pt-3">
            <p className="mb-2 text-xs text-neutral-400">切换空间（查看其他人的资产）</p>
            <div className="flex flex-wrap gap-2">
              {spaces.map((s) => (
                <button
                  key={s}
                  onClick={() => switchSpace(s)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    s === space ? 'bg-rose-500 text-white' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 分类管理 */}
      <div className="mt-3 rounded-2xl bg-white p-4 shadow-sm shadow-neutral-200/60">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">分类管理</h2>
          <button
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
            className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs text-rose-600"
          >
            <Plus size={13} /> 新建分类
          </button>
        </div>
        <div className="space-y-1">
          {db.categories.map((c) => {
            const Icon = iconComp(c.icon)
            const count = db.assets.filter((a) => a.categoryId === c.id).length
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <span className={`flex size-8 items-center justify-center rounded-lg ${categoryColor(c.id)}`}>
                  <Icon size={16} />
                </span>
                <span className="flex-1 text-sm">{c.name}</span>
                <span className="text-xs text-neutral-300">{count} 件</span>
                <button
                  onClick={() => {
                    setEditing(c)
                    setEditorOpen(true)
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-neutral-400 hover:bg-neutral-50"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`删除分类「${c.name}」？`)) return
                    removeCategory(c.id).catch((e) => toast(e.message, 'error'))
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-rose-400 hover:bg-rose-50"
                >
                  删除
                </button>
              </div>
            )
          })}
          {db.categories.length === 0 && <p className="py-4 text-center text-xs text-neutral-300">暂无分类</p>}
        </div>
      </div>

      {/* 数据 */}
      <div className="mt-3 space-y-2.5 rounded-2xl bg-white p-4 shadow-sm shadow-neutral-200/60">
        <h2 className="text-sm font-semibold">数据</h2>
        <button onClick={exportJson} className="flex items-center gap-2 text-sm text-neutral-600">
          <Download size={16} className="text-neutral-400" /> 导出 JSON 备份
        </button>
        <p className="text-[11px] leading-relaxed text-neutral-300">
          所有数据实时保存在 GitHub 私有仓库中，删除 App 也不会丢失；导出仅作额外备份。
        </p>
      </div>

      {/* 退出 */}
      <button
        onClick={doLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm text-rose-600 shadow-sm shadow-neutral-200/60"
      >
        <LogOut size={15} /> 退出登录
      </button>

      {editorOpen && (
        <CategoryEditor
          category={editing}
          onClose={() => {
            setEditorOpen(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
