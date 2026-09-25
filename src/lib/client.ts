import { useAuth } from '../store/auth'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export async function api<T = unknown>(
  path: string,
  opts: { method?: string; json?: unknown } = {},
): Promise<T> {
  const token = useAuth.getState().identity?.token
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (token) headers.authorization = `Bearer ${token}`

  const res = await fetch(path, {
    method: opts.method ?? (opts.json != null ? 'POST' : 'GET'),
    headers,
    body: opts.json != null ? JSON.stringify(opts.json) : undefined,
  })

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`
    try {
      const j = (await res.json()) as { error?: string }
      if (j?.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg)
  }
  return (await res.json()) as T
}

export function imageUrl(path: string, space: string): string {
  const name = path.replace(/^images\//, '')
  return `/api/image?user=${encodeURIComponent(space)}&name=${encodeURIComponent(name)}`
}
