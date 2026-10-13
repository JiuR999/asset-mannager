import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Camera, LoaderCircle, Trash2, UserPlus, X } from 'lucide-react'
import { api } from '../lib/client'
import { blobToBase64, compressAvatar, imageFileName } from '../lib/image'
import { useAuth } from '../store/auth'
import { useAccounts } from '../store/accounts'
import { useData } from '../store/data'
import { toast } from '../store/toast'
import Avatar from './Avatar'
import type { SavedAccount } from '../types'

/** 切换 / 添加账号 + 更换头像弹窗（Home 头部长按或点击呼出） */
export default function AccountSwitcher({ onClose }: { onClose: () => void }) {
  const identity = useAuth((s) => s.identity)!
  const accounts = useAccounts((s) => s.accounts)
  const upsert = useAccounts((s) => s.upsert)
  const removeAccount = useAccounts((s) => s.remove)
  const saveProfile = useData((s) => s.saveProfile)

  const isOwner = identity.mode === 'owner'
  const current = accounts.find((a) => a.name === identity.name)
  // 切换列表仅展示访客账号（主人账号不支持在此切换），最近使用的在前
  const others = accounts.filter((a) => a.mode === 'visitor' && a.name !== identity.name)

  const [editing, setEditing] = useState(false)
  const [view, setView] = useState<'list' | 'add'>('list')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [highlight, setHighlight] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!highlight) return
    const t = setTimeout(() => setHighlight(null), 1600)
    return () => clearTimeout(t)
  }, [highlight])

  const switchTo = (acc: SavedAccount) => {
    if (acc.name === identity.name) return
    useAuth.getState().setIdentity({ mode: acc.mode, name: acc.name, token: acc.token })
    toast(`已切换到「${acc.label ?? acc.name}」`)
    onClose()
  }

  const verify = async () => {
    const n = name.trim()
    const c = code.trim()
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(n)) return toast('访客名仅限字母、数字、- 和 _', 'error')
    if (!c) return toast('请输入访客码', 'error')
    setVerifying(true)
    try {
      const r = await api<{ ok: boolean; label?: string }>('/api/verify', {
        method: 'POST',
        json: { name: n, code: c },
      })
      upsert({ mode: 'visitor', name: n, token: `vc:${n}:${c}`, label: r.label })
      setName('')
      setCode('')
      setView('list')
      setHighlight(n)
      toast('验证成功，已保存到账号列表')
    } catch (e) {
      toast(e instanceof Error ? e.message : '验证失败', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const deleteOldAvatar = (path: string) => {
    api(
      `/api/image?user=${encodeURIComponent(identity.name)}&name=${encodeURIComponent(path.replace(/^images\//, ''))}`,
      { method: 'DELETE', json: {} },
    ).catch(() => {})
  }

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const blob = await compressAvatar(file)
      const fileName = await imageFileName(blob)
      const content = await blobToBase64(blob)
      const res = await api<{ path: string }>(`/api/image?user=${encodeURIComponent(identity.name)}`, {
        method: 'POST',
        json: { name: fileName, content },
      })
      const old = current?.avatar
      await saveProfile(res.path)
      if (old && old !== res.path) deleteOldAvatar(old)
      toast('头像已更新')
    } catch (e) {
      toast(e instanceof Error ? e.message : '头像上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    const old = current?.avatar
    if (!old) return
    setUploading(true)
    try {
      await saveProfile(null)
      deleteOldAvatar(old)
      toast('已移除头像')
    } catch (e) {
      toast(e instanceof Error ? e.message : '移除失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const del = (acc: SavedAccount) => {
    if (!confirm(`从本机移除「${acc.label ?? acc.name}」？仅移除登录记录，不影响其数据。`)) return
    removeAccount(acc.name)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[100dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-surface p-5 pb-safe sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'add' ? (
          <>
            <div className="mb-4 flex items-center gap-2">
              <button onClick={() => setView('list')} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-2">
                <ArrowLeft size={18} />
              </button>
              <h3 className="text-base font-semibold">添加账号</h3>
            </div>
            <div className="space-y-2.5">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="访客名（英文）"
                autoCapitalize="off"
                className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                type="password"
                placeholder="访客码"
                className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button
                onClick={verify}
                disabled={verifying}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                {verifying && <LoaderCircle size={15} className="animate-spin" />}
                {verifying ? '验证中…' : '验证并保存'}
              </button>
              <p className="text-[11px] leading-relaxed text-ink-faint">
                访客名和访客码请向主人索取，验证成功后保存在本机，之后可在这里一键切换。
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">切换账号</h3>
              <div className="flex items-center gap-1">
                {others.length > 0 && (
                  <button
                    onClick={() => setEditing((v) => !v)}
                    className="rounded-full px-2.5 py-1.5 text-xs text-accent-ink hover:bg-surface-2"
                  >
                    {editing ? '完成' : '管理'}
                  </button>
                )}
                <button onClick={onClose} className="rounded-full p-1.5 text-ink-faint hover:bg-surface-2">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 当前账号 */}
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="更换头像"
                className="relative shrink-0"
              >
                <Avatar name={identity.name} avatar={current?.avatar} isOwner={isOwner} size={44} />
                <span className="absolute -bottom-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-accent text-white ring-2 ring-surface-2">
                  <Camera size={9} />
                </span>
                {uploading && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                    <LoaderCircle size={16} className="animate-spin" />
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{identity.name}</p>
                <p className="text-xs text-ink-faint">{isOwner ? '主人 · GitHub 登录' : '访客'}</p>
              </div>
              {current?.avatar && (
                <button
                  onClick={removeAvatar}
                  disabled={uploading}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs text-ink-faint hover:bg-surface"
                >
                  移除头像
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                pickAvatar(e.target.files?.[0])
                e.target.value = ''
              }}
            />

            {/* 其他账号 */}
            <div className="mt-3 space-y-1">
              {others.map((acc) => (
                <div
                  key={acc.name}
                  className={`flex items-center gap-3 rounded-xl px-2 py-2 transition ${
                    highlight === acc.name ? 'bg-accent-soft' : ''
                  }`}
                >
                  <Avatar name={acc.name} avatar={acc.avatar} size={36} />
                  <button
                    onClick={() => !editing && switchTo(acc)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium">
                      {acc.label ?? acc.name}
                      {acc.label && <span className="ml-1.5 text-xs font-normal text-ink-faint">{acc.name}</span>}
                    </p>
                  </button>
                  {editing && (
                    <button
                      onClick={() => del(acc)}
                      className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-danger hover:bg-danger-soft"
                    >
                      <Trash2 size={13} /> 移除
                    </button>
                  )}
                </div>
              ))}
              {others.length === 0 && (
                <p className="py-3 text-center text-xs text-ink-faint">还没有其他账号，点击下方添加</p>
              )}
            </div>

            {/* 添加账号 */}
            <button
              onClick={() => setView('add')}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-accent-soft py-2.5 text-sm font-medium text-accent-ink"
            >
              <UserPlus size={15} /> 添加账号
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-faint">
              头像与数据各自独立，切换后互不可见。
            </p>
          </>
        )}
      </div>
    </div>
  )
}
