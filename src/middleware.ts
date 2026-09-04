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

  // 2. Fast redirect /dashboard to /admin/dashboard
  if (pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  // 3. Fast-path: Check cached staff role cookie to avoid DB queries on internal navigations
  const staffRoles = [
    'super_admin',
    'admin',
    'branch_manager',
    'booking_manager',
    'accountant',
    'vehicle_manager',
    'staff',
  ]
  const cachedRole = request.cookies.get('driveease_user_role')?.value
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('-auth-token'))

  // If already verified staff on internal navigation, return immediately
  if (cachedRole && staffRoles.includes(cachedRole) && pathname.startsWith('/admin') && hasAuthCookie) {
    return supabaseResponse
  }

  // 4. Standard Supabase session check
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
    if (cachedRole && staffRoles.includes(cachedRole)) {
      return supabaseResponse
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !staffRoles.includes(profile.role)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    // Cache verified role in cookie for 1 hour to accelerate subsequent navigations
    supabaseResponse.cookies.set('driveease_user_role', profile.role, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 3600,
    })
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
