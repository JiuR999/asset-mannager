import { useEffect, useState } from 'react'
import { Check, Copy, Download, LogOut, Palette, Plus, RefreshCw, ShieldCheck, Trash2, User, UserPlus } from 'lucide-react'
import { useAuth } from '../store/auth'
import { useData } from '../store/data'
import { useTheme, type ThemeId } from '../store/theme'
import { toast } from '../store/toast'
import { categoryColor, iconComp } from '../lib/icons'
import { todayStr } from '../lib/cost'
import FloatingBack from '../components/FloatingBack'
import CategoryEditor from '../components/CategoryEditor'
import type { Category, GuestUser } from '../types'

const THEMES: { id: ThemeId; label: string; desc: string; swatch: string }[] = [
  { id: 'normal', label: '普通', desc: '清透冰蓝', swatch: '#0ea5e9' },
  { id: 'glass', label: '玻璃拟态', desc: '磨砂玻璃', swatch: '#6366f1' },
  { id: 'swiss', label: '瑞士极简', desc: '黑白克制', swatch: '#0f172a' },
  { id: 'biophilic', label: '亲自然', desc: '青苔绿意', swatch: '#3f9d78' },
]

const PRESETS = ['#0ea5e9', '#06b6d4', '#2563eb', '#6366f1', '#8b5cf6', '#0d9488', '#059669', '#334155']

function genCode(len = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const a = new Uint32Array(len)
  crypto.getRandomValues(a)
  let s = ''
  for (const n of a) s += chars[n % chars.length]
  return s
}

