import { useState } from 'react'
import type { CalendarEvent } from '../../types'
import {
  eventsForDayUTC,
  formatShortWeekdayUTC,
  isInMonthUTC,
  monthGridDatesUTC,
  sameUTCDate,
  toISODateUTC,
} from '../../lib/calendar/dateUtils'
import { eventPillSx } from './eventColors'
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Popover,
  Typography,
  useTheme,
} from '@mui/material'

type Props = {
  year: number
  monthIndex0: number
  events: CalendarEvent[]
  readOnly?: boolean
  onDayClick?: (isoDate: string) => void
  onEventClick: (ev: CalendarEvent) => void
}

type MoreState = { anchor: HTMLElement; iso: string; list: CalendarEvent[] }

export function MonthView({
  year,
  monthIndex0,
  events,
  readOnly = false,
  onDayClick,
  onEventClick,
}: Props) {
  const theme = useTheme()
  const [more, setMore] = useState<MoreState | null>(null)

  const cells = monthGridDatesUTC(year, monthIndex0)
  const today = new Date()
  const weekLabels = cells.slice(0, 7)

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 1,
          mb: 1,
        }}
      >
        {weekLabels.map((d) => (
          <Typography
            key={toISODateUTC(d)}
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            textAlign="center"
          >
            {formatShortWeekdayUTC(d)}
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'divider',
        }}
      >
        {cells.map((d) => {
          const iso = toISODateUTC(d)
          const inMonth = isInMonthUTC(d, year, monthIndex0)
          const dayEvents = eventsForDayUTC(events, iso).sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
          )
          const isToday = sameUTCDate(d, today)
          const shown = dayEvents.slice(0, 3)
          const moreCount = dayEvents.length - shown.length

          return (
            <Box
              key={iso}
              sx={{
                position: 'relative',
                minHeight: '5.5rem',
                bgcolor: inMonth ? 'background.paper' : 'action.hover',
                p: 0.5,
              }}
            >
              {readOnly ? (
                <Box
                  sx={{
                    mb: 0.5,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    ...(isToday
                      ? { bgcolor: 'primary.main', color: 'primary.contrastText' }
                      : {
                          color: inMonth ? 'text.primary' : 'text.disabled',
                        }),
                  }}
                >
                  {d.getUTCDate()}
                </Box>
              ) : (
                <IconButton
                  size="small"
                  onClick={() => onDayClick?.(iso)}
                  sx={{
                    mb: 0.5,
                    width: 24,
                    height: 24,
                    p: 0,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    ...(isToday
                      ? {
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          '&:hover': { bgcolor: 'primary.dark' },
                        }
                      : {
                          color: inMonth ? 'text.primary' : 'text.disabled',
                        }),
                  }}
                >
                  {d.getUTCDate()}
                </IconButton>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {shown.map((ev) =>
                  readOnly ? (
                    <Typography
                      key={ev.id}
                      variant="caption"
                      noWrap
                      sx={{
                        ...eventPillSx(theme, ev.color),
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontWeight: 600,
                      }}
                    >
                      {ev.title}
                    </Typography>
                  ) : (
                    <Button
                      key={ev.id}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEventClick(ev)
                      }}
                      sx={{
                        ...eventPillSx(theme, ev.color),
                        minHeight: 0,
                        py: 0.25,
                        px: 0.5,
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        fontSize: '10px',
                        fontWeight: 600,
                        lineHeight: 1.2,
                      }}
                    >
                      <Typography variant="caption" noWrap component="span" sx={{ fontWeight: 600 }}>
                        {ev.title}
                      </Typography>
                    </Button>
                  ),
                )}
                {moreCount > 0 ? (
                  <Box sx={{ position: 'relative' }}>
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMore((prev) =>
                          prev?.iso === iso ? null : { anchor: e.currentTarget, iso, list: dayEvents },
                        )
                      }}
                      sx={{ minHeight: 0, p: 0, fontSize: '10px', fontWeight: 600, textTransform: 'none' }}
                    >
                      +{moreCount} more
                    </Button>
                    <Popover
                      open={more?.iso === iso}
                      anchorEl={more?.iso === iso ? more.anchor : null}
                      onClose={() => setMore(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 1.5, maxHeight: 224, width: 208, overflow: 'auto' }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {iso}
                        </Typography>
                        <List dense disablePadding>
                          {more?.iso === iso
                            ? more.list.map((ev) =>
                                readOnly ? (
                                  <ListItem key={ev.id} disablePadding sx={{ mb: 0.5 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        ...eventPillSx(theme, ev.color),
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        width: '100%',
                                      }}
                                    >
                                      {ev.title}
                                    </Typography>
                                  </ListItem>
                                ) : (
                                  <ListItem key={ev.id} disablePadding sx={{ mb: 0.5 }}>
                                    <ListItemButton
                                      dense
                                      onClick={() => {
                                        onEventClick(ev)
                                        setMore(null)
                                      }}
                                      sx={{ ...eventPillSx(theme, ev.color), borderRadius: 1, py: 0.5 }}
                                    >
                                      <Typography variant="body2" noWrap>
                                        {ev.title}
                                      </Typography>
                                    </ListItemButton>
                                  </ListItem>
                                ),
                              )
                            : null}
                        </List>
                      </Box>
                    </Popover>
                  </Box>
                ) : null}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
