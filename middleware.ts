import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('seen_session_user_id')?.value;
  
  // Protect /create-store route
  if (request.nextUrl.pathname.startsWith('/create-store')) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect /merchant routes
  if (request.nextUrl.pathname.startsWith('/merchant')) {
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/create-store', '/create-store/:path*', '/merchant', '/merchant/:path*'],
};
