import type { CalendarEvent } from '../../types'
import { layoutTimedBlocks, type TimedBlock } from '../../lib/calendar/dayViewLayout'
import { eventBlockSvg, eventPillSx } from './eventColors'
import { Box, Button, Paper, Typography, useTheme } from '@mui/material'

type Props = {
  /** Local calendar day YYYY-MM-DD (interpreted in browser local TZ). */
  dayISO: string
  events: CalendarEvent[]
  readOnly?: boolean
  onSlotClick: (start: Date, end: Date) => void
  onEventClick: (ev: CalendarEvent) => void
}

const TOTAL_MIN = 24 * 60
/** One hour row height in px — 24h grid. */
const HOUR_PX = 48
const TIMELINE_MIN_PX = 24 * HOUR_PX

function parseLocalDay(dayISO: string): Date {
  const [y, m, d] = dayISO.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function localMinutesFromDayStart(evTime: Date, dayStart: Date): number {
  return (evTime.getTime() - dayStart.getTime()) / 60_000
}

const COL_GAP_PX = 3

export function DayView({
  dayISO,
  events,
  readOnly = false,
  onSlotClick,
  onEventClick,
}: Props) {
  const theme = useTheme()
  const gridLine = theme.palette.divider
  const slotHover =
    theme.palette.mode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'

  const dayStart = parseLocalDay(dayISO)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const allDay = events.filter((e) => e.is_all_day)
  const timed = events.filter((e) => !e.is_all_day)

  const rawBlocks: TimedBlock[] = timed
    .map((e) => {
      const s = new Date(e.start_time)
      const en = new Date(e.end_time)
      const clipStart = s < dayStart ? dayStart : s
      const clipEnd = en > dayEnd ? dayEnd : en
      const startM = Math.max(0, localMinutesFromDayStart(clipStart, dayStart))
      const endM = Math.min(TOTAL_MIN, localMinutesFromDayStart(clipEnd, dayStart))
      if (endM <= startM) return null
      return { e, startM, endM }
    })
    .filter(Boolean) as TimedBlock[]

  const blocks = layoutTimedBlocks(rawBlocks)

  const hours = Array.from({ length: 24 }, (_, h) => h)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: { xs: 1, sm: 2 } }}>
      {allDay.length > 0 ? (
        <Box
          sx={{
            mb: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'action.hover',
            px: 1.5,
            py: 1,
          }}
        >
          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ letterSpacing: 0.5 }}>
            ALL DAY
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
            {allDay.map((ev) =>
              readOnly ? (
                <Typography
                  key={ev.id}
                  variant="body2"
                  sx={{ ...eventPillSx(theme, ev.color), px: 1, py: 0.5, borderRadius: 1, fontWeight: 600 }}
                >
                  {ev.title}
                </Typography>
              ) : (
                <Button
                  key={ev.id}
                  size="small"
                  onClick={() => onEventClick(ev)}
                  sx={{
                    ...eventPillSx(theme, ev.color),
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {ev.title}
                </Button>
              ),
            )}
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: { xs: 44, sm: 52 },
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            pt: 1,
            pr: 0.75,
            textAlign: 'right',
            fontSize: { xs: 10, sm: 11 },
            color: 'text.disabled',
            userSelect: 'none',
          }}
        >
          {hours.map((h) => (
            <Box key={h} sx={{ height: HOUR_PX, lineHeight: 1.1, pt: 0.25 }}>
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: TIMELINE_MIN_PX,
          }}
        >
          {hours.map((h) => (
            <Box
              key={h}
              aria-hidden
              sx={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: h * HOUR_PX,
                height: HOUR_PX,
                borderTop: `1px solid ${gridLine}`,
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }}
            />
          ))}

          {!readOnly
            ? hours.map((h) => (
                <Box
                  key={`slot-${h}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const start = new Date(dayStart.getTime() + h * 60 * 60 * 1000)
                    const end = new Date(start.getTime() + 60 * 60 * 1000)
                    onSlotClick(start, end)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      const start = new Date(dayStart.getTime() + h * 60 * 60 * 1000)
                      const end = new Date(start.getTime() + 60 * 60 * 1000)
                      onSlotClick(start, end)
                    }
                  }}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: h * HOUR_PX,
                    height: HOUR_PX,
                    cursor: 'pointer',
                    zIndex: 0,
                    '&:hover': { bgcolor: slotHover },
                  }}
                />
              ))
            : null}

          {blocks.map(({ e, startM, endM, column, numCols }) => {
            const durationMin = endM - startM
            const topPx = (startM / TOTAL_MIN) * TIMELINE_MIN_PX
            const heightPx = Math.max((durationMin / TOTAL_MIN) * TIMELINE_MIN_PX, 22)
            const { fill, stroke } = eventBlockSvg(theme, e.color)
            const totalGaps = (numCols - 1) * COL_GAP_PX
            const inner = readOnly ? (
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  border: 1,
                  borderColor: stroke,
                  bgcolor: fill,
                  borderRadius: 1,
                  overflow: 'hidden',
                  px: 0.75,
                  py: 0.5,
                  pointerEvents: 'none',
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.primary"
                  noWrap
                  title={e.title}
                  sx={{
                    display: 'block',
                    lineHeight: 1.25,
                    fontSize: '0.75rem',
                  }}
                >
                  {e.title}
                </Typography>
              </Paper>
            ) : (
              <Box
                component="button"
                type="button"
                onClick={() => onEventClick(e)}
                sx={{
                  height: '100%',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 1,
                  borderColor: stroke,
                  bgcolor: fill,
                  borderRadius: 1,
                  overflow: 'hidden',
                  px: 0.75,
                  py: 0.5,
                  m: 0,
                  font: 'inherit',
                  display: 'block',
                  transition: (t) => t.transitions.create(['filter', 'box-shadow'], { duration: 150 }),
                  '&:hover': {
                    boxShadow: 1,
                    filter:
                      theme.palette.mode === 'light' ? 'brightness(0.96)' : 'brightness(1.08)',
                  },
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.primary"
                  noWrap
                  title={e.title}
                  sx={{
                    display: 'block',
                    lineHeight: 1.25,
                    fontSize: '0.75rem',
                  }}
                >
                  {e.title}
                </Typography>
              </Box>
            )

            return (
              <Box
                key={e.id}
                sx={{
                  position: 'absolute',
                  top: topPx,
                  height: heightPx,
                  left:
                    numCols <= 1
                      ? 0
                      : `calc(${column} * ((100% - ${totalGaps}px) / ${numCols} + ${COL_GAP_PX}px))`,
                  width: numCols <= 1 ? '100%' : `calc((100% - ${totalGaps}px) / ${numCols})`,
                  zIndex: 1,
                  boxSizing: 'border-box',
                  px: 0.25,
                }}
              >
                {inner}
              </Box>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
