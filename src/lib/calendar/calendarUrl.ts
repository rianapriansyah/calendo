import type { CalendarDate, CalendarView } from '../../types'
import {
  addDaysLocalISO,
  addMonthsLocal,
  calendarDateToISO,
  isoToCalendarDate,
} from './dateUtils'

export type ParsedCalendarUrl = {
  view: CalendarView
  year: number
  month: number
  dayISO: string
  focused: CalendarDate
}

export function parseCalendarUrl(searchParams: URLSearchParams): ParsedCalendarUrl {
  const now = new Date()
  const raw = searchParams.get('view')
  const view: CalendarView =
    raw === 'year' || raw === 'day' ? raw : 'month'
  const year = Number(searchParams.get('year')) || now.getFullYear()
  const month = Number(searchParams.get('month')) || now.getMonth() + 1
  const dayISO =
    searchParams.get('date') ||
    calendarDateToISO({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    })

  const focused: CalendarDate =
    view === 'day'
      ? isoToCalendarDate(dayISO)
      : { year, month, day: 1 }

  return { view, year, month, dayISO, focused }
}

export function toSearchParams(p: ParsedCalendarUrl): URLSearchParams {
  const next = new URLSearchParams()
  next.set('view', p.view)
  if (p.view === 'year') {
    next.set('year', String(p.year))
  } else if (p.view === 'month') {
    next.set('year', String(p.year))
    next.set('month', String(p.month))
  } else {
    next.set('date', p.dayISO)
  }
  return next
}

export function goPrevPeriod(cur: ParsedCalendarUrl): ParsedCalendarUrl {
  if (cur.view === 'year') {
    return { ...cur, year: cur.year - 1, focused: { ...cur.focused, year: cur.year - 1 } }
  }
  if (cur.view === 'month') {
    const { year, month } = addMonthsLocal(cur.year, cur.month, -1)
    return { ...cur, year, month, focused: { year, month, day: 1 } }
  }
  const nextIso = addDaysLocalISO(cur.dayISO, -1)
  return {
    ...cur,
    dayISO: nextIso,
    focused: isoToCalendarDate(nextIso),
  }
}

export function goNextPeriod(cur: ParsedCalendarUrl): ParsedCalendarUrl {
  if (cur.view === 'year') {
    return { ...cur, year: cur.year + 1, focused: { ...cur.focused, year: cur.year + 1 } }
  }
  if (cur.view === 'month') {
    const { year, month } = addMonthsLocal(cur.year, cur.month, 1)
    return { ...cur, year, month, focused: { year, month, day: 1 } }
  }
  const nextIso = addDaysLocalISO(cur.dayISO, 1)
  return {
    ...cur,
    dayISO: nextIso,
    focused: isoToCalendarDate(nextIso),
  }
}

export function goTodayMonth(): ParsedCalendarUrl {
  const t = new Date()
  const year = t.getFullYear()
  const month = t.getMonth() + 1
  const dayISO = calendarDateToISO({ year, month, day: t.getDate() })
  return {
    view: 'month',
    year,
    month,
    dayISO,
    focused: { year, month, day: 1 },
  }
}
