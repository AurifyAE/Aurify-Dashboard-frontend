import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes only for unauthenticated users
const authRoutes = ['/login', '/register'];

/** Decode JWT payload and check if the token is still valid (not expired). */
function isTokenValid(token: string): boolean {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return false;
    // atob is available in the Edge runtime
    const payload = JSON.parse(atob(base64));
    // exp is in seconds — compare against current time
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from cookie — AuthContext keeps this in sync with localStorage
  const rawToken = request.cookies.get('aurify_token')?.value;

  // Treat missing OR expired/malformed tokens as unauthenticated
  const isAuthenticated = !!rawToken && isTokenValid(rawToken);

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    // Clear the stale cookie so it doesn't keep blocking future logins
    const res = NextResponse.redirect(loginUrl);
    if (rawToken) res.cookies.delete('aurify_token');
    return res;
  }

  // Redirect authenticated users away from login/register
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
