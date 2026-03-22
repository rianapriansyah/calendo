import { useLayoutEffect, useMemo } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { Alert, Box, Button, Link, Stack, Typography } from '@mui/material'
import type { CalendarEvent } from '../../types'
import { useAuth } from '../auth/authContext'
import {
  calendarNavigationRef,
  useCalendarStore,
} from '../../store/calendarStore'
import {
  parseCalendarUrl,
  toSearchParams,
  type ParsedCalendarUrl,
} from '../../lib/calendar/calendarUrl'
import {
  calendarDateToISO,
  formatMonthYearLabel,
  isoToCalendarDate,
} from '../../lib/calendar/dateUtils'
import {
  useOwnerEventsQuery,
  usePublicMonthEventsQuery,
  usePublicYearEventsQueries,
} from '../../hooks/useCalendarEvents'
import { Skeleton } from '../ui/Skeleton'
import { ThemeModeToggle } from '../theme/ThemeModeToggle'
import { CalendarHeader } from './CalendarHeader'
import { DayView } from './DayView'
import { EventModal } from '../events/EventModal'
import { MonthView } from './MonthView'
import { YearView } from './YearView'

type Props = {
  readOnly: boolean
  accessToken: string | null
  userId: string | null
  publicUsername?: string
  headerTitle?: string
  showSignupBanner?: boolean
}

