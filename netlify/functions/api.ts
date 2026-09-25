import type { Config, Context } from '@netlify/functions'

/**
 * 统一后端代理（无自建服务器，跑在 Netlify Functions 免费额度内）：
 *   POST   /api/auth    GitHub OAuth code 换 token（client secret 只在服务端）
 *   GET    /api/data    读取 assets.json（含 sha 用于并发控制）
 *   PUT    /api/data    写入 assets.json（冲突时服务端按 updatedAt 自动合并）
 *   GET    /api/image   读取私有仓库图片（内容哈希文件名，可无限缓存）
 *   POST   /api/image   上传图片（base64）
 *   DELETE /api/image   删除图片（best-effort）
 *   POST   /api/init    主人首次使用：自动创建私有数据仓库
 *   GET    /api/spaces  列出 data/ 下的空间（文件夹）
 *   GET    /api/users   列出访客（仓库 users.json + 环境变量 USER_CODES）
 *   PUT    /api/users   保存访客（主人可在 App 内直接添加/删除，无需重新部署）
 *
 * 认证：
 *   Authorization: Bearer <github_token>        → 主人（GitHub OAuth 登录）
 *   Authorization: Bearer vc:<名字>:<访客码>     → 访客（USER_CODES 环境变量 或 仓库 users.json 校验）
 *
 * 所需环境变量：
 *   DATA_REPO             数据仓库，如 "yourname/asset-data"
 *   GITHUB_CLIENT_ID      OAuth App Client ID
 *   GITHUB_CLIENT_SECRET  OAuth App Client Secret
 *   GITHUB_TOKEN          fine-grained PAT（访客模式使用，仅需 DATA_REPO 的 Contents 读写）
 *   USER_CODES            访客码表（可选），如 "girlfriend:abc123,bob:xyz"；亦可在 App 内由主人维护 users.json
 */

const GH = 'https://api.github.com'

interface Category {
  id: string
  name: string
  icon: string
}
interface Asset {
  id: string
  updatedAt: string
  [key: string]: unknown
}
interface Db {
  version: number
  updatedAt: string
  categories: Category[]
  assets: Asset[]
}
interface UserEntry {
  name: string
  code: string
  label?: string
}

const validUser = (u: string | null | undefined): boolean => !!u && /^[a-zA-Z0-9_-]{1,32}$/.test(u)
const validFile = (n: string | null | undefined): boolean => !!n && /^[\w.-]{1,80}$/.test(n)

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const env = (name: string): string | undefined => process.env[name]

function repoName(): string | null {
  const r = env('DATA_REPO')
  return r && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(r) ? r : null
}

interface Auth {
  token: string
  mode: 'owner' | 'visitor'
  user?: string
}

async function parseAuth(req: Request): Promise<{ auth?: Auth; error?: string }> {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return { error: '未登录' }

  if (token.startsWith('vc:')) {
    const rest = token.slice(3)
    const i = rest.indexOf(':')
    const name = i > 0 ? rest.slice(0, i) : ''
    const code = i > 0 ? rest.slice(i + 1) : ''
    if (!name) return { error: '访客名或访客码错误' }

    const serverToken = env('GITHUB_TOKEN')
    if (!serverToken) return { error: '服务端未配置 GITHUB_TOKEN，请联系主人完成设置' }

    // 1) 环境变量 USER_CODES
    const map = new Map<string, string>()
    for (const pair of (env('USER_CODES') ?? '').split(',')) {
      const p = pair.indexOf(':')
      if (p > 0) map.set(pair.slice(0, p).trim(), pair.slice(p + 1).trim())
    }
    if (map.get(name) === code) {
      return { auth: { token: serverToken, mode: 'visitor', user: name } }
    }

    // 2) 仓库 users.json（主人可在 App 内直接维护，无需重新部署）
    if (repoName()) {
      const users = await readUsers(serverToken)
      if (users.some((u) => u.name === name && u.code === code)) {
        return { auth: { token: serverToken, mode: 'visitor', user: name } }
      }
    }
    return { error: '访客名或访客码错误' }
  }

  return { auth: { token, mode: 'owner' } }
}

