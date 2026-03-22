import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const DEFAULT_MS = 450

type PointerHandlers = {
  onPointerDown: (e: ReactPointerEvent) => void
  onPointerUp: (e: ReactPointerEvent) => void
  onPointerCancel: (e: ReactPointerEvent) => void
  onPointerLeave: (e: ReactPointerEvent) => void
}

/**
 * Fires `onLongPress` after the pointer is held on the same element for `ms` milliseconds.
 * Uses pointer capture so touch drag slightly still counts as the same target.
 */
export function useLongPress(onLongPress: (target: HTMLElement) => void, ms = DEFAULT_MS): PointerHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef<HTMLElement | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (e.button !== 0) return
      const el = e.currentTarget as HTMLElement
      activeRef.current = el
      clearTimer()
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* some environments ignore */
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        if (activeRef.current === el) {
          onLongPress(el)
        }
      }, ms)
    },
    [clearTimer, onLongPress, ms],
  )

  const end = useCallback(
    (e: ReactPointerEvent) => {
      const el = e.currentTarget as HTMLElement
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      clearTimer()
      activeRef.current = null
    },
    [clearTimer],
  )

  return {
    onPointerDown,
    onPointerUp: end,
    onPointerCancel: end,
    onPointerLeave: end,
  }
}
