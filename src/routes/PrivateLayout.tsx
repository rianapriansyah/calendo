import { Outlet } from 'react-router-dom'
import { AuthGuard } from '../components/auth/AuthGuard'
import { OnboardingGate } from './OnboardingGate'

export function PrivateLayout() {
  return (
    <AuthGuard>
      <OnboardingGate>
        <Outlet />
      </OnboardingGate>
    </AuthGuard>
  )
}
