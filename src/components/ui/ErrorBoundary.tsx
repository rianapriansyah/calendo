import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'

type Props = { children: ReactNode }

type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (this.state.error) {
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
          <Typography variant="h6" component="h1">
            Something went wrong
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
            {this.state.error.message}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </Box>
      )
    }
    return this.props.children
  }
}
