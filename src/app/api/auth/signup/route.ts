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

    // Proteção absoluta: Nunca permitir sobrescrever o administrador
    if (normalizedEmail === 'nhacossfilipe@gmail.com') {
      return NextResponse.json(
        { error: 'Este email é o administrador exclusivo. Por favor aceda à página de Login.' },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({
        ok: true,
        pendingApproval: true,
        message: 'O seu pedido de acesso já foi recebido e aguarda aprovação da administração.',
      });
    }

    const passwordHash = await bcryptjs.hash(password, 12);

    await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash },
    });

    return NextResponse.json({ ok: true, pendingApproval: true });
  } catch (error) {
    console.error('[signup] Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
