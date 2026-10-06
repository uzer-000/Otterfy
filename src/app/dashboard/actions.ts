'use server';

import { signOut } from '@/lib/auth';

/** Termina a sessão do painel e volta ao login. */
export async function logoutAction() {
  await signOut({ redirectTo: '/auth/login' });
}
