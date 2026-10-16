import { auth, ADMIN_EMAIL } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isDashboard = nextUrl.pathname.startsWith('/dashboard');

  if (isDashboard && process.env.NODE_ENV === 'production') {
    if (!session || session.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/auth/login', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
