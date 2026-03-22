import type { CalendarEvent, EventColor } from '../../types'
import {
  eventsForMonthUTC,
  formatMonthYearLabel,
  monthGridDatesUTC,
  sameUTCDate,
  toISODateUTC,
} from '../../lib/calendar/dateUtils'
import { eventDotColor } from './eventColors'
import { Box, Button, Paper, useTheme } from '@mui/material'

type Props = {
  year: number
  events: CalendarEvent[]
  onSelectMonth: (year: number, monthIndex0: number) => void
  onSelectDay: (isoDate: string) => void
}

export function YearView({ year, events, onSelectMonth, onSelectDay }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(3, 1fr)',
          xl: 'repeat(4, 1fr)',
        },
        gap: 3,
        p: 2,
      }}
    >
      {Array.from({ length: 12 }, (_, m) => (
        <MiniMonth
          key={m}
          year={year}
          monthIndex0={m}
          events={eventsForMonthUTC(events, year, m)}
          label={formatMonthYearLabel(year, m)}
          onTitleClick={() => onSelectMonth(year, m)}
          onSelectDay={onSelectDay}
        />
      ))}
    </Box>
  )
}

function MiniMonth({
  year,
  monthIndex0,
  events,
  label,
  onTitleClick,
  onSelectDay,
}: {
  year: number
  monthIndex0: number
  events: CalendarEvent[]
  label: string
  onTitleClick: () => void
  onSelectDay: (iso: string) => void
}) {
  const theme = useTheme()
  const cells = monthGridDatesUTC(year, monthIndex0)
  const today = new Date()

  const dotsByDay = new Map<string, Set<EventColor>>()
  for (const e of events) {
    const start = new Date(e.start_time)
    const end = new Date(e.end_time)
    const day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
    const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
    for (let t = day.getTime(); t <= endDay.getTime(); t += 86_400_000) {
      const d = new Date(t)
      const iso = toISODateUTC(d)
      if (!dotsByDay.has(iso)) dotsByDay.set(iso, new Set())
      dotsByDay.get(iso)!.add(e.color)
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Button
        fullWidth
        onClick={onTitleClick}
        sx={{ justifyContent: 'flex-start', mb: 1, textTransform: 'none', fontWeight: 600 }}
      >
        {label}
      </Button>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          textAlign: 'center',
          fontSize: 10,
          fontWeight: 600,
          color: 'text.disabled',
          textTransform: 'uppercase',
        }}
      >
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((wd, i) => (
          <Box key={`weekday-${i}`}>{wd}</Box>
        ))}
      </Box>
      <Box
        sx={{
          mt: 0.5,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
        }}
      >
        {cells.map((d) => {
          const inMonth = d.getUTCFullYear() === year && d.getUTCMonth() === monthIndex0
          const iso = toISODateUTC(d)
          const colors = dotsByDay.get(iso)
          const isToday = sameUTCDate(d, today)
          return (
            <Button
              key={iso}
              size="small"
              onClick={() => onSelectDay(iso)}
              sx={{
                minWidth: 0,
                height: 28,
                p: 0.25,
                flexDirection: 'column',
                fontSize: 11,
                lineHeight: 1,
                color: inMonth ? 'text.primary' : 'action.disabled',
                boxShadow: isToday ? `inset 0 0 0 2px ${theme.palette.primary.main}` : 'none',
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <span>{d.getUTCDate()}</span>
              <Box
                sx={{
                  mt: 0.25,
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: '1px',
                  minHeight: 6,
                }}
              >
                {colors
                  ? Array.from(colors)
                      .slice(0, 3)
                      .map((c) => (
                        <Box
                          key={c}
                          sx={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            bgcolor: eventDotColor(c),
                          }}
                        />
                      ))
                  : null}
              </Box>
            </Button>
          )
        })}
      </Box>
    </Paper>
  )
}