export function CalendarShell({
  readOnly,
  accessToken,
  userId,
  publicUsername,
  headerTitle = 'Calendo',
  showSignupBanner = false,
}: Props) {
  const { signOut } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  useLayoutEffect(() => {
    calendarNavigationRef.current = (params) => {
      setSearchParams(params, { replace: true })
    }
    return () => {
      calendarNavigationRef.current = null
    }
  }, [setSearchParams])

  useLayoutEffect(() => {
    const p = parseCalendarUrl(searchParams)
    useCalendarStore.getState().hydrateFromParsed(p)
  }, [searchParams])

  const {
    view,
    focused,
    dayISO,
    isEventModalOpen,
    selectedEventId,
    selectedDate,
    createRange,
  } = useCalendarStore(
    useShallow((s) => ({
      view: s.view,
      focused: s.focused,
      dayISO: s.dayISO,
      isEventModalOpen: s.isEventModalOpen,
      selectedEventId: s.selectedEventId,
      selectedDate: s.selectedDate,
      createRange: s.createRange,
    })),
  )

  const goToPrev = useCalendarStore((s) => s.goToPrev)
  const goToNext = useCalendarStore((s) => s.goToNext)
  const goToToday = useCalendarStore((s) => s.goToToday)
  const setView = useCalendarStore((s) => s.setView)
  const openCreateEvent = useCalendarStore((s) => s.openCreateEvent)
  const openEditEvent = useCalendarStore((s) => s.openEditEvent)
  const closeEventModal = useCalendarStore((s) => s.closeEventModal)

  const year = focused.year
  const month = focused.month
  const monthIndex0 = month - 1

  const ownerQuery = useOwnerEventsQuery({
    userId: userId ?? '',
    accessToken: accessToken ?? '',
    view,
    year,
    month,
    dayISO,
    enabled: !readOnly && Boolean(userId && accessToken),
  })

  const publicYearQueries = usePublicYearEventsQueries({
    username: publicUsername ?? '',
    year,
    enabled: readOnly && Boolean(publicUsername) && view === 'year',
  })

  const publicMonthQuery = usePublicMonthEventsQuery({
    username: publicUsername ?? '',
    year,
    month,
    enabled: readOnly && Boolean(publicUsername) && view !== 'year',
  })

  const events: CalendarEvent[] = useMemo(() => {
    if (!readOnly) return ownerQuery.data ?? []
    if (view === 'year') {
      return publicYearQueries.flatMap((q) => q.data ?? [])
    }
    return publicMonthQuery.data ?? []
  }, [readOnly, ownerQuery.data, publicYearQueries, publicMonthQuery.data, view])

  const loading =
    !readOnly && ownerQuery.isLoading
      ? true
      : readOnly && view === 'year'
        ? publicYearQueries.some((q) => q.isLoading)
        : readOnly
          ? publicMonthQuery.isLoading
          : false

  const error =
    !readOnly && ownerQuery.isError
      ? ownerQuery.error
      : readOnly && view === 'year'
        ? publicYearQueries.find((q) => q.isError)?.error
        : readOnly
          ? publicMonthQuery.error
          : null

  const periodLabel = useMemo(() => {
    if (view === 'year') return String(year)
    if (view === 'month') return formatMonthYearLabel(year, monthIndex0)
    return new Date(dayISO + 'T12:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }, [view, year, monthIndex0, dayISO])

  function navigateTo(p: ParsedCalendarUrl) {
    setSearchParams(toSearchParams(p), { replace: true })
  }

  const editing: CalendarEvent | null = useMemo(() => {
    if (!selectedEventId) return null
    return events.find((e) => e.id === selectedEventId) ?? null
  }, [events, selectedEventId])

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default', color: 'text.primary' }}>
      {showSignupBanner ? (
        <Alert
          severity="warning"
          icon={false}
          sx={{
            borderRadius: 0,
            justifyContent: 'center',
            '& .MuiAlert-message': { textAlign: 'center', width: '100%' },
          }}
        >
          <Link component={RouterLink} to="/signup" fontWeight={600}>
            Sign up to create your own calendar →
          </Link>
        </Alert>
      ) : null}

      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: 2,
          py: 1.5,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          sx={{ maxWidth: 1152, mx: 'auto' }}
        >
          <Link
            component={RouterLink}
            to={readOnly ? '/login' : '/dashboard'}
            variant="h6"
            underline="none"
            color="inherit"
            fontWeight={600}
          >
            {headerTitle}
          </Link>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
            <ThemeModeToggle />
            {!readOnly ? (
              <>
                <Button component={RouterLink} to="/settings" size="small" color="inherit">
                  Settings
                </Button>
                <Button size="small" color="inherit" onClick={() => signOut()}>
                  Sign out
                </Button>
              </>
            ) : null}
          </Stack>
        </Stack>
      </Box>

      <CalendarHeader
        view={view}
        onViewChange={setView}
        periodLabel={periodLabel}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onCreateClick={() => openCreateEvent()}
        readOnly={readOnly}
      />

      <Box component="main" sx={{ maxWidth: 1152, mx: 'auto' }}>
        {loading ? (
          <Stack spacing={1.5} sx={{ p: 3 }}>
            <Skeleton height={32} width={192} />
            <Skeleton height={256} sx={{ width: '100%' }} />
          </Stack>
        ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error" role="alert">
              {error instanceof Error ? error.message : 'Failed to load events'}
            </Typography>
          </Box>
        ) : (
          <>
            {events.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ px: 2, pt: 2 }}>
                {view === 'day'
                  ? 'Nothing scheduled this day.'
                  : view === 'year'
                    ? 'No events this year.'
                    : 'No events this month.'}
                {!readOnly && view === 'month' ? ' Click “New event” or a day to add one.' : ''}
              </Typography>
            ) : null}
            {view === 'year' ? (
              <YearView
                year={year}
                events={events}
                onSelectMonth={(yy, mi) => {
                  navigateTo({
                    view: 'month',
                    year: yy,
                    month: mi + 1,
                    dayISO: calendarDateToISO({ year: yy, month: mi + 1, day: 1 }),
                    focused: { year: yy, month: mi + 1, day: 1 },
                  })
                }}
                onSelectDay={(iso) => {
                  const f = isoToCalendarDate(iso)
                  navigateTo({
                    view: 'day',
                    year: f.year,
                    month: f.month,
                    dayISO: iso,
                    focused: f,
                  })
                }}
              />
            ) : view === 'month' ? (
              <MonthView
                year={year}
                monthIndex0={monthIndex0}
                events={events}
                readOnly={readOnly}
                onDayClick={
                  readOnly
                    ? undefined
                    : (iso) => {
                        openCreateEvent(iso)
                      }
                }
                onEventClick={(ev) => openEditEvent(ev.id)}
              />
            ) : (
              <DayView
                dayISO={dayISO}
                events={events}
                readOnly={readOnly}
                onSlotClick={(start, end) => openCreateEvent(undefined, { start, end })}
                onEventClick={(ev) => openEditEvent(ev.id)}
              />
            )}
          </>
        )}
      </Box>

      {!readOnly && accessToken ? (
        <EventModal
          open={isEventModalOpen}
          onClose={closeEventModal}
          accessToken={accessToken}
          initial={editing}
          defaultRange={createRange ?? undefined}
          selectedDate={selectedDate}
        />
      ) : null}
    </Box>
  )
}
