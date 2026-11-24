import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  const isMainDomain =
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('.netlify.app') ||
    hostname === 'aden-salla.com' ||
    hostname === 'seens.net' ||
    hostname === 'www.seens.net';

  if (
    !isMainDomain &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/images') &&
    !pathname.startsWith('/uploads') &&
    pathname !== '/favicon.ico'
  ) {
    return NextResponse.rewrite(new URL(`/store/${hostname}${pathname}`, request.url));
  }

  const sessionToken = request.cookies.get('seen_session_token')?.value;
  const session = await verifySessionToken(sessionToken);

  // Protect /merchant routes
  if (pathname.startsWith('/merchant')) {
    if (!session || (session.kind !== 'merchant' && session.kind !== 'admin')) {
      return NextResponse.redirect(new URL('/seenlogin5xa', request.url));
    }
    if (session.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/seenlogin5xa', request.url));
    }
  }

  // Protect /seenayhq7x Super Admin routes server-side
  if (pathname.startsWith('/seenayhq7x')) {
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/seenaylogin7x', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
};
