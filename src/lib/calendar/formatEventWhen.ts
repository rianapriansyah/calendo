import type { CalendarEvent } from '../../types'

export function formatEventWhen(ev: CalendarEvent): string {
  if (ev.is_all_day) {
    const s = new Date(ev.start_time)
    return (
      s.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }) + ' · All day'
    )
  }
  const s = new Date(ev.start_time)
  const e = new Date(ev.end_time)
  const dOpts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
  return `${s.toLocaleString(undefined, dOpts)} → ${e.toLocaleString(undefined, dOpts)}`
}
