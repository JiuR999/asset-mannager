import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

/** 统一悬浮返回按钮（左上角圆形胶囊） */
export default function FloatingBack() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      aria-label="返回"
      className="fixed left-4 top-[max(1rem,env(safe-area-inset-top))] z-40 flex size-10 items-center justify-center rounded-full border border-line bg-surface/80 text-ink shadow-sm backdrop-blur transition-colors hover:bg-surface"
    >
      <ChevronLeft size={20} />
    </button>
  )
}