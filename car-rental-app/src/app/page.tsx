import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin/dashboard')
  }

  const cookieStore = await cookies()
  const demoRole = cookieStore.get('driveease_demo_role')?.value
  if (demoRole) {
    redirect('/admin/dashboard')
  }

  redirect('/login')
}
