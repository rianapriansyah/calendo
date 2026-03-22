import { createBrowserRouter, Navigate } from 'react-router-dom'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { OnboardingPage } from '../pages/OnboardingPage'
import { SettingsPage } from '../pages/SettingsPage'
import { SignupPage } from '../pages/SignupPage'
import { PublicProfilePage } from '../public-profile/PublicProfilePage'
import { PrivateLayout } from './PrivateLayout'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/u/:username', element: <PublicProfilePage /> },
  {
    path: '/',
    element: <PrivateLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
