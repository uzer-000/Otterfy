import type { NextAuthConfig } from 'next-auth';

/**
 * Prisma-free NextAuth configuration.
 * Shared by the full auth setup (src/lib/auth.ts) and the proxy, so the proxy bundle
 * does not drag the Prisma engine along just to read the JWT session cookie.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET || 'otterfy-super-secret-key-2024-jwt-prod',
  trustHost: true,
  providers: [],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.id = user.id;
        token.email = user.email?.toLowerCase();
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.sub || token.id) {
          session.user.id = (token.id || token.sub) as string;
        }
        if (token.email) {
          session.user.email = (token.email as string).toLowerCase();
        }
        if (token.name) {
          session.user.name = token.name as string;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
} satisfies NextAuthConfig;
