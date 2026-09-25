import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../store/auth'
import { toast } from '../store/toast'

const CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID as string | undefined

export default function Login() {
  const setIdentity = useAuth((s) => s.setIdentity)
  const [visitorName, setVisitorName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const githubLogin = () => {
    if (!CLIENT_ID) {
      toast('未配置 GitHub OAuth（VITE_GITHUB_CLIENT_ID），可先使用访客登录', 'error')
      return
    }
    const state = crypto.randomUUID()
    sessionStorage.setItem('oauth_state', state)
    const redirect = `${location.origin}/auth/callback`
    window.location.href =
      `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}` +
      `&scope=repo&state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirect)}`
  }

  const visitorLogin = () => {
    const name = visitorName.trim()
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name)) return toast('访客名仅限字母、数字、- 和 _', 'error')
    if (!code) return toast('请输入访客码', 'error')
    setBusy(true)
    setIdentity({ mode: 'visitor', name, token: `vc:${name}:${code}` })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-rose-500 text-white shadow-lg shadow-rose-200">
          <Wallet size={40} />
        </div>
        <h1 className="text-2xl font-bold">资产管家</h1>
        <p className="mt-1 text-sm text-neutral-400">记录每一件资产，看看一天花多少钱</p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={githubLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white active:scale-[0.98]"
        >
          <svg viewBox="0 0 16 16" className="size-4 fill-current" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
          主人登录（GitHub）
        </button>

        <div className="flex items-center gap-3 text-xs text-neutral-300">
          <span className="h-px flex-1 bg-neutral-200" />
          或
          <span className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="space-y-2.5">
          <input
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            placeholder="访客名（问主人要）"
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
          />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            type="password"
            placeholder="访客码"
            className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-rose-400"
          />
          <button
            onClick={visitorLogin}
            disabled={busy}
            className="w-full rounded-xl bg-rose-500 py-3 text-sm font-medium text-white active:scale-[0.98] disabled:opacity-50"
          >
            访客登录
          </button>
        </div>
      </div>

      <p className="mt-10 max-w-xs text-center text-[11px] leading-relaxed text-neutral-300">
        数据保存在主人的 GitHub 私有仓库中，
        <br />
        每位使用者对应独立文件夹，互不可见。
      </p>
    </div>
  )
}
