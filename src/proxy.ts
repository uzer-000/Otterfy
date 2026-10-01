import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NextAuth v5 beta.32: wrap our own proxy with auth().
// The wrapped function receives a NextAuthRequest (which extends NextRequest)
// with an additional `auth` property containing the session.
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isDashboard = nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard) {
    if (!isLoggedIn || session?.user?.email !== 'nhacossfilipe@gmail.com') {
      return NextResponse.redirect(new URL('/auth/login', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
