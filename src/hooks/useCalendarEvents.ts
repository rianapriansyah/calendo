import { useQueries, useQuery } from '@tanstack/react-query'
import type { CalendarView } from '../types'
import { listMyEvents, listPublicEvents } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'

export function useOwnerEventsQuery(opts: {
  userId: string
  accessToken: string
  view: CalendarView
  year: number
  month: number
  dayISO: string
  enabled: boolean
}) {
  const { userId, accessToken, view, year, month, dayISO, enabled } = opts

  return useQuery({
    queryKey:
      view === 'year'
        ? queryKeys.events.userYear(userId, year)
        : view === 'month'
          ? queryKeys.events.userMonth(userId, year, month)
          : queryKeys.events.userDay(userId, year, month, dayISO),
    enabled: enabled && Boolean(accessToken),
    queryFn: async () => {
      const r = await listMyEvents(accessToken, {
        view,
        year,
        month,
        date: view === 'day' ? dayISO : undefined,
      })
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
  })
}

export function usePublicYearEventsQueries(opts: {
  username: string
  year: number
  enabled: boolean
}) {
  const { username, year, enabled } = opts
  return useQueries({
    queries: enabled
      ? Array.from({ length: 12 }, (_, mi) => ({
          queryKey: queryKeys.events.publicMonth(username, year, mi + 1),
          queryFn: async () => {
            const r = await listPublicEvents(username, year, mi + 1)
            if (!r.ok) throw new Error(r.message)
            return r.data
          },
        }))
      : [],
  })
}

export function usePublicMonthEventsQuery(opts: {
  username: string
  year: number
  month: number
  enabled: boolean
}) {
  const { username, year, month, enabled } = opts
  return useQuery({
    queryKey: queryKeys.events.publicMonth(username, year, month),
    enabled,
    queryFn: async () => {
      const r = await listPublicEvents(username, year, month)
      if (!r.ok) throw new Error(r.message)
      return r.data
    },
  })
}
