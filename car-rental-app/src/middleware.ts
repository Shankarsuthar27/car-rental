import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const { pathname } = request.nextUrl
  const demoRole = request.cookies.get('driveease_demo_role')?.value

  // 1. Allow demo role access to protected routes
  if (demoRole) {
    if (pathname.startsWith('/admin')) {
      const staffRoles = [
        'super_admin',
        'admin',
        'branch_manager',
        'booking_manager',
        'accountant',
        'vehicle_manager',
        'staff',
      ]
      if (!staffRoles.includes(demoRole)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
    return supabaseResponse
  }

  // 2. Standard Supabase session check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Admin route protection — must have staff role
  if (user && pathname.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const staffRoles = [
      'super_admin',
      'admin',
      'branch_manager',
      'booking_manager',
      'accountant',
      'vehicle_manager',
      'staff',
    ]

    if (!profile || !staffRoles.includes(profile.role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Redirect /dashboard to /admin/dashboard for admin-only system
  if (pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