const ghHeaders = (token: string, extra?: Record<string, string>): Record<string, string> => ({
  authorization: `Bearer ${token}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'asset-tracker',
  ...extra,
})

async function gh(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(GH + path, { ...init, headers: { ...ghHeaders(token), ...(init?.headers as Record<string, string>) } })
}

function contentsBase(user?: string): string {
  return `/repos/${repoName()}/contents/data${user ? '/' + user : ''}`
}

const b64encode = (s: string): string => Buffer.from(s, 'utf8').toString('base64')
const b64decode = (s: string): string => Buffer.from(s, 'base64').toString('utf8')

function mergeDb(local: Db, remote: Db): Db {
  const byId = <T extends { id: string; updatedAt?: string }>(a: T[] | undefined, b: T[] | undefined): T[] => {
    const map = new Map<string, T>()
    for (const x of b ?? []) map.set(x.id, x)
    for (const x of a ?? []) {
      const y = map.get(x.id)
      // 本地有 updatedAt 的（资产）按时间取新；没有的（分类）本地写入优先
      if (!y || (x.updatedAt ?? '') >= (y.updatedAt ?? '')) map.set(x.id, x)
    }
    return [...map.values()]
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    categories: byId<Category>(local?.categories, remote?.categories),
    assets: byId<Asset>(local?.assets, remote?.assets),
  }
}

async function handleAuth(req: Request): Promise<Response> {
  const clientId = env('GITHUB_CLIENT_ID')
  const clientSecret = env('GITHUB_CLIENT_SECRET')
  if (!clientId || !clientSecret) return json({ error: '服务端未配置 OAuth 凭据' }, 500)

  const body = (await req.json().catch(() => null)) as { code?: string } | null
  if (!body?.code) return json({ error: '参数错误' }, 400)

  const tr = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: body.code }),
  })
  const tj = (await tr.json().catch(() => null)) as { access_token?: string } | null
  if (!tj?.access_token) return json({ error: 'OAuth 换取 token 失败，请重试' }, 401)

  const ur = await gh(tj.access_token, '/user')
  if (!ur.ok) return json({ error: '获取 GitHub 用户信息失败' }, 401)
  const uj = (await ur.json()) as { login?: string }
  return json({ token: tj.access_token, login: uj.login ?? '' })
}

async function readData(token: string, user: string): Promise<Response> {
  const r = await gh(token, `${contentsBase(user)}/assets.json`)
  if (r.ok) {
    const j = (await r.json()) as { content?: string; sha?: string }
    let data: Db | null = null
    try {
      data = JSON.parse(b64decode(j.content ?? '')) as Db
    } catch {
      data = null
    }
    return json({ repo: true, sha: j.sha ?? null, data })
  }
  if (r.status === 404) {
    const repo = await gh(token, `/repos/${repoName()}`)
    if (repo.ok) return json({ repo: true, sha: null, data: null })
    return json({ repo: false, sha: null, data: null })
  }
  if (r.status === 401) return json({ error: 'GitHub 授权无效' }, 401)
  return json({ error: `读取失败 (${r.status})` }, 502)
}

async function writeData(token: string, user: string, req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { data?: Db; sha?: string | null } | null
  const data = body?.data
  if (
    !data ||
    !Array.isArray(data.assets) ||
    !Array.isArray(data.categories) ||
    JSON.stringify(data).length > 2_000_000
  ) {
    return json({ error: '数据格式错误' }, 400)
  }
  let sha: string | null = body?.sha ?? null

  const put = async (content: Db, sha: string | null): Promise<Response> => {
    const payload: Record<string, unknown> = {
      message: `chore(data): update ${user}`,
      content: b64encode(JSON.stringify(content, null, 2)),
    }
    if (sha) payload.sha = sha
    return gh(token, `${contentsBase(user)}/assets.json`, { method: 'PUT', body: JSON.stringify(payload) })
  }

  let r = await put(data, sha)
  if (r.status === 422 || r.status === 409) {
    // 并发冲突 / 缺 sha 但文件已存在 → 取远端合并后重写一次
    const cur = await gh(token, `${contentsBase(user)}/assets.json`)
    if (cur.ok) {
      const j = (await cur.json()) as { content?: string; sha?: string }
      let remote: Db | null = null
      try {
        remote = JSON.parse(b64decode(j.content ?? '')) as Db
      } catch {
        remote = null
      }
      const merged = mergeDb(data, remote ?? data)
      r = await put(merged, j.sha ?? null)
      if (r.ok) {
        const jj = (await r.json()) as { content?: { sha?: string } }
        return json({ sha: jj.content?.sha ?? null, data: merged })
      }
    } else if (cur.status === 404) {
      r = await put(data, null)
    }
  }
  if (r.ok) {
    const j = (await r.json()) as { content?: { sha?: string } }
    return json({ sha: j.content?.sha ?? null, data })
  }
  const t = await r.text()
  return json({ error: `写入失败 (${r.status}): ${t.slice(0, 200)}` }, 502)
}

async function getImage(token: string, user: string, name: string | null): Promise<Response> {
  if (!validFile(name)) return json({ error: '参数错误' }, 400)
  const r = await gh(token, `${contentsBase(user)}/images/${name}`, {
    headers: { accept: 'application/vnd.github.raw' },
  })
  if (!r.ok) return json({ error: '图片不存在' }, 404)
  const type = name!.endsWith('.png') ? 'image/png' : name!.endsWith('.jpg') ? 'image/jpeg' : 'image/webp'
  const buf = await r.arrayBuffer()
  return new Response(buf, {
    headers: { 'content-type': type, 'cache-control': 'public, max-age=31536000, immutable' },
  })
}

async function putImage(token: string, user: string, req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { name?: string; content?: string } | null
  const name = body?.name
  const content = body?.content
  if (!validFile(name) || typeof content !== 'string' || content.length > 3_000_000) {
    return json({ error: '参数错误' }, 400)
  }
  const payload = { message: `chore(image): upload ${user}/${name}`, content }
  const r = await gh(token, `${contentsBase(user)}/images/${name}`, { method: 'PUT', body: JSON.stringify(payload) })
  if (r.ok) {
    const j = (await r.json()) as { content?: { sha?: string } }
    return json({ path: `images/${name}`, sha: j.content?.sha ?? null })
  }
  if (r.status === 422) {
    // 内容哈希命名 → 已存在即为同图，视为成功
    const cur = await gh(token, `${contentsBase(user)}/images/${name}`)
    if (cur.ok) {
      const j = (await cur.json()) as { sha?: string }
      return json({ path: `images/${name}`, sha: j.sha ?? null, exists: true })
    }
  }
  return json({ error: `图片上传失败 (${r.status})` }, 502)
}

async function deleteImage(token: string, user: string, name: string | null): Promise<Response> {
  if (!validFile(name)) return json({ error: '参数错误' }, 400)
  const cur = await gh(token, `${contentsBase(user)}/images/${name}`)
  if (cur.status === 404) return json({ ok: true })
  if (!cur.ok) return json({ error: '删除失败' }, 502)
  const j = (await cur.json()) as { sha?: string }
  const del = await gh(token, `${contentsBase(user)}/images/${name}`, {
    method: 'DELETE',
    body: JSON.stringify({ sha: j.sha }),
  })
  return json({ ok: del.ok })
}

async function handleInit(token: string, req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { user?: string } | null
  if (!validUser(body?.user)) return json({ error: '参数错误' }, 400)
  const user = body!.user!
  const repo = repoName()!.split('/')[1]

  const cr = await gh(token, '/user/repos', {
    method: 'POST',
    body: JSON.stringify({ name: repo, private: true, auto_init: false, has_issues: false, has_wiki: false, has_projects: false }),
  })
  if (!cr.ok && cr.status !== 422) {
    const t = await cr.text()
    return json({ error: `创建仓库失败 (${cr.status}): ${t.slice(0, 200)}` }, 502)
  }

  const cur = await gh(token, `${contentsBase(user)}/assets.json`)
  if (cur.ok) return json({ ok: true })

  const def: Db = { version: 1, updatedAt: new Date().toISOString(), categories: [], assets: [] }
  const pr = await gh(token, `${contentsBase(user)}/assets.json`, {
    method: 'PUT',
    body: JSON.stringify({ message: `chore(data): init ${user}`, content: b64encode(JSON.stringify(def, null, 2)) }),
  })
  if (!pr.ok) return json({ error: `初始化数据失败 (${pr.status})` }, 502)
  return json({ ok: true })
}

async function listSpaces(token: string): Promise<Response> {
  const r = await gh(token, contentsBase())
  if (!r.ok) return json({ spaces: [] })
  const j = (await r.json()) as { type?: string; name?: string }[]
  const spaces = (Array.isArray(j) ? j : []).filter((x) => x.type === 'dir').map((x) => x.name ?? '')
  return json({ spaces: spaces.filter(Boolean) })
}

async function readUsers(token: string): Promise<UserEntry[]> {
  const r = await gh(token, `/repos/${repoName()}/contents/users.json`)
  if (!r.ok) return []
  const j = (await r.json().catch(() => null)) as { content?: string } | null
  if (!j?.content) return []
  try {
    const parsed = JSON.parse(b64decode(j.content)) as { users?: UserEntry[] }
    return Array.isArray(parsed?.users) ? parsed.users : []
  } catch {
    return []
  }
}

async function writeUsers(token: string, users: UserEntry[], sha: string | null): Promise<Response> {
  const payload: Record<string, unknown> = {
    message: 'chore(users): update',
    content: b64encode(JSON.stringify({ version: 1, users }, null, 2)),
  }
  if (sha) payload.sha = sha
  return gh(token, `/repos/${repoName()}/contents/users.json`, { method: 'PUT', body: JSON.stringify(payload) })
}

async function listUsers(token: string): Promise<Response> {
  const envUsers: { name: string; code: string }[] = []
  for (const pair of (env('USER_CODES') ?? '').split(',')) {
    const p = pair.indexOf(':')
    if (p > 0) envUsers.push({ name: pair.slice(0, p).trim(), code: pair.slice(p + 1).trim() })
  }
  return json({ repo: await readUsers(token), env: envUsers })
}

async function saveUsers(token: string, req: Request): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { users?: UserEntry[] } | null
  if (!Array.isArray(body?.users)) return json({ error: '参数错误' }, 400)

  const clean: UserEntry[] = []
  for (const u of body.users) {
    const name = typeof u.name === 'string' ? u.name.trim() : ''
    const code = typeof u.code === 'string' ? u.code.trim() : ''
    const label = typeof u.label === 'string' ? u.label.trim().slice(0, 24) : ''
    if (!/^[a-zA-Z0-9_-]{1,32}$/.test(name)) return json({ error: `访客名格式错误：${name || '(空)'}` }, 400)
    if (!code || code.length > 64) return json({ error: `访客码无效：${name}` }, 400)
    clean.push({ name, code, ...(label ? { label } : {}) })
  }
  if (new Set(clean.map((u) => u.name)).size !== clean.length) return json({ error: '访客名重复' }, 400)

  const readSha = async (): Promise<string | null> => {
    const r = await gh(token, `/repos/${repoName()}/contents/users.json`)
    if (r.ok) {
      const j = (await r.json()) as { sha?: string }
      return j.sha ?? null
    }
    return null
  }

  let r = await writeUsers(token, clean, await readSha())
  if (r.status === 422 || r.status === 409) {
    r = await writeUsers(token, clean, await readSha())
  }
  if (r.ok) return json({ repo: clean })
  const t = await r.text()
  return json({ error: `保存失败 (${r.status}): ${t.slice(0, 200)}` }, 502)
}

export default async (req: Request, _ctx: Context): Promise<Response> => {
  const { pathname } = new URL(req.url)
  try {
    if (req.method === 'POST' && pathname === '/api/auth') return await handleAuth(req)

    const { auth, error } = await parseAuth(req)
    if (!auth) return json({ error: error ?? '未登录' }, 401)
    if (!repoName()) return json({ error: '服务端未配置 DATA_REPO' }, 500)

    if (pathname === '/api/data') {
      const user = new URL(req.url).searchParams.get('user')
      if (!validUser(user)) return json({ error: '参数错误' }, 400)
      const folder = auth.mode === 'visitor' ? auth.user! : user!
      if (req.method === 'GET') return await readData(auth.token, folder)
      if (req.method === 'PUT') return await writeData(auth.token, folder, req)
      return json({ error: 'Method Not Allowed' }, 405)
    }

    if (pathname === '/api/image') {
      const sp = new URL(req.url).searchParams
      const user = sp.get('user')
      if (!validUser(user)) return json({ error: '参数错误' }, 400)
      const folder = auth.mode === 'visitor' ? auth.user! : user!
      if (req.method === 'GET') return await getImage(auth.token, folder, sp.get('name'))
      if (req.method === 'POST') return await putImage(auth.token, folder, req)
      if (req.method === 'DELETE') return await deleteImage(auth.token, folder, sp.get('name'))
      return json({ error: 'Method Not Allowed' }, 405)
    }

    if (pathname === '/api/init' && req.method === 'POST') {
      if (auth.mode !== 'owner') return json({ error: '仅主人可初始化数据仓库' }, 403)
      return await handleInit(auth.token, req)
    }

    if (pathname === '/api/spaces' && req.method === 'GET') return await listSpaces(auth.token)

    if (pathname === '/api/users') {
      if (auth.mode !== 'owner') return json({ error: '仅主人可管理访客' }, 403)
      if (req.method === 'GET') return await listUsers(auth.token)
      if (req.method === 'PUT') return await saveUsers(auth.token, req)
      return json({ error: 'Method Not Allowed' }, 405)
    }

    return json({ error: 'Not Found' }, 404)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : '服务器错误' }, 500)
  }
}

export const config: Config = { path: '/api/*' }
