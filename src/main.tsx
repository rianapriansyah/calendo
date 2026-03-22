import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { AppThemeProvider } from './theme/AppThemeProvider'
import { router } from './routes/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </AppThemeProvider>
    </QueryProvider>
  </StrictMode>,
)
