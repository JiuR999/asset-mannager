import { useEffect, useState } from 'react'
import { useAuth } from '../store/auth'
import { imageUrl } from './client'

/** 私有仓库图片需要带 token 获取，这里取回后缓存为 objectURL */
const cache = new Map<string, string>()

export function useImageUrl(path: string | null | undefined, space: string): string | null {
  const [url, setUrl] = useState<string | null>(() => (path ? cache.get(path) ?? null : null))

  useEffect(() => {
    if (!path) {
      setUrl(null)
      return
    }
    const hit = cache.get(path)
    if (hit) {
      setUrl(hit)
      return
    }
    let alive = true
    const token = useAuth.getState().identity?.token
    fetch(imageUrl(path, space), {
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b || !alive) return
        const u = URL.createObjectURL(b)
        cache.set(path, u)
        setUrl(u)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [path, space])

  return url
}
