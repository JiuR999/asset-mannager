export interface Category {
  id: string
  name: string
  icon: string
}

export interface Asset {
  id: string
  name: string
  categoryId: string | null
  /** 没有照片时展示的 lucide 图标 key */
  icon: string | null
  /** 仓库内相对路径，如 images/img_xxx.webp */
  photo: string | null
  price: number
  /** YYYY-MM-DD */
  purchaseDate: string
  note: string
  /** YYYY-MM-DD，null 表示仍在使用 */
  retiredAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Db {
  version: 1
  updatedAt: string
  categories: Category[]
  assets: Asset[]
  /** 账号资料（头像指针随仓库同步，跨设备恢复） */
  profile?: { avatar?: string | null }
}

export type Identity = {
  mode: 'owner' | 'visitor'
  /** GitHub 登录名（owner）或访客名（visitor），同时作为数据文件夹名 */
  name: string
  /** GitHub access token 或 "vc:<name>:<code>" 访客凭证 */
  token: string
}

export interface GuestUser {
  name: string
  code: string
  label?: string
}

/** 已验证并保存在本机的账号（点击即切换；avatar 为本地缓存的头像路径） */
export interface SavedAccount {
  mode: 'owner' | 'visitor'
  /** GitHub 登录名（owner）或访客名（visitor），同时作为数据文件夹名 */
  name: string
  token: string
  label?: string
  avatar?: string
  savedAt: string
}
