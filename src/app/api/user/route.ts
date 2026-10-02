import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

const PROFILE_FILE = path.join(process.cwd(), 'data', 'profile.json');

function getLocalProfile() {
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      const content = fs.readFileSync(PROFILE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading local profile:', e);
  }
  return {
    name: 'Pedro Hill',
    email: 'nhacossfilipe@gmail.com',
    phone: '+258 84 123 4567',
    avatarImage: '',
    role: 'Administrador',
  };
}

function saveLocalProfile(data: any) {
  try {
    const dir = path.dirname(PROFILE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local profile:', e);
  }
}

export async function GET() {
  try {
    const profile = getLocalProfile();
    // Try to get from DB as well
    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
      });
      if (user) {
        profile.name = user.name || profile.name;
        profile.email = user.email || profile.email;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getLocalProfile();

    const updated = {
      ...current,
      name: body.name !== undefined ? body.name : current.name,
      email: body.email !== undefined ? body.email : current.email,
      phone: body.phone !== undefined ? body.phone : current.phone,
      avatarImage: body.avatarImage !== undefined ? body.avatarImage : current.avatarImage,
      updatedAt: new Date().toISOString(),
    };

    saveLocalProfile(updated);

    // Also update in Prisma User table if name or email changed
    try {
      const user = await prisma.user.findFirst({
        where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
      });
      if (user && body.name) {
        await prisma.user.update({
          where: { id: user.id },
          data: { name: body.name },
        });
      }
    } catch {}

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 });
  }
}
