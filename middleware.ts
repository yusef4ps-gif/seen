import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  // Define main domains that should not be rewritten (platform domains)
  // Localhost, local IPs, and netlify.app are considered main domains.
  // Add your actual main domain here (e.g., 'aden-salla.com') when deploying.
  const isMainDomain = 
    hostname.includes('localhost') || 
    hostname.includes('127.0.0.1') || 
    hostname.includes('.netlify.app') || 
    hostname === 'aden-salla.com' ||
    hostname === 'seens.net' ||
    hostname === 'www.seens.net'; 

  // Rewrite custom domains to the store route internally
  // Exclude api, static assets, and images
  if (
    !isMainDomain && 
    !pathname.startsWith('/api') && 
    !pathname.startsWith('/_next') && 
    !pathname.startsWith('/images') &&
    pathname !== '/favicon.ico'
  ) {
    // Rewrites `store.com/foo` to `/store/store.com/foo`
    return NextResponse.rewrite(new URL(`/store/${hostname}${pathname}`, request.url));
  }

  const userId = request.cookies.get('seen_session_user_id')?.value;
  
  // Protect /merchant routes
  if (pathname.startsWith('/merchant')) {
    if (!userId) {
      return NextResponse.redirect(new URL('/seenlogin5xa', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
