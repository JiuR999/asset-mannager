import { ShieldCheck } from 'lucide-react'
import { useImageUrl } from '../lib/useImage'

interface Props {
  /** 账号名（数据文件夹名），用于拼图片地址与首字母回退 */
  name: string
  /** 头像仓库路径（images/img_xxx.webp），空则回退到首字母 / 盾标 */
  avatar?: string | null
  isOwner?: boolean
  /** 直径 px */
  size?: number
  className?: string
}

/** 账号头像：有图显示图片（私有图需带 token 经 useImageUrl 获取，失败自动回退），无图回退到首字母（主人回退到盾标） */
export default function Avatar({ name, avatar, isOwner, size = 40, className = '' }: Props) {
  const url = useImageUrl(avatar, name)
  const style = { width: size, height: size }

  if (avatar && url) {
    return (
      <img
        src={url}
        alt={name}
        draggable={false}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    )
  }
  if (isOwner) {
    return (
      <span
        style={style}
        className={`flex shrink-0 items-center justify-center rounded-full bg-ink text-white ${className}`}
      >
        <ShieldCheck size={Math.round(size * 0.48)} />
      </span>
    )
  }
  return (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.42) }}
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-ink ${className}`}
    >
      {(name[0] ?? '?').toUpperCase()}
    </span>
  )
}
