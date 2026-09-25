import { useToasts } from '../store/toast'
import { CircleAlert } from 'lucide-react'

export default function Toasts() {
  const toasts = useToasts((s) => s.toasts)
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex max-w-full items-center gap-2 rounded-full px-4 py-2 text-sm shadow-lg ${
            t.type === 'error' ? 'bg-rose-600 text-white' : 'bg-neutral-900/90 text-white'
          }`}
        >
          {t.type === 'error' && <CircleAlert size={16} />}
          <span className="truncate">{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
