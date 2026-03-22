import { useCallback, useState } from 'react'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  List,
  ListItem,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { CalendarEvent } from '../../types'
import {
  eventsForDayUTC,
  formatShortWeekdayUTC,
  isInMonthUTC,
  monthGridDatesUTC,
  sameUTCDate,
  toISODateUTC,
} from '../../lib/calendar/dateUtils'
import { formatEventWhen } from '../../lib/calendar/formatEventWhen'
import { useLongPress } from '../../hooks/useLongPress'
import { eventDotColor } from './eventColors'

const MAX_DOTS = 3

type Props = {
  year: number
  monthIndex0: number
  events: CalendarEvent[]
  readOnly?: boolean
  /** Narrow layout: tap anywhere on the day → day view (iOS-style). Always provide from shell. */
  onGoToDayView: (isoDate: string) => void
  /** Desktop: tap day number → create event (non–read-only only). */
  onDayClick?: (isoDate: string) => void
  /** Opens the edit modal — hold popover “Edit” on wide layout only. */
  onEventClick: (ev: CalendarEvent) => void
}

type MoreState = { anchor: HTMLElement; iso: string; list: CalendarEvent[] }

type DetailState = { ev: CalendarEvent; anchor: HTMLElement }

function EventHoldPopover({
  state,
  onClose,
  readOnly,
  onEdit,
}: {
  state: DetailState | null
  onClose: () => void
  readOnly: boolean
  onEdit: (ev: CalendarEvent) => void
}) {
  const open = Boolean(state)
  const ev = state?.ev

  return (
    <Popover
      open={open}
      anchorEl={state?.anchor ?? null}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: { maxWidth: 300, p: 2 },
        },
      }}
    >
      {ev ? (
        <>
          <Typography variant="subtitle2" fontWeight={700}>
            {ev.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {ev.description?.trim() ? ev.description : 'No description'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            {formatEventWhen(ev)}
          </Typography>
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ mt: 1.5 }}>
            {ev.is_public ? (
              <LockOpenOutlinedIcon fontSize="small" color="action" aria-hidden />
            ) : (
              <LockOutlinedIcon fontSize="small" color="action" aria-hidden />
            )}
            <Typography variant="caption" color="text.secondary">
              {ev.is_public ? 'Public on profile' : 'Private (not on public profile)'}
            </Typography>
          </Stack>
          {!readOnly ? (
            <Button size="small" variant="outlined" sx={{ mt: 2 }} onClick={() => onEdit(ev)}>
              Edit
            </Button>
          ) : null}
        </>
      ) : null}
    </Popover>
  )
}

function CompactEventRow({
  ev,
  onHold,
}: {
  ev: CalendarEvent
  onHold: (el: HTMLElement) => void
}) {
  const lp = useLongPress(onHold)

  return (
    <Box
      {...lp}
      onContextMenu={(e) => e.preventDefault()}
      title="Hold to preview"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        minHeight: 14,
        maxWidth: '100%',
        borderLeft: 3,
        borderColor: eventDotColor(ev.color),
        pl: 0.5,
        ml: 0,
        userSelect: 'none',
        touchAction: 'manipulation',
        cursor: 'default',
      }}
    >
      <Typography
        variant="caption"
        component="span"
        noWrap
        sx={{ fontSize: '0.65rem', lineHeight: 1.15, color: 'text.primary' }}
      >
        {ev.title}
      </Typography>
    </Box>
  )
}

function EventDots({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) return null
  const slice = events.slice(0, MAX_DOTS)
  const overflow = events.length > MAX_DOTS

  return (
    <Stack
      direction="row"
      justifyContent="center"
      alignItems="center"
      flexWrap="wrap"
      gap="3px"
      sx={{ mt: 0.25, minHeight: 8, maxWidth: '100%', px: 0.25 }}
    >
      {slice.map((ev) => (
        <Box
          key={ev.id}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: eventDotColor(ev.color),
          }}
        />
      ))}
      {overflow ? (
        <Typography
          component="span"
          sx={{
            fontSize: '0.55rem',
            lineHeight: 1,
            color: 'text.secondary',
            fontWeight: 700,
          }}
        >
          +
        </Typography>
      ) : null}
    </Stack>
  )
}

