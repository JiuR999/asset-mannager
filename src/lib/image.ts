/** 压缩照片：最长边 ≤ 1024，输出 WebP（不支持时退回 JPEG） */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file)
  const max = 1024
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, w, h)
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close()

  const webp = await toBlob(canvas, 'image/webp', 0.82)
  if (webp) return webp
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.85)
  if (jpeg) return jpeg
  throw new Error('图片压缩失败')
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file)
  } catch {
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('图片读取失败'))
        img.src = url
      })
      return img
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality))
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

/** 按内容哈希命名：同图同名 → 可无限缓存 */
export async function imageFileName(blob: Blob): Promise<string> {
  const ext = blob.type.includes('webp') ? 'webp' : 'jpg'
  let hex = ''
  try {
    const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
    hex = [...new Uint8Array(digest).slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    hex = Math.random().toString(16).slice(2, 14)
  }
  return `img_${hex}.${ext}`
}
