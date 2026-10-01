import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    const passwordHash = await bcryptjs.hash(password, 12);

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name: name.trim(), passwordHash },
      });
      return NextResponse.json({ ok: true, message: 'Conta atualizada com sucesso.' });
    }

    await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[signup] Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
