import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import { ADMIN_EMAIL } from '@/lib/adminEmail';

// Prisma-free auth instance: only decodes the JWT session cookie.
const { auth } = NextAuth(authConfig);

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
