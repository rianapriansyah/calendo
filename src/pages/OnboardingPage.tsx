import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../components/auth/authContext'
import type { Profile } from '../types'
import { getTimezoneOptions } from '../lib/timezones'
import { useCreateProfileMutation } from '../hooks/useProfileMutations'
import { useProfileQuery, useUsernameAvailableQuery } from '../hooks/useProfile'
import { needsOnboarding } from '../lib/profile/onboarding'

function OnboardingForm({
  profile,
  userId,
  token,
}: {
  profile: Profile
  userId: string
  token: string
}) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [timezone, setTimezone] = useState(profile.timezone || 'UTC')
  const [isPublic, setIsPublic] = useState(profile.is_public)
  const [error, setError] = useState<string | null>(null)

  const trimmed = username.trim()
  const availQuery = useUsernameAvailableQuery({
    accessToken: token,
    username: trimmed,
  })

  const createMut = useCreateProfileMutation(userId, token)

  const usernameHint =
    trimmed.length < 2
      ? null
      : availQuery.data
        ? availQuery.data.available
          ? 'Available'
          : 'Already taken'
        : availQuery.isError
          ? 'Could not check'
          : null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (!trimmed) {
      setError('Username is required')
      return
    }
    try {
      await createMut.mutateAsync({
        full_name: fullName.trim(),
        username: trimmed,
        timezone,
        is_public: isPublic,
      })
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const zones = getTimezoneOptions()

  return (
    <Stack component="form" spacing={2} onSubmit={onSubmit} sx={{ mt: 3 }}>
      <TextField
        label="Full name"
        required
        fullWidth
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <TextField
        label="Username"
        required
        fullWidth
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        helperText={usernameHint ?? undefined}
        error={usernameHint === 'Already taken'}
        FormHelperTextProps={{
          sx: {
            color:
              usernameHint === 'Available'
                ? 'success.main'
                : usernameHint === 'Already taken' || usernameHint === 'Could not check'
                  ? 'error.main'
                  : undefined,
          },
        }}
      />
      <FormControl fullWidth>
        <InputLabel id="onboarding-tz">Timezone</InputLabel>
        <Select
          labelId="onboarding-tz"
          label="Timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        >
          {zones.map((z) => (
            <MenuItem key={z} value={z}>
              {z}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
        label="Make my profile public"
      />
      {error ? (
        <Alert severity="error" role="alert">
          {error}
        </Alert>
      ) : null}
      <Button type="submit" variant="contained" size="large" disabled={createMut.isPending}>
        {createMut.isPending ? 'Saving…' : 'Continue to calendar'}
      </Button>
    </Stack>
  )
}

export function OnboardingPage() {
  const { session, user, loading: authLoading } = useAuth()
  const token = session?.access_token ?? null
  const userId = user?.id ?? ''

  const profileQuery = useProfileQuery({
    userId,
    accessToken: token ?? '',
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

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (profileQuery.isLoading || !profileQuery.data) {
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
          <Typography color="text.secondary">Loading…</Typography>
        </Stack>
      </Box>
    )
  }

  const profile = profileQuery.data

  if (!needsOnboarding(profile)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight={600}>
        Welcome to Calendo
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Set up your profile to continue.
      </Typography>
      <OnboardingForm key={profile.id} profile={profile} userId={userId} token={token!} />
    </Container>
  )
}
