import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { AuthProvider } from './components/auth/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { AppThemeProvider } from './theme/AppThemeProvider'
import { router } from './routes/router'
import './index.css'

dayjs.extend(customParseFormat)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AppThemeProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </LocalizationProvider>
      </AppThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
