import { create } from 'zustand'
import { api, ApiError } from '../lib/client'
import { blobToBase64, compressImage, imageFileName } from '../lib/image'
import { DEFAULT_CATEGORIES } from '../lib/icons'
import { useAuth } from './auth'
import { toast } from './toast'
import type { Asset, Category, Db, GuestUser } from '../types'

function emptyDb(): Db {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    assets: [],
  }
}

/** 兼容旧数据：分类为空时填充默认分类 */
function ensureDefaults(db: Db): Db {
  if (db.categories?.length) return db
  return { ...db, categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })) }
}

interface DataState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  /** 仓库是否已初始化 */
  repoReady: boolean
  /** 当前数据文件夹（空间）名 */
  space: string
  db: Db
  sha: string | null
  sync: 'synced' | 'saving' | 'error'
  load: (space?: string) => Promise<void>
  retrySync: () => Promise<void>
  initRepo: () => Promise<void>
  listSpaces: () => Promise<string[]>
  listUsers: () => Promise<{ repo: GuestUser[]; env: { name: string; code: string }[] }>
  saveUsers: (users: GuestUser[]) => Promise<void>
  saveAsset: (
    input: Partial<Asset> & {
      name: string
      price: number
      purchaseDate: string
      photoFile?: File | null
    },
  ) => Promise<Asset>
  removeAsset: (id: string) => Promise<void>
  upsertCategory: (c: Category) => Promise<void>
  removeCategory: (id: string) => Promise<void>
  reset: () => void
}

async function persistDb(db: Db, sha: string | null, space: string): Promise<{ sha: string | null; db: Db }> {
  const payload: Db = { ...db, updatedAt: new Date().toISOString() }
  const res = await api<{ sha: string | null; data: Db }>(`/api/data?user=${encodeURIComponent(space)}`, {
    method: 'PUT',
    json: { data: payload, sha },
  })
  return { sha: res.sha, db: ensureDefaults(res.data) }
}

export const useData = create<DataState>((set, get) => ({
  status: 'idle',
  error: null,
  repoReady: true,
  space: '',
  db: emptyDb(),
  sha: null,
  sync: 'synced',

  load: async (space) => {
    const s = space ?? get().space
    if (!s) return
    set({ status: 'loading', error: null, space: s })
    try {
      const res = await api<{ repo: boolean; sha: string | null; data: Db | null }>(
        `/api/data?user=${encodeURIComponent(s)}`,
      )
      if (!res.repo) {
        set({ status: 'ready', repoReady: false })
        return
      }
      let db = res.data ? ensureDefaults(res.data) : emptyDb()
      let sha = res.sha
      if (!res.data) {
        // 首次使用：写入默认结构
        const r = await persistDb(db, null, s)
        sha = r.sha
        db = r.db
      }
      set({ status: 'ready', repoReady: true, db, sha, sync: 'synced' })
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        useAuth.getState().logout()
        toast('登录已失效，请重新登录', 'error')
        return
      }
      set({ status: 'error', error: e instanceof Error ? e.message : '加载失败' })
    }
  },

  retrySync: async () => {
    const { db, sha, space } = get()
    set({ sync: 'saving' })
    try {
      const r = await persistDb(db, sha, space)
      set({ db: r.db, sha: r.sha, sync: 'synced' })
    } catch {
      set({ sync: 'error' })
    }
  },

  initRepo: async () => {
    const { space } = get()
    await api('/api/init', { method: 'POST', json: { user: space } })
    await get().load(space)
  },

  listSpaces: () => api<{ spaces: string[] }>('/api/spaces').then((r) => r.spaces),

  listUsers: () =>
    api<{ repo: GuestUser[]; env: { name: string; code: string }[] }>('/api/users'),

  saveUsers: (users) => api('/api/users', { method: 'PUT', json: { users } }),

  saveAsset: async (input) => {
    const { db, space } = get()
    const now = new Date().toISOString()

    let photo = input.photo ?? null
    if (input.photoFile) {
      const blob = await compressImage(input.photoFile)
      const name = await imageFileName(blob)
      const content = await blobToBase64(blob)
      await api(`/api/image?user=${encodeURIComponent(space)}`, {
        method: 'POST',
        json: { name, content },
      })
      photo = `images/${name}`
    }

    const existing = input.id ? db.assets.find((a) => a.id === input.id) : undefined
    const asset: Asset = {
      id: existing?.id ?? crypto.randomUUID(),
      name: input.name,
      categoryId: input.categoryId ?? null,
      icon: input.icon ?? null,
      photo,
      price: input.price,
      purchaseDate: input.purchaseDate,
      note: input.note ?? '',
      retiredAt: input.retiredAt ?? existing?.retiredAt ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    // 换图后清理旧图（best-effort）
    if (existing?.photo && existing.photo !== photo) {
      api(`/api/image?user=${encodeURIComponent(space)}&name=${encodeURIComponent(existing.photo.replace(/^images\//, ''))}`, {
        method: 'DELETE',
        json: {},
      }).catch(() => {})
    }

    const next: Db = {
      ...db,
      assets: existing ? db.assets.map((a) => (a.id === asset.id ? asset : a)) : [asset, ...db.assets],
    }
    set({ db: next, sync: 'saving' })
    try {
      const r = await persistDb(next, get().sha, space)
      set({ db: r.db, sha: r.sha, sync: 'synced' })
    } catch (e) {
      set({ sync: 'error' })
      throw e
    }
    return asset
  },

  removeAsset: async (id) => {
    const { db, space } = get()
    const target = db.assets.find((a) => a.id === id)
    const next: Db = { ...db, assets: db.assets.filter((a) => a.id !== id) }
    set({ db: next, sync: 'saving' })
    try {
      const r = await persistDb(next, get().sha, space)
      set({ db: r.db, sha: r.sha, sync: 'synced' })
    } catch (e) {
      set({ sync: 'error' })
      throw e
    }
    if (target?.photo) {
      api(`/api/image?user=${encodeURIComponent(space)}&name=${encodeURIComponent(target.photo.replace(/^images\//, ''))}`, {
        method: 'DELETE',
        json: {},
      }).catch(() => {})
    }
  },

  upsertCategory: async (c) => {
    const { db, space } = get()
    const exists = db.categories.some((x) => x.id === c.id)
    const next: Db = {
      ...db,
      categories: exists ? db.categories.map((x) => (x.id === c.id ? c : x)) : [...db.categories, c],
    }
    set({ db: next, sync: 'saving' })
    try {
      const r = await persistDb(next, get().sha, space)
      set({ db: r.db, sha: r.sha, sync: 'synced' })
    } catch (e) {
      set({ sync: 'error' })
      throw e
    }
  },

  removeCategory: async (id) => {
    const { db, space } = get()
    if (db.assets.some((a) => a.categoryId === id)) {
      throw new Error('该分类下仍有资产，无法删除')
    }
    const next: Db = { ...db, categories: db.categories.filter((c) => c.id !== id) }
    set({ db: next, sync: 'saving' })
    try {
      const r = await persistDb(next, get().sha, space)
      set({ db: r.db, sha: r.sha, sync: 'synced' })
    } catch (e) {
      set({ sync: 'error' })
      throw e
    }
  },

  reset: () =>
    set({
      status: 'idle',
      error: null,
      repoReady: true,
      space: '',
      db: emptyDb(),
      sha: null,
      sync: 'synced',
    }),
}))
