import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Middleware shouldn't decode/validate access tokens because they expire in 15 mins.
// If we redirect on access token expiry, it ruins the silent refresh flow.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if they have a refresh token (7-day lifetime)
  const hasRefreshToken = !!request.cookies.get('aurify_refresh')?.value;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !hasRefreshToken) {
    const loginUrl = new URL('/login?alert=session', request.url);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete('aurify_token');
    res.cookies.delete('aurify_refresh');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
