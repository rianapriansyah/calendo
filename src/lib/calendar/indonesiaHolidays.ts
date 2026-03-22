import Holidays from 'date-holidays'
import { ID_COLLECTIVE_LEAVE } from './idCollectiveLeave'

let hd: Holidays | null = null

function getHolidays(): Holidays {
  if (!hd) {
    hd = new Holidays('ID', { languages: ['id', 'en'] })
  }
  return hd
}

/** Sunday = 0, Saturday = 6 — matches month grid (`monthGridDatesUTC`). */
export function isUtcWeekend(d: Date): boolean {
  const w = d.getUTCDay()
  return w === 0 || w === 6
}

/** Weekend for a local wall date `YYYY-MM-DD` (day view). */
export function isLocalWeekendFromDayISO(dayISO: string): boolean {
  const [y, m, d] = dayISO.split('-').map(Number)
  if (!y || !m || !d) return false
  const dt = new Date(y, m - 1, d)
  const w = dt.getDay()
  return w === 0 || w === 6
}

/**
 * National / religious holidays from `date-holidays`, or cuti bersama from static map.
 * `iso` is civil calendar `YYYY-MM-DD` (same as grid cell / day view).
 */
export function getIndonesiaHolidayLabel(iso: string): string | null {
  const rows = getHolidays().isHoliday(iso)
  if (rows && rows.length > 0) {
    const preferred =
      rows.find((h) => h.type === 'public') ||
      rows.find((h) => h.type === 'bank') ||
      rows[0]
    return preferred.name
  }
  return ID_COLLECTIVE_LEAVE[iso] ?? null
}

/** Red calendar number: weekend (UTC grid) or libur / cuti — not applied when `isToday`. */
export function isIndonesiaRedDayInGrid(d: Date, iso: string, isToday: boolean): boolean {
  if (isToday) return false
  if (isUtcWeekend(d)) return true
  return getIndonesiaHolidayLabel(iso) != null
}
