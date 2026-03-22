import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material'
import { useAuth } from '../components/auth/authContext'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  if (session) {
    return <Navigate to={from === '/login' ? '/dashboard' : from} replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const fe: typeof fieldErrors = {}
    if (!email.trim()) fe.email = 'Email is required'
    if (!password) fe.password = 'Password is required'
    if (Object.keys(fe).length) {
      setFieldErrors(fe)
      return
    }

    setSubmitting(true)
    try {
      const { error: err } = await signIn(email.trim(), password)
      if (err) throw err
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Calendo — your calendar
          </Typography>

          <Stack component="form" spacing={2} onSubmit={onSubmit} sx={{ mt: 3 }}>
            <TextField
              label="Email"
              type="email"
              autoComplete="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
            />
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
            />
            {error ? (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            ) : null}
            <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
              {submitting ? 'Please wait…' : 'Sign in'}
            </Button>
          </Stack>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/signup" underline="hover">
              Need an account? Sign up
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
