import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/portfolio',
  '/market',
  '/nft',
  '/smart-contracts',
  '/settings'
]

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const pathname = request.nextUrl.pathname

  // Only check for protected paths - don't do any automatic redirects from landing to dashboard
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path))

  // If path requires auth and no token exists, redirect to home
  if (isProtectedPath && !token) {
    const url = new URL('/', request.url)
    return NextResponse.redirect(url)
  }

  // No other automatic redirections - let the client handle navigation
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /static/ (public files)
     * 4. /*.extension (files with extensions)
     */
    '/((?!api|_next|static|.*\\..*).*)',
  ],
} 