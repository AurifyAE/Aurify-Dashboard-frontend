import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

/** Decode JWT payload and check if the token is still valid (not expired). */
function isTokenValid(token: string): boolean {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return false;
    const payload = JSON.parse(atob(base64));
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read token from cookie
  const rawToken = request.cookies.get('aurify_token')?.value;
  const isAuthenticated = !!rawToken && isTokenValid(rawToken);

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users trying to access protected routes
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    const res = NextResponse.redirect(loginUrl);
    if (rawToken) {
      res.cookies.delete('aurify_token');
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
