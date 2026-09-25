import { Check } from 'lucide-react'
import { ICON_KEYS, iconComp } from '../lib/icons'

interface Props {
  value: string | null
  onChange: (key: string) => void
}

export default function IconPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {ICON_KEYS.map((key) => {
        const Icon = iconComp(key)
        const selected = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex aspect-square items-center justify-center rounded-xl border transition ${
              selected ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-neutral-200 bg-white text-neutral-500'
            }`}
          >
            <Icon size={20} />
            {selected && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-white">
                <Check size={10} strokeWidth={3} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
