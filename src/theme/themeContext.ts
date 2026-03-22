import { createContext } from 'react'

export const STORAGE_KEY = 'calendo-theme-mode'

export type ThemeModePreference = 'light' | 'dark' | 'system'

export type ThemeModeContextValue = {
  preference: ThemeModePreference
  setPreference: (m: ThemeModePreference) => void
  resolvedMode: 'light' | 'dark'
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)
