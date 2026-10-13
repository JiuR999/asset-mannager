import { useCallback, useRef } from 'react'

/** 长按触发（默认 500ms），带轻震反馈；返回的事件处理器需整体展开到目标元素上 */
export function useLongPress(onLongPress: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fired = useRef(false)

  const start = useCallback(() => {
    fired.current = false
    timer.current = setTimeout(() => {
      fired.current = true
      navigator.vibrate?.(10)
      onLongPress()
    }, ms)
  }, [onLongPress, ms])

  const clear = useCallback(() => {
    clearTimeout(timer.current)
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    /** 长按已触发过（可在 onClick 中用于抑制随后的点击行为） */
    didFire: () => fired.current,
  }
}
