import { NextResponse } from 'next/server';
import { auth, ADMIN_EMAIL } from '@/lib/auth';

type RateLimitResult = { success: boolean; reset: number; limit: number; remaining: number };

const buckets = new Map<string, { count: number; resetAt: number }>();

export async function enforceRateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const next = { count: 1, resetAt: now + options.windowMs };
    buckets.set(key, next);
    return { success: true, reset: next.resetAt, limit: options.limit, remaining: options.limit - 1 };
  }
  bucket.count += 1;
  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  return {
    success: bucket.count <= options.limit,
    reset: bucket.resetAt,
    limit: options.limit,
    remaining: Math.max(0, options.limit - bucket.count),
  };
}

export function rateLimitResponse(resetAt: number) {
  return NextResponse.json(
    { error: 'Demasiadas tentativas. Tente novamente mais tarde.' },
    { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))) } },
  );
}

export async function requireAdmin() {
  if (process.env.NODE_ENV !== 'production') {
    return { user: { id: 'admin-local', email: ADMIN_EMAIL, name: 'Admin Otterfy' } };
  }
  try {
    const session = await auth();
    const email = session?.user?.email?.trim().toLowerCase();
    if (email === ADMIN_EMAIL) return session;
    return null;
  } catch {
    return null;
  }
}

export async function requireAdminResponse() {
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }
  const session = await requireAdmin();
  return session ? null : NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
}

export function clientIp(request: Request) {
  const direct = request.headers.get('x-real-ip')?.trim();
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return direct || forwarded || 'unknown';
}
