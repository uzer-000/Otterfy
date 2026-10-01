import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcryptjs from 'bcryptjs';
import { prisma } from './prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || 'otterfy-super-secret-key-2024-jwt-prod',
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
          
          console.log(`[AUTH] Tentativa de login para: ${email}`);

          const user = await prisma.user.findFirst({
            where: {
              email: { equals: email, mode: 'insensitive' },
            },
          });

          if (!user) {
            console.log(`[AUTH] Utilizador não encontrado na base de dados: ${email}`);
            return null;
          }

          const passwordsMatch = await bcryptjs.compare(password, user.passwordHash);

          if (passwordsMatch) {
            console.log(`[AUTH] Sucesso no login para: ${user.email}`);
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          } else {
            console.log(`[AUTH] Senha incorreta para: ${email}`);
          }
        } else {
          console.log('[AUTH] Falha na validação do schema:', parsedCredentials.error.format());
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
