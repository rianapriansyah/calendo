import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import { useAuth } from '../components/auth/authContext'
import { useProfileQuery } from '../hooks/useProfile'
import { needsOnboarding } from '../lib/profile/onboarding'

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { session, user, loading: authLoading } = useAuth()
  const location = useLocation()
  const token = session?.access_token ?? ''
  const userId = user?.id ?? ''

  const profileQuery = useProfileQuery({
    userId,
    accessToken: token,
    enabled: !authLoading && Boolean(userId && token),
  })

  if (authLoading) {
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

  if (!session || !token) {
    return null
  }

  if (profileQuery.isLoading) {
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
          <Typography color="text.secondary">Loading profile…</Typography>
        </Stack>
      </Box>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Box
        sx={{
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2,
          textAlign: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Typography>We couldn&apos;t load your profile.</Typography>
        <Typography variant="body2" color="text.secondary">
          Try signing out and back in.
        </Typography>
      </Box>
    )
  }

  const profile = profileQuery.data
  const need = needsOnboarding(profile)
  if (need && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }
  if (!need && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
