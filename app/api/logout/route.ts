import { NextResponse } from 'next/server';
import { clearAuthCookieAction } from '@/app/actions/auth';

export async function GET(request: Request) {
  // Clear the cookies
  await clearAuthCookieAction();
  
  // Redirect back to home
  return NextResponse.redirect(new URL('/', request.url));
}
