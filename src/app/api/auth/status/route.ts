import { NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getUserApprovalStatus } from '@/lib/adminState';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password || email.endsWith('@otterfy.internal')) {
      return NextResponse.json({ status: 'INVALID' });
    }

    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) {
      return NextResponse.json({ status: 'INVALID' });
    }

    const validPassword = await bcryptjs.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ status: 'INVALID' });
    }

    const approvalStatus = await getUserApprovalStatus(user.email, user.id);
    return NextResponse.json({ status: approvalStatus });
  } catch {
    return NextResponse.json({ status: 'INVALID' });
  }
}
