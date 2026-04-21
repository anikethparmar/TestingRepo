import { NextRequest, NextResponse } from 'next/server'

const PASSWORD = 'zoomboomzoom!23'
const COOKIE_NAME = 'swing_auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/') || pathname === '/login') {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get(COOKIE_NAME)
  if (authCookie?.value === PASSWORD) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
