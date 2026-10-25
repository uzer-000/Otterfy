import { NextResponse } from 'next/server';
import {
  savePushSubscription,
  removePushSubscription,
  getPushSubscriptions,
} from '@/services/tracking/webhookConfig';
import { VAPID_PUBLIC_KEY } from '@/services/tracking/dispatcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  const subs = await getPushSubscriptions();
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
    subscribedCount: subs.length,
    vapidConfigured: Boolean(process.env.VAPID_PRIVATE_KEY),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sub = body.subscription || body;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return NextResponse.json({ error: 'Subscrição Web Push inválida.' }, { status: 400 });
    }

    const all = await savePushSubscription({
      endpoint: sub.endpoint,
      expirationTime: sub.expirationTime ?? null,
      keys: {
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
      },
      userAgent: req.headers.get('user-agent') || undefined,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      subscribedCount: all.length,
    });
  } catch (err) {
    console.error('[Push Subscribe Error]:', err);
    return NextResponse.json({ error: 'Erro ao registar subscrição push.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.endpoint) {
      await removePushSubscription(body.endpoint);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
