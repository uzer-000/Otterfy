import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-Signature');
    const eventType = req.headers.get('X-Event');

    if (process.env.ZENOFY_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 401 });
      }

      const isValid = zenofyProvider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
      }
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const { checkout_id, reference } = payload;

    const transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          { zenofyCheckoutId: checkout_id },
          { order: { id: reference } }
        ]
      },
      include: { order: true }
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada.' }, { status: 404 });
    }

    let newStatus: 'APPROVED' | 'REFUNDED' | 'CHARGEBACK' | undefined;

    if (eventType === 'payment.succeeded') {
      newStatus = 'APPROVED';
    } else if (eventType === 'payment.refunded') {
      newStatus = 'REFUNDED';
    } else if (eventType === 'payment.chargeback') {
      newStatus = 'CHARGEBACK';
    }

    const mapPaymentMethod = (method?: string) => {
      if (!method) return undefined;
      const m = method.toUpperCase();
      if (m === 'MPESA') return 'MPESA' as const;
      if (m === 'EMOLA') return 'EMOLA' as const;
      return undefined;
    };

    if (newStatus) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            zenofyTransactionId: payload.payment_id || undefined,
            method: mapPaymentMethod(payload.payment_method) ?? transaction.method,
            responsePayload: payload as object,
          }
        }),
        prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: newStatus }
        })
      ]);
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          responsePayload: payload as object,
        }
      });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
