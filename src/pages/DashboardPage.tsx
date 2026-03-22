import { CalendarShell } from '../components/calendar/CalendarShell'
import { useAuth } from '../components/auth/authContext'

export function DashboardPage() {
  const { session, user } = useAuth()
  const token = session?.access_token ?? null
  const userId = user?.id ?? null

  return (
    <CalendarShell
      readOnly={false}
      accessToken={token}
      userId={userId}
      headerTitle="Calendo"
    />
  )
}
