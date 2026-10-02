import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('X-Signature');
    const eventType = req.headers.get('x-event') || req.headers.get('X-Event');

    if (process.env.ZENOFY_WEBHOOK_SECRET && signature) {
      const isValid = zenofyProvider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[Zenofy Webhook] Assinatura inválida recebida.');
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    console.log('[Zenofy Webhook Received]:', { eventType, payload });

    const checkoutId =
      payload.checkout_id ||
      payload.orderId ||
      payload.order_id ||
      payload.id ||
      payload.data?.orderId ||
      payload.data?.checkout_id;

    const reference =
      payload.reference ||
      payload.external_id ||
      payload.data?.reference ||
      payload.data?.external_id;

    const paymentId =
      payload.payment_id ||
      payload.paymentReference ||
      payload.data?.payment_id ||
      payload.data?.paymentReference;

    const rawStatus = (payload.status || payload.data?.status || '').toUpperCase();
    const resolvedEvent = (eventType || payload.event || payload.type || '').toLowerCase();

    // Look up transaction
    let transaction = await prisma.transaction.findFirst({
      where: {
        OR: [
          ...(checkoutId ? [{ zenofyCheckoutId: checkoutId }] : []),
          ...(reference ? [{ order: { id: reference } }] : []),
          ...(reference ? [{ id: reference }] : []),
        ],
      },
      include: { order: { include: { product: true, customer: true } } },
    });

    // If not found in prisma, check local store
    if (!transaction) {
      const allOrders = await dbStore.getOrders();
      const matchedOrder = allOrders.find(
        (o) =>
          (checkoutId && o.transaction?.zenofyCheckoutId === checkoutId) ||
          (reference && o.id === reference)
      );

      if (matchedOrder) {
        await dbStore.updateOrderTransaction(matchedOrder.id, {
          status: 'APPROVED',
          zenofyTransactionId: paymentId || checkoutId,
          responsePayload: payload,
        });
        return NextResponse.json({ received: true, source: 'local_store' });
      }

      console.warn('[Zenofy Webhook] Transação não encontrada para:', { checkoutId, reference });
      return NextResponse.json({ received: true, note: 'Transação não encontrada' });
    }

    let newStatus: 'APPROVED' | 'REFUNDED' | 'CHARGEBACK' | undefined;

    if (
      resolvedEvent === 'payment.succeeded' ||
      resolvedEvent === 'order.paid' ||
      rawStatus === 'PAID' ||
      rawStatus === 'SUCCESS' ||
      rawStatus === 'APPROVED'
    ) {
      newStatus = 'APPROVED';
    } else if (resolvedEvent === 'payment.refunded' || rawStatus === 'REFUNDED') {
      newStatus = 'REFUNDED';
    } else if (resolvedEvent === 'payment.chargeback' || rawStatus === 'CHARGEBACK') {
      newStatus = 'CHARGEBACK';
    }

    const mapPaymentMethod = (method?: string) => {
      if (!method) return undefined;
      const m = method.toUpperCase();
      if (m.includes('MPESA') || m.includes('M-PESA')) return 'MPESA' as const;
      if (m.includes('EMOLA') || m.includes('E-MOLA')) return 'EMOLA' as const;
      return undefined;
    };

    const resolvedMethod =
      mapPaymentMethod(payload.payment_method || payload.paymentMethod || payload.data?.paymentMethod) ??
      transaction.method;

    if (newStatus) {
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: newStatus,
            zenofyTransactionId: paymentId || undefined,
            method: resolvedMethod,
            responsePayload: payload as object,
          },
        }),
        prisma.order.update({
          where: { id: transaction.orderId },
          data: { status: newStatus },
        }),
      ]);

      // Also update local store & trigger notifications
      await dbStore.updateOrderTransaction(transaction.orderId, {
        status: newStatus,
        zenofyTransactionId: paymentId || undefined,
        method: resolvedMethod as any,
        responsePayload: payload,
      });

      // Trigger tracking integrations
      if (newStatus === 'APPROVED' && transaction.order?.product) {
        const fullOrder = {
          id: transaction.order.id,
          productId: transaction.order.productId,
          amount: transaction.order.amount,
          customerName: transaction.order.customer?.name || 'Cliente',
          customerPhone: transaction.order.customer?.phone || '',
          customerEmail: transaction.order.customer?.email || undefined,
          status: 'APPROVED',
          createdAt: transaction.order.createdAt.toISOString(),
        };
        Promise.allSettled([
          dispatchProductWebhook(transaction.order.product, 'order.approved', fullOrder),
          dispatchMetaCapi(transaction.order.product, 'Purchase', fullOrder),
          dispatchUtmifyOrder(transaction.order.product, fullOrder),
        ]).catch((e) => console.warn('[Tracking Dispatch Error]:', e));
      }
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          responsePayload: payload as object,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
