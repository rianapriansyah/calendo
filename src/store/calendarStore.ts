import { create } from 'zustand'
import type { CalendarView } from '../types'
import { calendarDateToISO, isoToCalendarDate } from '../lib/calendar/dateUtils'
import type { ParsedCalendarUrl } from '../lib/calendar/calendarUrl'
import {
  goNextPeriod,
  goPrevPeriod,
  goTodayMonth,
  toSearchParams,
} from '../lib/calendar/calendarUrl'

function todayParts() {
  const t = new Date()
  return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() }
}

const defaultDayISO = () => calendarDateToISO(todayParts())

/** Wired by `CalendarShell` so store navigation updates the URL (?view=…). */
export const calendarNavigationRef: {
  current: null | ((params: URLSearchParams) => void)
} = { current: null }

function pushUrl(p: ParsedCalendarUrl) {
  calendarNavigationRef.current?.(toSearchParams(p))
}

export interface CalendarStore {
  view: CalendarView
  setView: (view: CalendarView) => void
  focused: { year: number; month: number; day: number }
  setFocused: (date: { year: number; month: number; day: number }) => void
  dayISO: string
  setDayISO: (iso: string) => void
  hydrateFromParsed: (p: ParsedCalendarUrl) => void
  goToToday: () => void
  goToPrev: () => void
  goToNext: () => void
  isEventModalOpen: boolean
  selectedEventId: string | null
  selectedDate: string | null
  createRange: { start: Date; end: Date } | null
  openCreateEvent: (dateISO?: string, range?: { start: Date; end: Date }) => void
  openEditEvent: (eventId: string) => void
  closeEventModal: () => void
  reset: () => void
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  view: 'month',
  focused: todayParts(),
  dayISO: defaultDayISO(),
  hydrateFromParsed: (p) =>
    set({
      view: p.view,
      focused: p.focused,
      dayISO: p.dayISO,
    }),
  setView: (view) => {
    const { focused, dayISO } = get()
    const base: ParsedCalendarUrl = {
      view,
      year: focused.year,
      month: focused.month,
      dayISO,
      focused,
    }
    let next = base
    if (view === 'year') {
      next = { ...base, view: 'year', focused: { year: focused.year, month: 1, day: 1 } }
    } else if (view === 'month') {
      next = {
        ...base,
        view: 'month',
        focused: { year: focused.year, month: focused.month, day: 1 },
      }
    } else {
      next = {
        ...base,
        view: 'day',
        dayISO,
        focused: isoToCalendarDate(dayISO),
      }
    }
    pushUrl(next)
    set({
      view: next.view,
      focused: next.focused,
      dayISO: next.dayISO,
    })
  },
  setFocused: (focused) => {
    const dayISO = calendarDateToISO(focused)
    set({ focused, dayISO })
  },
  setDayISO: (dayISO) =>
    set({
      dayISO,
      focused: isoToCalendarDate(dayISO),
    }),
  goToToday: () => {
    const next = goTodayMonth()
    pushUrl(next)
    set({
      view: next.view,
      focused: next.focused,
      dayISO: next.dayISO,
    })
  },
  goToPrev: () => {
    const cur: ParsedCalendarUrl = {
      view: get().view,
      year: get().focused.year,
      month: get().focused.month,
      dayISO: get().dayISO,
      focused: get().focused,
    }
    const next = goPrevPeriod(cur)
    pushUrl(next)
    set({
      view: next.view,
      focused: next.focused,
      dayISO: next.dayISO,
    })
  },
  goToNext: () => {
    const cur: ParsedCalendarUrl = {
      view: get().view,
      year: get().focused.year,
      month: get().focused.month,
      dayISO: get().dayISO,
      focused: get().focused,
    }
    const next = goNextPeriod(cur)
    pushUrl(next)
    set({
      view: next.view,
      focused: next.focused,
      dayISO: next.dayISO,
    })
  },
  isEventModalOpen: false,
  selectedEventId: null,
  selectedDate: null,
  createRange: null,
  openCreateEvent: (dateISO, range) =>
    set({
      isEventModalOpen: true,
      selectedEventId: null,
      selectedDate: dateISO ?? null,
      createRange: range ?? null,
    }),
  openEditEvent: (eventId) =>
    set({
      isEventModalOpen: true,
      selectedEventId: eventId,
      selectedDate: null,
      createRange: null,
    }),
  closeEventModal: () =>
    set({
      isEventModalOpen: false,
      selectedEventId: null,
      selectedDate: null,
      createRange: null,
    }),
  reset: () =>
    set({
      view: 'month',
      focused: todayParts(),
      dayISO: defaultDayISO(),
      isEventModalOpen: false,
      selectedEventId: null,
      selectedDate: null,
      createRange: null,
    }),
}))
