import { useContext } from 'react'
import { ThemeModeContext } from './themeContext'

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within AppThemeProvider')
  }
  return ctx
}
