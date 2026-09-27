import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { LoaderCircle, RefreshCw } from 'lucide-react'
import { useAuth } from './store/auth'
import { useData } from './store/data'
import { useTheme, type ThemeId } from './store/theme'
import { deriveAccent, deriveGlassBg } from './lib/color'
import { toast } from './store/toast'
import type { Identity } from './types'
import Toasts from './components/Toasts'
import BottomNav from './components/BottomNav'
import AssetForm from './components/AssetForm'
import Login from './pages/Login'
import OAuthCallback from './pages/OAuthCallback'
import Home from './pages/Home'
import AssetDetail from './pages/AssetDetail'
import Settings from './pages/Settings'

const Stats = lazy(() => import('./pages/Stats'))

const THEME_META: Record<ThemeId, string> = {
  normal: '#0ea5e9',
  glass: '#6366f1',
  liquid: '#6366f1',
  swiss: '#0f172a',
  biophilic: '#3f9d78',
  softmed: '#0891b2',
  epaper: '#fdfbf7',
}

const ACCENT_VARS = ['--accent', '--accent-2', '--accent-soft', '--accent-ink', '--hero-from', '--hero-to']

/** 玻璃背景渐变变量（玻璃拟态 / 液态玻璃主题自定义配色时派生） */
const GLASS_BG_VARS = ['--glass-blob-1', '--glass-blob-2', '--glass-blob-3', '--glass-base-1', '--glass-base-2']

export default function App() {
  const theme = useTheme((s) => s.theme)
  const customAccent = useTheme((s) => s.customAccent)
  const radiusScale = useTheme((s) => s.radiusScale)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.setProperty('--radius-scale', String(radiusScale))
    const meta = document.querySelector('meta[name="theme-color"]')

    if ((theme === 'normal' || theme === 'glass' || theme === 'liquid') && customAccent) {
      const p = deriveAccent(customAccent)
      root.style.setProperty('--accent', p.accent)
      root.style.setProperty('--accent-2', p.accent2)
      root.style.setProperty('--accent-soft', p.accentSoft)
      root.style.setProperty('--accent-ink', p.accentInk)
      root.style.setProperty('--hero-from', p.heroFrom)
      root.style.setProperty('--hero-to', p.heroTo)
      if (theme === 'glass' || theme === 'liquid') {
        const bg = deriveGlassBg(customAccent)
        root.style.setProperty('--glass-blob-1', bg.blob1)
        root.style.setProperty('--glass-blob-2', bg.blob2)
        root.style.setProperty('--glass-blob-3', bg.blob3)
        root.style.setProperty('--glass-base-1', bg.base1)
        root.style.setProperty('--glass-base-2', bg.base2)
      } else {
        GLASS_BG_VARS.forEach((v) => root.style.removeProperty(v))
      }
      meta?.setAttribute('content', p.accent)
    } else {
      ACCENT_VARS.forEach((v) => root.style.removeProperty(v))
      GLASS_BG_VARS.forEach((v) => root.style.removeProperty(v))
      meta?.setAttribute('content', THEME_META[theme] ?? THEME_META.normal)
    }
  }, [theme, customAccent, radiusScale])

  return (
    <BrowserRouter>
      <Root />
      <Toasts />
    </BrowserRouter>
  )
}

function Root() {
  const identity = useAuth((s) => s.identity)
  const { pathname } = useLocation()

  if (pathname === '/auth/callback') return <OAuthCallback />
  if (!identity) return <Login />
  return <Shell identity={identity} />
}

function Shell({ identity }: { identity: Identity }) {
  const status = useData((s) => s.status)
  const error = useData((s) => s.error)
  const repoReady = useData((s) => s.repoReady)
  const initRepo = useData((s) => s.initRepo)
  const load = useData((s) => s.load)
  const isOwner = identity.mode === 'owner'

  useEffect(() => {
    load(identity.name)
  }, [identity, load])

  if (status === 'loading') {
    return (
      <div className="flex min-h-dvh items-center justify-center text-accent">
        <LoaderCircle size={30} className="animate-spin" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-ink-soft">{error ?? '加载失败'}</p>
        <button onClick={() => load(identity.name)} className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm text-white">
          <RefreshCw size={14} /> 重试
        </button>
      </div>
    )
  }

  if (!repoReady) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm leading-relaxed text-ink-soft">
          {isOwner ? (
            <>
              数据仓库还不存在。
              <br />
              点击下方按钮在你的 GitHub 账号下自动创建私有仓库。
            </>
          ) : (
            <>
              主人还没有完成初始化，
              <br />
              请联系主人先登录一次。
            </>
          )}
        </p>
        {isOwner && (
          <button
            onClick={() => initRepo().catch((e) => toast(e instanceof Error ? e.message : '初始化失败', 'error'))}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            初始化数据仓库
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<FullSpinner />}>
              <Stats />
            </Suspense>
          }
        />
        <Route path="/asset/:id" element={<AssetDetail />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <AssetForm />
    </>
  )
}

function FullSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-accent">
      <LoaderCircle size={30} className="animate-spin" />
    </div>
  )
}
