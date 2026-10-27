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

let userProfileCache: { data: any; expiresAt: number } | null = null;

export async function GET() {
  try {
    if (userProfileCache && userProfileCache.expiresAt > Date.now()) {
      return NextResponse.json(userProfileCache.data);
    }

    const profile = getLocalProfile();
    try {
      const primaryUser = await prisma.user.findFirst({
        where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
        select: { id: true, name: true, email: true, phone: true, avatarImage: true },
      }) || await prisma.user.findFirst({
        where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        select: { id: true, name: true, email: true, phone: true, avatarImage: true },
      });

      if (primaryUser) {
        const resolvedAvatar = primaryUser.avatarImage || profile.avatarImage || '';

        const resolved = {
          name: primaryUser.name || profile.name || 'Pedro Hill',
          email: primaryUser.email || profile.email || 'nhacossfilipe@gmail.com',
          phone: primaryUser.phone || profile.phone || '+258 84 000 0000',
          avatarImage: resolvedAvatar,
        };
        const responseData = {
          success: true,
          profile: resolved,
          ...resolved,
        };
        userProfileCache = {
          data: responseData,
          expiresAt: Date.now() + 60_000,
        };
        return NextResponse.json(responseData);
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

    let dbUser: {
      id: string;
      name: string | null;
      email: string;
      phone: string | null;
      avatarImage: string | null;
    } | null = null;

    try {
      dbUser =
        (await prisma.user.findFirst({
          where: { email: { equals: 'nhacossfilipe@gmail.com', mode: 'insensitive' } },
        })) ||
        (await prisma.user.findFirst({
          where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        }));
    } catch {
      // ignore
    }

    const incomingAvatar =
      typeof body.avatarImage === 'string' ? body.avatarImage.trim() : undefined;
    const isExplicitRemove = body.removeAvatar === true;

    const resolvedAvatar = isExplicitRemove
      ? ''
      : incomingAvatar && incomingAvatar.length > 0
      ? incomingAvatar
      : dbUser?.avatarImage || current.avatarImage || '';

    const updated = {
      name:
        body.name !== undefined && String(body.name).trim() !== ''
          ? String(body.name).trim()
          : dbUser?.name || current.name || 'Pedro Hill',
      email:
        body.email !== undefined && String(body.email).trim() !== ''
          ? String(body.email).trim()
          : dbUser?.email || current.email || 'nhacossfilipe@gmail.com',
      phone:
        body.phone !== undefined && String(body.phone).trim() !== ''
          ? String(body.phone).trim()
          : dbUser?.phone || current.phone || '+258 84 000 0000',
      avatarImage: resolvedAvatar,
    };

    saveLocalProfile(updated);
    userProfileCache = null;

    try {
      if (dbUser) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: {
            name: updated.name,
            phone: updated.phone,
            avatarImage: updated.avatarImage,
          },
        });
      }
      // Keep all non-system user rows synced with the same avatarImage
      await prisma.user.updateMany({
        where: { NOT: { email: { endsWith: '@otterfy.internal' } } },
        data: { avatarImage: updated.avatarImage },
      });
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
