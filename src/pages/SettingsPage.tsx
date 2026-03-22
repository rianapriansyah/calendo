import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useAuth } from '../components/auth/authContext'
import type { Profile } from '../types'
import { getTimezoneOptions } from '../lib/timezones'
import { supabase } from '../lib/supabase'
import { useProfileQuery } from '../hooks/useProfile'
import {
  useDeleteAccountMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from '../hooks/useProfileMutations'
import { ThemeModeToggle } from '../components/theme/ThemeModeToggle'

function SettingsForm({ profile, userId, token }: { profile: Profile; userId: string; token: string }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [isPublic, setIsPublic] = useState(profile.is_public)
  const [timezone, setTimezone] = useState(profile.timezone || 'UTC')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const updateMut = useUpdateProfileMutation(userId, token)
  const uploadMut = useUploadAvatarMutation(userId, token)
  const deleteMut = useDeleteAccountMutation(token)
  const { signOut } = useAuth()

  async function persistProfile() {
    setError(null)
    await updateMut.mutateAsync({
      full_name: fullName.trim(),
      username: username.trim(),
      bio: bio.trim() || null,
      is_public: isPublic,
      timezone,
    })
    setMessage('Profile saved')
    setTimeout(() => setMessage(null), 2500)
  }

  async function onPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      setError(err.message)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Password updated')
    setTimeout(() => setMessage(null), 2500)
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}/u/${encodeURIComponent(username)}`
  const zones = getTimezoneOptions()

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        {message ? <Alert severity="success">{message}</Alert> : null}
        {error ? (
          <Alert severity="error" role="alert">
            {error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Appearance
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Light, dark, or match your system setting.
          </Typography>
          <ThemeModeToggle size="medium" fullWidth />
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Profile
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }} alignItems={{ sm: 'flex-start' }}>
            {profile.avatar_url ? (
              <Avatar src={profile.avatar_url} sx={{ width: 80, height: 80 }} variant="rounded" />
            ) : (
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'action.hover', color: 'text.secondary' }} variant="rounded">
                <Typography variant="caption">No photo</Typography>
              </Avatar>
            )}
            <Stack spacing={0.5}>
              <Button variant="outlined" component="label" disabled={uploadMut.isPending}>
                Upload avatar
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (!f) return
                    setError(null)
                    try {
                      await uploadMut.mutateAsync(f)
                      setMessage('Avatar updated')
                      setTimeout(() => setMessage(null), 2500)
                    } catch (err: unknown) {
                      setError(err instanceof Error ? err.message : 'Upload failed')
                    }
                  }}
                />
              </Button>
              {uploadMut.isPending ? (
                <Typography variant="caption" color="text.secondary">
                  Uploading…
                </Typography>
              ) : null}
            </Stack>
          </Stack>
          <Stack
            component="form"
            spacing={2}
            sx={{ mt: 3 }}
            onSubmit={(e) => {
              e.preventDefault()
              void persistProfile()
            }}
          >
            <TextField label="Full name" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <TextField label="Username" fullWidth value={username} onChange={(e) => setUsername(e.target.value)} />
            <TextField
              label="Bio"
              fullWidth
              multiline
              minRows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
            <Button type="submit" variant="contained" disabled={updateMut.isPending}>
              Save profile
            </Button>
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Visibility
          </Typography>
          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Checkbox checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />}
            label="Public profile"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Shareable link
          </Typography>
          <Typography
            component="code"
            variant="body2"
            sx={{
              display: 'block',
              mt: 1,
              p: 1.5,
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              wordBreak: 'break-all',
            }}
          >
            {shareUrl}
          </Typography>
          <Button sx={{ mt: 2 }} variant="outlined" disabled={updateMut.isPending} onClick={() => void persistProfile()}>
            Save visibility
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Timezone
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="settings-tz">Timezone</InputLabel>
            <Select
              labelId="settings-tz"
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
          <Button sx={{ mt: 2 }} variant="outlined" disabled={updateMut.isPending} onClick={() => void persistProfile()}>
            Save timezone
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Account
          </Typography>
          <Stack component="form" spacing={2} sx={{ mt: 2, maxWidth: 480 }} onSubmit={onPassword}>
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm password"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button type="submit" variant="contained">
              Update password
            </Button>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={(theme) => ({
            p: 3,
            borderColor: 'error.light',
            bgcolor:
              theme.palette.mode === 'light'
                ? alpha(theme.palette.error.main, 0.06)
                : alpha(theme.palette.error.main, 0.14),
          })}
        >
          <Typography variant="h6" fontWeight={600} color="error" gutterBottom>
            Danger zone
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Permanently delete your account and data. This cannot be undone.
          </Typography>
          {!confirmDelete ? (
            <Button sx={{ mt: 2 }} color="error" variant="outlined" onClick={() => setConfirmDelete(true)}>
              Delete account
            </Button>
          ) : (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                disabled={deleteMut.isPending}
                onClick={async () => {
                  try {
                    await deleteMut.mutateAsync()
                    await signOut()
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : 'Delete failed')
                  }
                }}
              >
                {deleteMut.isPending ? 'Deleting…' : 'Confirm delete'}
              </Button>
              <Button variant="outlined" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Container>
  )
}

export function SettingsPage() {
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

  return (
    <Box sx={{ minHeight: '100svh', bgcolor: 'background.default' }}>
      <Box
        component="header"
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 2, py: 1.5 }}
      >
        <Container maxWidth="md" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={600}>
            Settings
          </Typography>
          <Button component={RouterLink} to="/dashboard" color="inherit">
            Back to calendar
          </Button>
        </Container>
      </Box>
      <SettingsForm
        key={`${profile.id}-${profile.username}-${profile.avatar_url ?? ''}`}
        profile={profile}
        userId={userId}
        token={token!}
      />
    </Box>
  )
}
