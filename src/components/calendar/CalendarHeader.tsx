import { Stack, Button, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { CalendarView } from '../../types'

type Props = {
  view: CalendarView
  onViewChange: (v: CalendarView) => void
  periodLabel: string
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onCreateClick: () => void
  readOnly?: boolean
}

const VIEWS: CalendarView[] = ['year', 'month', 'day']

export function CalendarHeader({
  view,
  onViewChange,
  periodLabel,
  onPrev,
  onNext,
  onToday,
  onCreateClick,
  readOnly = false,
}: Props) {
  return (
    <Stack
      component="header"
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      spacing={1.5}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        px: 2,
        py: 1.5,
      }}
    >
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Button variant="outlined" size="small" onClick={onPrev} aria-label="Previous period">
          ←
        </Button>
        <Button variant="outlined" size="small" onClick={onNext} aria-label="Next period">
          →
        </Button>
        <Button variant="outlined" size="small" onClick={onToday}>
          Today
        </Button>
        <Typography variant="h6" component="h2" sx={{ minWidth: '10rem', ml: { sm: 1 } }}>
          {periodLabel}
        </Typography>
      </Stack>

      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          onChange={(_, v: CalendarView | null) => v && onViewChange(v)}
          aria-label="Calendar view"
        >
          {VIEWS.map((v) => (
            <ToggleButton key={v} value={v} sx={{ textTransform: 'capitalize' }}>
              {v}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {!readOnly ? (
          <Button variant="contained" color="primary" size="medium" onClick={onCreateClick}>
            New event
          </Button>
        ) : null}
      </Stack>
    </Stack>
  )
}
