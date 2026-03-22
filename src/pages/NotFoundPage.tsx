import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Typography } from '@mui/material'

export function NotFoundPage() {
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
        Page not found
      </Typography>
      <Button component={RouterLink} to="/login" variant="outlined">
        Go to sign in
      </Button>
    </Box>
  )
}
