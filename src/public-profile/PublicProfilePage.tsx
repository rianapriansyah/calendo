import { Link as RouterLink, useParams } from 'react-router-dom'
import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { CalendarShell } from '../components/calendar/CalendarShell'
import { usePublicProfileQuery } from '../hooks/useProfile'
import { Skeleton } from '../components/ui/Skeleton'

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>()
  const u = username?.trim() ?? ''

  const profileQuery = usePublicProfileQuery({ username: u, enabled: Boolean(u) })

  if (!u) {
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
          bgcolor: 'background.default',
        }}
      >
        <Typography>Missing username.</Typography>
        <Button component={RouterLink} to="/login" variant="text">
          Sign in
        </Button>
      </Box>
    )
  }

  if (profileQuery.isLoading) {
    return (
      <Box sx={{ minHeight: '100svh', bgcolor: 'background.default', p: 3 }}>
        <Stack spacing={2} sx={{ maxWidth: 1152, mx: 'auto' }}>
          <Skeleton height={40} sx={{ width: '100%' }} />
          <Skeleton height={48} sx={{ width: '100%' }} />
          <Skeleton height={384} sx={{ width: '100%' }} />
        </Stack>
      </Box>
    )
  }

  if (profileQuery.isError) {
    const err = profileQuery.error as Error & { code?: string; status?: number }
    if (err.status === 404 || err.code === 'NOT_FOUND') {
      return (
        <Box
          sx={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 2,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            Profile not found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            There is no user with this username.
          </Typography>
          <Link component={RouterLink} to="/signup" fontWeight={600}>
            Sign up to create your own calendar
          </Link>
        </Box>
      )
    }
    if (err.status === 403 || err.code === 'PRIVATE_PROFILE') {
      return (
        <Box
          sx={{
            minHeight: '100svh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            px: 2,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Typography variant="h5" fontWeight={600}>
            This profile is private
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The owner has not made this calendar public.
          </Typography>
          <Link component={RouterLink} to="/signup" fontWeight={600}>
            Sign up to create your own calendar
          </Link>
        </Box>
      )
    }
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
        <Typography>Something went wrong.</Typography>
        <Typography variant="body2" color="text.secondary">
          {err.message}
        </Typography>
      </Box>
    )
  }

  const profile = profileQuery.data!
  const title = profile.full_name.trim() || `@${profile.username}`

  return (
    <CalendarShell
      readOnly
      accessToken={null}
      userId={null}
      publicUsername={profile.username}
      headerTitle={title}
      showSignupBanner
    />
  )
}
