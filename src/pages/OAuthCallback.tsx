import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { api } from '../lib/client'
import { useAuth } from '../store/auth'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const setIdentity = useAuth((s) => s.setIdentity)
  const [error, setError] = useState<string | null>(null)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const savedState = sessionStorage.getItem('oauth_state')
    sessionStorage.removeItem('oauth_state')

    if (!code) return setError('缺少授权码，请重新登录')
    if (savedState && state !== savedState) return setError('state 校验失败，请重新登录')

    api<{ token: string; login: string }>('/api/auth', { method: 'POST', json: { code } })
      .then((r) => {
        if (!r.login) throw new Error('GitHub 账号信息为空')
        setIdentity({ mode: 'owner', name: r.login, token: r.token })
        navigate('/', { replace: true })
      })
      .catch((e) => setError(e instanceof Error ? e.message : '登录失败'))
  }, [navigate, setIdentity])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
      {error ? (
        <>
          <p className="text-sm text-rose-600">{error}</p>
          <Link to="/" className="text-sm text-neutral-500 underline">
            返回登录
          </Link>
        </>
      ) : (
        <>
          <LoaderCircle size={28} className="animate-spin text-rose-500" />
          <p className="text-sm text-neutral-500">正在登录…</p>
        </>
      )}
    </div>
  )
}
