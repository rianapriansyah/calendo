import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth } from './authContext'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack alignItems="center" gap={1}>
          <CircularProgress size={24} />
          <Typography color="text.secondary">Checking session…</Typography>
        </Stack>
      </Box>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
