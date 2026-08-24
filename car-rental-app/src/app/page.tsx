import type { Metadata } from 'next'
import LoginPage from '@/app/(auth)/login/page'

export const metadata: Metadata = {
  title: 'Sign In — DriveEase Fleet Management',
  description: 'Sign in to DriveEase Fleet Operations & Car Rental Management Portal',
}

export default function HomePage() {
  return <LoginPage />
}
