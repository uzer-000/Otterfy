import { NextResponse } from 'next/server';
import { buildWebhookPayload, sendSingleWebhook } from '@/services/tracking/dispatcher';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      url,
      secret,
      authHeader,
      event = 'order.approved',
      productId = 'prod_test_otterfy',
      productName = 'Produto de Teste Otterfy',
      amount = 497,
    } = body;

    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return NextResponse.json(
        { error: 'Informe uma URL de Webhook válida começando com http:// ou https://' },
        { status: 400 }
      );
    }

    const sampleOrder = {
      id: `OTF-TEST-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      amount: Number(amount) || 497,
      customerName: 'Cliente Teste Moçambique',
      customerPhone: '+258841234567',
      customerEmail: 'cliente.teste@otterfy.co.mz',
      paymentMethod: 'MPESA',
      status: event === 'order.approved' ? 'APPROVED' : event === 'order.declined' ? 'DECLINED' : 'PENDING',
      hasOrderBump: false,
      createdAt: new Date().toISOString(),
      utmParams: {
        source: 'facebook',
        medium: 'cpc',
        campaign: 'campanha_teste_otterfy',
      },
    };

    const payload = buildWebhookPayload(
      { id: productId, name: productName },
      event,
      sampleOrder
    );

    const result = await sendSingleWebhook(url.trim(), event, payload, {
      secret,
      authHeader,
      productId,
      productName,
      orderId: sampleOrder.id,
    });

    return NextResponse.json({
      ...result,
      payloadSent: payload,
    });
  } catch (err: any) {
    console.error('Error in POST /api/webhooks/test:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Erro ao disparar webhook de teste.' },
      { status: 500 }
    );
  }
}