export default function Settings() {
  const identity = useAuth((s) => s.identity)!
  const logout = useAuth((s) => s.logout)
  const db = useData((s) => s.db)
  const space = useData((s) => s.space)
  const listSpaces = useData((s) => s.listSpaces)
  const listUsers = useData((s) => s.listUsers)
  const saveUsers = useData((s) => s.saveUsers)
  const load = useData((s) => s.load)
  const removeCategory = useData((s) => s.removeCategory)
  const reset = useData((s) => s.reset)
  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)
  const customAccent = useTheme((s) => s.customAccent)
  const setCustomAccent = useTheme((s) => s.setCustomAccent)
  const navStyle = useTheme((s) => s.navStyle)
  const setNavStyle = useTheme((s) => s.setNavStyle)

  const [spaces, setSpaces] = useState<string[]>([])
  const [editing, setEditing] = useState<Category | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const [users, setUsers] = useState<{ repo: GuestUser[]; env: { name: string; code: string }[] } | null>(null)
  const [newName, setNewName] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newCode, setNewCode] = useState(() => genCode())
  const [savingUser, setSavingUser] = useState(false)

  const isOwner = identity.mode === 'owner'

  useEffect(() => {
    if (isOwner) {
      listSpaces()
        .then(setSpaces)
        .catch(() => setSpaces([]))
      listUsers()
        .then(setUsers)
        .catch(() => setUsers(null))
    }
  }, [isOwner, listSpaces, listUsers])

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

  const copyText = (text: string) => {
    if (!navigator.clipboard) return toast('复制失败（浏览器不支持）', 'error')
    navigator.clipboard.writeText(text).then(() => toast('已复制访客码'), () => toast('复制失败', 'error'))
  }

  const addUser = async () => {
    const name = newName.trim()
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name)) return toast('访客名仅限字母、数字、- 和 _', 'error')
    if (users?.repo.some((u) => u.name === name)) return toast('访客名已存在', 'error')
    setSavingUser(true)
    try {
      const next: GuestUser[] = [
        ...(users?.repo ?? []),
        { name, code: newCode, ...(newLabel.trim() ? { label: newLabel.trim() } : {}) },
      ]
      await saveUsers(next)
      setUsers({ repo: next, env: users?.env ?? [] })
      setNewName('')
      setNewLabel('')
      setNewCode(genCode())
      toast('已添加访客')
    } catch (e) {
      toast(e instanceof Error ? e.message : '添加失败', 'error')
    } finally {
      setSavingUser(false)
    }
  }

  const removeUser = async (name: string) => {
    if (!confirm(`删除访客「${name}」？其数据文件夹会被保留。`)) return
    setSavingUser(true)
    try {
      const next = (users?.repo ?? []).filter((u) => u.name !== name)
      await saveUsers(next)
      setUsers({ repo: next, env: users?.env ?? [] })
      toast('已删除访客')
    } catch (e) {
      toast(e instanceof Error ? e.message : '删除失败', 'error')
    } finally {
      setSavingUser(false)
    }
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

      {/* 外观主题 */}
      <div className="mt-3 rounded-2xl bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold">外观主题</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {THEMES.map((t) => {
            const active = theme === t.id
            const swatch = t.id === 'normal' && customAccent ? customAccent : t.swatch
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`relative rounded-2xl border p-3 text-left transition ${
                  active ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="size-7 shrink-0 rounded-full border border-black/10" style={{ background: swatch }} />
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

        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium text-ink-soft">底部导航</p>
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1 text-sm">
            {(
              [
                ['css', '轻盈拖拽'] as const,
                ['webgl', '液态玻璃'] as const,
              ]
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setNavStyle(k)}
                className={`flex-1 rounded-lg py-1.5 transition ${
                  navStyle === k ? 'bg-surface font-medium shadow-sm' : 'text-ink-soft'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {theme === 'normal' && (
          <div className="mt-3 border-t border-line pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-soft">自定义配色</p>
              {customAccent && (
                <button onClick={() => setCustomAccent(null)} className="text-xs text-accent-ink">
                  重置为清透冰蓝
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCustomAccent(c)}
                  aria-label={`配色 ${c}`}
                  className={`size-8 rounded-full border-2 transition ${
                    (customAccent ?? '#0ea5e9').toLowerCase() === c ? 'scale-110 border-ink' : 'border-transparent'
                  }`}
                  style={{ background: c }}
                />
              ))}
              <label
                className="relative flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-ink-faint bg-surface text-ink-faint"
                title="自定义取色"
              >
                <Palette size={14} />
                <input
                  type="color"
                  value={customAccent ?? '#0ea5e9'}
                  onChange={(e) => setCustomAccent(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* 访客管理（仅主人） */}
      {isOwner && (
        <div className="mt-3 rounded-2xl bg-surface p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">访客管理</h2>

          {(users?.env.length ?? 0) > 0 && (
            <p className="mb-2 text-[11px] leading-relaxed text-ink-faint">
              由环境变量 USER_CODES 配置（需重新部署才能修改）：
              {users?.env.map((u) => ` ${u.name}`).join('、') || '无'}
            </p>
          )}

          <div className="space-y-2.5 rounded-xl bg-surface-2 p-3">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="访客名（英文，作为文件夹）"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="昵称（可选，如：女朋友）"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 truncate rounded-xl bg-surface px-3 py-2.5 font-mono text-sm text-ink-soft">
                {newCode}
              </div>
              <button
                onClick={() => setNewCode(genCode())}
                className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-surface px-2.5 py-2.5 text-xs text-ink-soft"
              >
                <RefreshCw size={13} /> 换一个
              </button>
              <button
                onClick={addUser}
                disabled={savingUser}
                className="flex shrink-0 items-center gap-1 rounded-xl bg-accent px-3 py-2.5 text-xs font-medium text-white disabled:opacity-50"
              >
                <UserPlus size={14} /> 添加
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {(users?.repo ?? []).map((u) => (
              <div key={u.name} className="flex items-center gap-3 rounded-xl px-1 py-2">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{u.name}</span>
                  {u.label && <span className="ml-1.5 text-xs text-ink-faint">（{u.label}）</span>}
                  <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-ink-soft">{u.code}</span>
                </div>
                <button onClick={() => copyText(u.code)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-faint hover:bg-surface-2">
                  <Copy size={13} /> 复制
                </button>
                <button onClick={() => removeUser(u.name)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger-soft">
                  <Trash2 size={13} /> 删除
                </button>
              </div>
            ))}
            {(users?.repo ?? []).length === 0 && (users?.env.length ?? 0) === 0 && (
              <p className="py-3 text-center text-xs text-ink-faint">还没有访客，添加后把「访客名 + 访客码」发给 TA 即可登录</p>
            )}
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
            添加后无需重新部署即可生效；删除访客仅使其无法再登录，其数据文件夹仍会保留。
          </p>
        </div>
      )}

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