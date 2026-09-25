import { useEffect, useState } from 'react'
import { Check, Download, LogOut, Plus, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useData } from '../store/data'
import { useTheme, type ThemeId } from '../store/theme'
import { toast } from '../store/toast'
import { categoryColor, iconComp } from '../lib/icons'
import { todayStr } from '../lib/cost'
import FloatingBack from '../components/FloatingBack'
import CategoryEditor from '../components/CategoryEditor'
import type { Category } from '../types'

const THEMES: { id: ThemeId; label: string; desc: string; swatch: string }[] = [
  { id: 'normal', label: '普通', desc: '清透冰蓝', swatch: '#0ea5e9' },
  { id: 'glass', label: '玻璃拟态', desc: '磨砂玻璃', swatch: '#6366f1' },
  { id: 'swiss', label: '瑞士极简', desc: '黑白克制', swatch: '#0f172a' },
  { id: 'biophilic', label: '亲自然', desc: '青苔绿意', swatch: '#3f9d78' },
]

export default function Settings() {
  const identity = useAuth((s) => s.identity)!
  const logout = useAuth((s) => s.logout)
  const db = useData((s) => s.db)
  const space = useData((s) => s.space)
  const listSpaces = useData((s) => s.listSpaces)
  const load = useData((s) => s.load)
  const removeCategory = useData((s) => s.removeCategory)
  const reset = useData((s) => s.reset)
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)

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
      <FloatingBack />
      <header className="relative pb-4 pt-5">
        <h1 className="text-center text-lg font-bold">设置</h1>
      </header>

      {/* 身份 */}
      <div className="rounded-2xl bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`flex size-11 items-center justify-center rounded-2xl ${isOwner ? 'bg-ink text-white' : 'bg-accent-soft text-accent-ink'}`}>
            {isOwner ? <ShieldCheck size={22} /> : <User size={22} />}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{space}</p>
            <p className="text-xs text-ink-faint">
              {isOwner ? '主人 · GitHub 登录' : '访客'} · 数据存于私有仓库的 data/{space}/ 文件夹
            </p>
          </div>
        </div>

        {isOwner && spaces.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs text-ink-faint">切换空间（查看其他人的资产）</p>
            <div className="flex flex-wrap gap-2">
              {spaces.map((s) => (
                <button
                  key={s}
                  onClick={() => switchSpace(s)}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    s === space ? 'bg-accent text-white' : 'bg-surface-2 text-ink-soft'
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
      <div className="mt-3 rounded-2xl bg-surface p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">分类管理</h2>
          <button
            onClick={() => {
              setEditing(null)
              setEditorOpen(true)
            }}
            className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-ink"
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
                <span className="text-xs text-ink-faint">{count} 件</span>
                <button
                  onClick={() => {
                    setEditing(c)
                    setEditorOpen(true)
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-ink-faint hover:bg-surface-2"
                >
                  编辑
                </button>
                <button
                  onClick={() => {
                    if (!confirm(`删除分类「${c.name}」？`)) return
                    removeCategory(c.id).catch((e) => toast(e.message, 'error'))
                  }}
                  className="rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                >
                  删除
                </button>
              </div>
            )
          })}
          {db.categories.length === 0 && <p className="py-4 text-center text-xs text-ink-faint">暂无分类</p>}
        </div>
      </div>

      {/* 外观主题 */}
      <div className="mt-3 rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">外观主题</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {THEMES.map((t) => {
            const active = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-2xl border p-3 text-left transition ${
                  active ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="size-7 shrink-0 rounded-full border border-black/10" style={{ background: t.swatch }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-[11px] text-ink-faint">{t.desc}</p>
                  </div>
                  {active && <Check size={15} className="ml-auto shrink-0 text-accent-ink" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 数据 */}
      <div className="mt-3 space-y-2.5 rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold">数据</h2>
        <button onClick={exportJson} className="flex items-center gap-2 text-sm text-ink-soft">
          <Download size={16} className="text-ink-faint" /> 导出 JSON 备份
        </button>
        <p className="text-[11px] leading-relaxed text-ink-faint">
          所有数据实时保存在 GitHub 私有仓库中，删除 App 也不会丢失；导出仅作额外备份。
        </p>
      </div>

      {/* 退出 */}
      <button
        onClick={doLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-3 text-sm text-danger shadow-sm"
      >
        <LogOut size={15} /> 退出登录
      </button>

      <p className="mt-6 text-center text-xs text-ink-faint">颜彦彦 × 张豆豆 · 彦豆小库</p>

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