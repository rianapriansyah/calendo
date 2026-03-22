import type { CalendarDate } from '../../types'

export const MS_DAY = 86_400_000

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** YYYY-MM-DD in UTC */
export function toISODateUTC(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** Local calendar YYYY-MM-DD (wall date in the user's locale, not UTC-shifted). */
export function calendarDateToISO(d: CalendarDate): string {
  return `${d.year}-${pad2(d.month)}-${pad2(d.day)}`
}

export function isoToCalendarDate(iso: string): CalendarDate {
  const [y, m, d] = iso.split('-').map(Number)
  return { year: y, month: m, day: d }
}

export function parseISODateUTC(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

export function startOfMonthUTC(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0))
}

export function endOfMonthUTC(year: number, monthIndex0: number): Date {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0, 23, 59, 59, 999))
}

/** Sunday = 0 … Saturday = 6 (UTC). */
export function weekdayIndexSunday0(d: Date): number {
  return d.getUTCDay()
}

/**
 * 6-week grid (42 cells) starting Sunday, containing the given month.
 */
export function monthGridDatesUTC(year: number, monthIndex0: number): Date[] {
  const first = startOfMonthUTC(year, monthIndex0)
  const lead = weekdayIndexSunday0(first)
  const start = new Date(first.getTime() - lead * MS_DAY)
  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getTime() + i * MS_DAY))
  }
  return cells
}

export function sameUTCDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  )
}

export function isInMonthUTC(d: Date, year: number, monthIndex0: number): boolean {
  return d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex0
}

export function formatMonthYearLabel(year: number, monthIndex0: number): string {
  return new Date(Date.UTC(year, monthIndex0, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function formatShortWeekdayUTC(d: Date): string {
  return d.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' })
}

export function addMonthsUTC(year: number, monthIndex0: number, delta: number): [number, number] {
  const d = new Date(Date.UTC(year, monthIndex0 + delta, 1))
  return [d.getUTCFullYear(), d.getUTCMonth()]
}

export function addDaysUTC(isoDate: string, delta: number): string {
  const d = parseISODateUTC(isoDate)
  d.setUTCDate(d.getUTCDate() + delta)
  return toISODateUTC(d)
}

/** Shift a local calendar YYYY-MM-DD by whole days. */
export function addDaysLocalISO(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + delta)
  return calendarDateToISO({
    year: dt.getFullYear(),
    month: dt.getMonth() + 1,
    day: dt.getDate(),
  })
}

export function addMonthsLocal(
  year: number,
  month1to12: number,
  delta: number,
): { year: number; month: number } {
  const d = new Date(year, month1to12 - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

/** Events overlapping a UTC calendar day [start, end). */
export function eventsForDayUTC<T extends { start_time: string; end_time: string }>(
  events: T[],
  dayISO: string,
): T[] {
  const dayStart = parseISODateUTC(dayISO).getTime()
  const dayEnd = dayStart + MS_DAY
  return events.filter((e) => {
    const s = new Date(e.start_time).getTime()
    const en = new Date(e.end_time).getTime()
    return s < dayEnd && en > dayStart
  })
}

export function eventsForMonthUTC<T extends { start_time: string; end_time: string }>(
  events: T[],
  year: number,
  monthIndex0: number,
): T[] {
  const rangeStart = startOfMonthUTC(year, monthIndex0).getTime()
  const rangeEnd = endOfMonthUTC(year, monthIndex0).getTime() + 1
  return events.filter((e) => {
    const s = new Date(e.start_time).getTime()
    const en = new Date(e.end_time).getTime()
    return s < rangeEnd && en > rangeStart
  })
}
