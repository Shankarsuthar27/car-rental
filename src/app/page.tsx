import type { Metadata } from 'next'
import LoginPage from '@/app/(auth)/login/page'

export const metadata: Metadata = {
  title: 'Sign In — JSD Jalore Self Drive PVT LTD',
  description: 'Sign in to JSD Fleet Operations & Car Rental Management Portal',
}

export default function HomePage() {
  return <LoginPage />
}
