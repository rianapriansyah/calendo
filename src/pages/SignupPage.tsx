import { useState, type FormEvent } from 'react'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
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

export function SignupPage() {
  const { session, loading, signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
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
    return <Navigate to="/onboarding" replace />
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setFieldErrors({})
    const fe: typeof fieldErrors = {}
    if (!email.trim()) fe.email = 'Email is required'
    if (!password) fe.password = 'Password is required'
    else if (password.length < 6) fe.password = 'Use at least 6 characters'
    if (Object.keys(fe).length) {
      setFieldErrors(fe)
      return
    }

    setSubmitting(true)
    try {
      const { error: err, session: next } = await signUp(email.trim(), password)
      if (err) throw err
      if (next) {
        navigate('/onboarding', { replace: true })
      } else {
        setInfo('Check your email to confirm your account, then sign in from the login page.')
      }
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
            Create account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Start with Calendo in seconds
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
              autoComplete="new-password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
            />
            {info ? (
              <Alert severity="success" role="status">
                {info}
              </Alert>
            ) : null}
            {error ? (
              <Alert severity="error" role="alert">
                {error}
              </Alert>
            ) : null}
            <Button type="submit" variant="contained" color="primary" size="large" disabled={submitting}>
              {submitting ? 'Please wait…' : 'Sign up'}
            </Button>
          </Stack>

          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            <Link component={RouterLink} to="/login" underline="hover">
              Already have an account? Sign in
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}
