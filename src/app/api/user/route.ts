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
  } catch (err) {
    console.error('Error reading profile.json:', err);
  }

  return {
    name: 'Admin Otterfy',
    email: 'nhacossfilipe@gmail.com',
    phone: '+258 84 000 0000',
    avatarImage: '',
  };
}

function saveLocalProfile(data: Record<string, unknown>) {
  try {
    const dir = path.dirname(PROFILE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving profile.json:', err);
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const profile = getLocalProfile();
    try {
      const dbUser =
        (await prisma.user.findFirst({
          where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
        })) ||
        (await prisma.user.findFirst({
          where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        }));
      if (dbUser) {
        const resolved = {
          name: dbUser.name || profile.name || 'Admin Otterfy',
          email: dbUser.email || profile.email || 'nhacossfilipe@gmail.com',
          phone: dbUser.phone || profile.phone || '+258 84 000 0000',
          avatarImage: dbUser.avatarImage || profile.avatarImage || '',
        };
        return NextResponse.json(
          {
            success: true,
            profile: resolved,
            ...resolved,
          },
          {
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              Pragma: 'no-cache',
              Expires: '0',
            },
          }
        );
      }
    } catch {
      // ignore DB error and use local
    }

    return NextResponse.json(
      {
        success: true,
        profile,
        ...profile,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/user:', error);
    return NextResponse.json({ error: 'Erro ao carregar perfil.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = getLocalProfile();

    const updated = {
      name: body.name !== undefined ? body.name : current.name,
      email: body.email !== undefined ? body.email : current.email,
      phone: body.phone !== undefined ? body.phone : current.phone,
      avatarImage: body.avatarImage !== undefined ? body.avatarImage : current.avatarImage,
    };

    saveLocalProfile(updated);

    try {
      const dbUser =
        (await prisma.user.findFirst({
          where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
        })) ||
        (await prisma.user.findFirst({
          where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        }));
      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            avatarImage: updated.avatarImage,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Could not update DB user profile (offline fallback active):', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        profile: updated,
        user: updated,
        ...updated,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Error in POST /api/user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar perfil.' }, { status: 500 });
  }
}