export function MonthView({
  year,
  monthIndex0,
  events,
  readOnly = false,
  onGoToDayView,
  onDayClick,
  onEventClick,
}: Props) {
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true })

  const [more, setMore] = useState<MoreState | null>(null)
  const [detail, setDetail] = useState<DetailState | null>(null)

  const openDetail = useCallback((ev: CalendarEvent, el: HTMLElement) => {
    setMore(null)
    setDetail({ ev, anchor: el })
  }, [])

  const closeDetail = useCallback(() => setDetail(null), [])

  const cells = monthGridDatesUTC(year, monthIndex0)
  const today = new Date()
  const weekLabels = cells.slice(0, 7)

  return (
    <Box sx={{ p: { xs: 0.5, sm: 2 } }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          borderBottom: 1,
          borderColor: 'divider',
          pb: { xs: 0.5, sm: 1 },
          mb: { xs: 0.5, sm: 1 },
          gap: { xs: 0, sm: 0 },
        }}
      >
        {weekLabels.map((d) => (
          <Typography
            key={toISODateUTC(d)}
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            textAlign="center"
            sx={{
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
              px: { xs: 0, sm: 0.5 },
            }}
          >
            {formatShortWeekdayUTC(d)}
          </Typography>
        ))}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '1px',
          border: { xs: 0, sm: 1 },
          borderColor: 'divider',
          borderRadius: { xs: 0, sm: 1 },
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

          const dayNum = (
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                fontWeight: 600,
                lineHeight: 1.1,
                width: isNarrow ? 26 : 24,
                height: isNarrow ? 26 : 24,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                ...(isToday
                  ? { bgcolor: 'primary.main', color: 'primary.contrastText' }
                  : {
                      color: inMonth ? 'text.primary' : 'text.disabled',
                    }),
              }}
            >
              {d.getUTCDate()}
            </Typography>
          )

          if (isNarrow) {
            const count = dayEvents.length
            const aria =
              count === 0
                ? `${iso}, no events. Open day`
                : `${iso}, ${count} event${count === 1 ? '' : 's'}. Open day`

            return (
              <Box
                key={iso}
                sx={{
                  bgcolor: inMonth ? 'background.paper' : 'action.hover',
                  minWidth: 0,
                }}
              >
                <ButtonBase
                  type="button"
                  onClick={() => onGoToDayView(iso)}
                  aria-label={aria}
                  focusRipple
                  sx={{
                    width: '100%',
                    minHeight: { xs: 48, sm: 52 },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    py: 0.5,
                    px: 0.25,
                    borderRadius: 0,
                    color: 'inherit',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {dayNum}
                  <EventDots events={dayEvents} />
                </ButtonBase>
              </Box>
            )
          }

          return (
            <Box
              key={iso}
              sx={{
                position: 'relative',
                minHeight: { xs: '4rem', sm: '4.25rem' },
                bgcolor: inMonth ? 'background.paper' : 'action.hover',
                p: 0.5,
                minWidth: 0,
              }}
            >
              {readOnly ? (
                <Box
                  sx={{
                    mb: 0.25,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {dayNum}
                </Box>
              ) : (
                <IconButton
                  size="small"
                  onClick={() => onDayClick?.(iso)}
                  sx={{
                    mb: 0.25,
                    width: 28,
                    height: 28,
                    p: 0,
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
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.75rem', fontWeight: 600, lineHeight: 1 }}
                  >
                    {d.getUTCDate()}
                  </Typography>
                </IconButton>
              )}
              <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                {shown.map((ev) => (
                  <CompactEventRow key={ev.id} ev={ev} onHold={(el) => openDetail(ev, el)} />
                ))}
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
                      sx={{ minHeight: 0, p: 0, fontSize: '0.65rem', fontWeight: 600, textTransform: 'none' }}
                    >
                      +{moreCount} more
                    </Button>
                    <Popover
                      open={more?.iso === iso}
                      anchorEl={more?.iso === iso ? more.anchor : null}
                      onClose={() => setMore(null)}
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    >
                      <Box sx={{ p: 1.25, maxHeight: 240, width: 220, overflow: 'auto' }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                          {iso}
                        </Typography>
                        <List dense disablePadding>
                          {more?.iso === iso
                            ? more.list.map((ev) => (
                                <ListItem key={ev.id} disablePadding sx={{ mb: 0.75, display: 'block' }}>
                                  <CompactEventRow ev={ev} onHold={(el) => openDetail(ev, el)} />
                                </ListItem>
                              ))
                            : null}
                        </List>
                      </Box>
                    </Popover>
                  </Box>
                ) : null}
              </Stack>
            </Box>
          )
        })}
      </Box>

      {!isNarrow ? (
        <EventHoldPopover
          state={detail}
          onClose={closeDetail}
          readOnly={readOnly}
          onEdit={(ev) => {
            onEventClick(ev)
            closeDetail()
          }}
        />
      ) : null}
    </Box>
  )
}
