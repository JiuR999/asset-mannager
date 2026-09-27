/** 电子纸 Pro：纸张背景 —— 纹理图由构建时扫描 src/assets/paper-bg/ 自动收录，纯色内置 */

export interface PaperTexture {
  /** 文件名派生键（去扩展名、去「01 」序号前缀），用于持久化与匹配 */
  id: string
  /** 设置页显示名（同 id） */
  label: string
  /** 构建后的资源 URL */
  url: string
}

/** 纸张背景选择：纹理（存文件名键）或纯色（存 hex）；null = 跟随主题默认米白 */
export type PaperBg = { type: 'texture'; id: string } | { type: 'solid'; hex: string } | null

const files = import.meta.glob('../assets/paper-bg/*.{webp,jpg,jpeg,png}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export const PAPER_TEXTURES: PaperTexture[] = Object.entries(files)
  .sort(([a], [b]) => a.localeCompare(b, 'zh'))
  .map(([path, url]) => {
    const stem = path.split('/').pop()!.replace(/\.(webp|jpe?g|png)$/i, '')
    const id = stem.replace(/^\d+[\s._-]+/, '')
    return { id, label: id, url }
  })

/** 内置纯色纸色（无需素材） */
export const PAPER_SOLIDS: { hex: string; label: string }[] = [
  { hex: '#faf7ef', label: '米白' },
  { hex: '#f7f2e7', label: '宣纸' },
  { hex: '#eef1e2', label: '豆青' },
  { hex: '#eef2f2', label: '天青' },
  { hex: '#f5ede0', label: '暖驼' },
  { hex: '#f6ece9', label: '藕荷' },
]
