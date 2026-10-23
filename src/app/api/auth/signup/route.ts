import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { clientIp, enforceRateLimit, rateLimitResponse } from '@/lib/security';
import { setUserApprovalStatus } from '@/lib/adminState';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
  acceptedTerms: z.literal(true, {
    message: 'É necessário aceitar os Termos e Condições e a Política de Privacidade.',
  }),
});

export async function POST(req: Request) {
  try {
    const limit = await enforceRateLimit(`signup:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.success) return rateLimitResponse(limit.reset);
    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > 16_384) return NextResponse.json({ error: 'Pedido demasiado grande.' }, { status: 413 });
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
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

    const createdUser = await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, passwordHash },
    });

    await setUserApprovalStatus(normalizedEmail, 'PENDING', createdUser.id);

    return NextResponse.json({ ok: true, pendingApproval: true });
  } catch (error) {
    console.error('[signup] Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
