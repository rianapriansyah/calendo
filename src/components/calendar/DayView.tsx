import type { CalendarEvent } from '../../types'
import { eventBlockSvg, eventPillSx } from './eventColors'
import { Box, Button, Typography, useTheme } from '@mui/material'

type Props = {
  /** Local calendar day YYYY-MM-DD (interpreted in browser local TZ). */
  dayISO: string
  events: CalendarEvent[]
  readOnly?: boolean
  onSlotClick: (start: Date, end: Date) => void
  onEventClick: (ev: CalendarEvent) => void
}

const TOTAL_MIN = 24 * 60
const VB_W = 100
const VB_H = TOTAL_MIN

function parseLocalDay(dayISO: string): Date {
  const [y, m, d] = dayISO.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

function localMinutesFromDayStart(evTime: Date, dayStart: Date): number {
  return (evTime.getTime() - dayStart.getTime()) / 60_000
}

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
  const textFill = theme.palette.text.primary

  const dayStart = parseLocalDay(dayISO)
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const allDay = events.filter((e) => e.is_all_day)
  const timed = events.filter((e) => !e.is_all_day)

  const blocks = timed
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
    .filter(Boolean) as { e: CalendarEvent; startM: number; endM: number }[]

  const hours = Array.from({ length: 24 }, (_, h) => h)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', p: 2 }}>
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

      <Box sx={{ display: 'flex', border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Box
          sx={{
            width: 48,
            flexShrink: 0,
            borderRight: 1,
            borderColor: 'divider',
            pt: 1,
            pr: 1,
            textAlign: 'right',
            fontSize: 11,
            color: 'text.disabled',
          }}
        >
          {hours.map((h) => (
            <Box key={h} sx={{ height: 48, lineHeight: 1 }}>
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </Box>
          ))}
        </Box>
        <Box sx={{ position: 'relative', flex: 1, minHeight: 1152 }}>
          <Box
            component="svg"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            role="img"
            aria-label="Day timeline"
          >
            {hours.map((h) => (
              <line
                key={h}
                x1="0"
                y1={h * 60}
                x2={VB_W}
                y2={h * 60}
                stroke={gridLine}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {!readOnly
              ? hours.map((h) => (
                  <rect
                    key={`slot-${h}`}
                    x="0"
                    y={h * 60}
                    width={VB_W}
                    height={60}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const start = new Date(dayStart.getTime() + h * 60 * 60 * 1000)
                      const end = new Date(start.getTime() + 60 * 60 * 1000)
                      onSlotClick(start, end)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.setAttribute('fill', slotHover)
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.setAttribute('fill', 'transparent')
                    }}
                  />
                ))
              : null}
            {blocks.map(({ e, startM, endM }) => {
              const h = Math.max(endM - startM, 20)
              const { fill, stroke } = eventBlockSvg(theme, e.color)
              return (
                <g key={e.id}>
                  <rect
                    x="2"
                    y={startM}
                    width="96"
                    height={h}
                    rx={2}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    style={{ cursor: readOnly ? 'default' : 'pointer' }}
                    onClick={readOnly ? undefined : () => onEventClick(e)}
                  />
                  <text
                    x="5"
                    y={startM + 14}
                    fill={textFill}
                    style={{ fontSize: 10, fontWeight: 600, pointerEvents: 'none' }}
                  >
                    {e.title.length > 18 ? `${e.title.slice(0, 18)}…` : e.title}
                  </text>
                </g>
              )
            })}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
