import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { prisma } from './prisma';
import { getUserApprovalStatus, ADMIN_EMAIL } from './adminState';

export { ADMIN_EMAIL };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || 'otterfy-super-secret-key-2024-jwt-prod',
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = loginSchema.safeParse(credentials);

        if (parsedCredentials.success) {
          const email = parsedCredentials.data.email.trim().toLowerCase();
          const { password } = parsedCredentials.data;

          if (email.endsWith('@otterfy.internal')) return null;

          try {
            const user = await prisma.user.findFirst({
              where: {
                email: { equals: email, mode: 'insensitive' },
              },
            });

            if (user) {
              const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);
              if (passwordsMatch) {
                const approvalStatus = await getUserApprovalStatus(user.email, user.id);
                if (approvalStatus !== 'APPROVED') {
                  return null;
                }
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                };
              }
            }
          } catch (err) {
            console.warn('[AUTH] Prisma indisponível, verificando credenciais locais:', err);
          }
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
});
