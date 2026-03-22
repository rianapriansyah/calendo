import { alpha } from '@mui/material/styles'
import type { SxProps, Theme } from '@mui/material/styles'
import {
  amber,
  green,
  lightBlue,
  pink,
  deepPurple,
  orange,
} from '@mui/material/colors'
import type { EventColor } from '../../types'

export const EVENT_COLOR_OPTIONS: EventColor[] = [
  'amber',
  'sage',
  'sky',
  'rose',
  'violet',
  'orange',
]

const PAL = {
  amber,
  sage: green,
  sky: lightBlue,
  rose: pink,
  violet: deepPurple,
  orange,
} as unknown as Record<EventColor, typeof amber>

export function eventDotColor(c: EventColor): string {
  return PAL[c][500]
}

/** MUI `sx` for event chips / pills in month & day views */
export function eventPillSx(theme: Theme, c: EventColor): SxProps<Theme> {
  const p = PAL[c]
  const light = theme.palette.mode === 'light'
  return {
    bgcolor: light ? p[100] : alpha(p[400], 0.22),
    color: light ? p[900] : p[50],
    border: '1px solid',
    borderColor: light ? alpha(p[800], 0.2) : alpha(p[200], 0.35),
  }
}

/** SVG block colors for day timeline */
export function eventBlockSvg(theme: Theme, c: EventColor): { fill: string; stroke: string } {
  const p = PAL[c]
  const light = theme.palette.mode === 'light'
  return {
    fill: light ? p[100] : alpha(p[500], 0.35),
    stroke: light ? p[300] : p[400],
  }
}
