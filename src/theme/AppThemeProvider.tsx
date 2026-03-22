import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeModeContext, STORAGE_KEY, type ThemeModePreference } from './themeContext'

function readStoredPreference(): ThemeModePreference {
  if (typeof window === 'undefined') return 'system'
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'light' || v === 'dark' || v === 'system') return v
  return 'system'
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemeModePreference>(readStoredPreference)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

  const resolvedMode: 'light' | 'dark' =
    preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, preference)
  }, [preference])

  const setPreference = useCallback((m: ThemeModePreference) => {
    setPreferenceState(m)
    localStorage.setItem(STORAGE_KEY, m)
  }, [])

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: resolvedMode,
          primary: { main: resolvedMode === 'dark' ? '#e4e4e7' : '#18181b' },
          secondary: { main: '#3b82f6' },
          background: {
            default: resolvedMode === 'dark' ? '#0a0a0b' : '#fafafa',
            paper: resolvedMode === 'dark' ? '#141416' : '#ffffff',
          },
        },
        shape: { borderRadius: 10 },
        typography: {
          fontFamily: [
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
        },
        components: {
          MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { textTransform: 'none' } },
          },
        },
      }),
    [resolvedMode],
  )

  const value = useMemo(
    () => ({ preference, setPreference, resolvedMode }),
    [preference, setPreference, resolvedMode],
  )

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
