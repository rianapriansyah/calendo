import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness'
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'
import type { ThemeModePreference } from '../../theme/themeContext'
import { useThemeMode } from '../../theme/useThemeMode'

type Props = {
  size?: 'small' | 'medium'
  /** When true, group stretches to full width of parent (e.g. Settings). */
  fullWidth?: boolean
}

export function ThemeModeToggle({ size = 'small', fullWidth }: Props) {
  const { preference, setPreference } = useThemeMode()

  const handle = (_: unknown, next: ThemeModePreference | null) => {
    if (next != null) setPreference(next)
  }

  return (
    <ToggleButtonGroup
      value={preference}
      exclusive
      onChange={handle}
      size={size}
      fullWidth={fullWidth}
      aria-label="Color theme"
    >
      <ToggleButton value="light" aria-label="Light theme">
        <Tooltip title="Light">
          <LightModeOutlinedIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="dark" aria-label="Dark theme">
        <Tooltip title="Dark">
          <DarkModeOutlinedIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="system" aria-label="Match system">
        <Tooltip title="System">
          <SettingsBrightnessIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
