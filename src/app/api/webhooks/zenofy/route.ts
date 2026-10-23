import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchProductWebhook, dispatchAllApprovedOrderEvents } from '@/services/tracking/dispatcher';

export async function POST(req: Request) {
  try {
    if (Number(req.headers.get('content-length') || 0) > 131_072) {
      return NextResponse.json({ error: 'Payload demasiado grande.' }, { status: 413 });
    }
    const rawBody = await req.text();
    // Zenofy sends the product's shared secret verbatim in X-Webhook-Secret.
    const signature = req.headers.get('x-webhook-secret') || req.headers.get('x-signature');
    const eventType = req.headers.get('x-event') || req.headers.get('X-Event');

    const hasConfiguredSecret = Boolean(process.env.ZENOFY_WEBHOOK_SECRET);
    if (hasConfiguredSecret && signature && !zenofyProvider.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    }
    const verifiedBySecret =
      hasConfiguredSecret && !!signature && zenofyProvider.verifyWebhookSignature(rawBody, signature);

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    console.info('[Zenofy Webhook Received]:', { eventType });

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

    // If not authenticated via shared secret header, verify directly against Zenofy's order status API
    if (!verifiedBySecret) {
      if (!checkoutId) {
        return NextResponse.json({ error: 'Assinatura ou orderId ausente.' }, { status: 401 });
      }
      const liveCheck = await zenofyProvider.getOrderStatus(checkoutId);
      const claimsPaid =
        resolvedEvent === 'order_paid' ||
        resolvedEvent === 'payment.succeeded' ||
        resolvedEvent === 'order.paid' ||
        rawStatus === 'PAID' ||
        rawStatus === 'SUCCESS' ||
        rawStatus === 'APPROVED';
      if (claimsPaid && liveCheck.status !== 'PAID') {
        return NextResponse.json({ error: 'Pagamento não confirmado na Zenofy.' }, { status: 401 });
      }
    }

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
      const allOrders = [...(await dbStore.getOrders()), ...dbStore.getLocalOrders()];
      const matchedOrder = allOrders.find(
        (o) =>
          (checkoutId && o.transaction?.zenofyCheckoutId === checkoutId) ||
          (reference && o.id === reference)
      );

      if (matchedOrder) {
        const evt = String(payload.event || '').toLowerCase();
        const st = String(payload.status || '').toUpperCase();
        const localStatus =
          evt === 'order_paid' || st === 'PAID'
            ? ('APPROVED' as const)
            : evt === 'order_refunded' || st === 'REFUNDED'
            ? ('REFUNDED' as const)
            : evt === 'order_cancelled' || st === 'CANCELLED'
            ? ('DECLINED' as const)
            : undefined;

        if (!localStatus) {
          return NextResponse.json({ received: true, source: 'local_store', note: 'Evento ignorado' });
        }

        await dbStore.updateOrderTransaction(matchedOrder.id, {
          status: localStatus,
          zenofyTransactionId: paymentId || checkoutId,
          responsePayload: payload,
        });

        const prod = await dbStore.getProductById(matchedOrder.productId);
        if (localStatus === 'APPROVED') {
          await dispatchAllApprovedOrderEvents(prod, { ...matchedOrder, status: 'APPROVED' });
        }

        return NextResponse.json({ received: true, source: 'local_store' });
      }

      console.warn('[Zenofy Webhook] Transação não encontrada para:', { checkoutId, reference });
      return NextResponse.json({ received: true, note: 'Transação não encontrada' });
    }

    let newStatus: 'APPROVED' | 'REFUNDED' | 'CHARGEBACK' | 'DECLINED' | undefined;

    if (
      resolvedEvent === 'order_paid' ||
      resolvedEvent === 'payment.succeeded' ||
      resolvedEvent === 'order.paid' ||
      rawStatus === 'PAID' ||
      rawStatus === 'SUCCESS' ||
      rawStatus === 'APPROVED'
    ) {
      newStatus = 'APPROVED';
    } else if (resolvedEvent === 'order_refunded' || resolvedEvent === 'payment.refunded' || rawStatus === 'REFUNDED') {
      newStatus = 'REFUNDED';
    } else if (resolvedEvent === 'payment.chargeback' || rawStatus === 'CHARGEBACK') {
      newStatus = 'CHARGEBACK';
    } else if (
      resolvedEvent === 'order_cancelled' ||
      resolvedEvent === 'payment.failed' ||
      rawStatus === 'FAILED' ||
      rawStatus === 'DECLINED' ||
      rawStatus === 'CANCELLED'
    ) {
      newStatus = 'DECLINED';
    }

    const mapPaymentMethod = (method?: string) => {
      if (!method) return undefined;
      const m = method.toUpperCase();
      if (m.includes('MPESA') || m.includes('M-PESA')) return 'MPESA' as const;
      if (m.includes('EMOLA') || m.includes('E-MOLA')) return 'EMOLA' as const;
      return undefined;
    };

    const resolvedMethod =
      mapPaymentMethod(payload.payment_method || payload.paymentMethod || payload.paymentGateway || payload.data?.paymentMethod) ??
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

      // Load full product (with automation/tracking) from dbStore
      const fullProduct =
        (await dbStore.getProductById(transaction.order.productId)) ||
        (transaction.order?.product as any);

      if (fullProduct && transaction.order) {
        const fullOrder = {
          id: transaction.order.id,
          productId: transaction.order.productId,
          amount: transaction.order.amount,
          customerName: transaction.order.customer?.name || 'Cliente',
          customerPhone: transaction.order.customer?.phone || '',
          customerEmail: transaction.order.customer?.email || undefined,
          paymentMethod: resolvedMethod || 'MPESA',
          hasOrderBump: transaction.order.hasOrderBump || false,
          orderBumpTitle: transaction.order.orderBumpTitle || undefined,
          orderBumpAmount: transaction.order.orderBumpAmount || undefined,
          status: newStatus,
          createdAt: transaction.order.createdAt.toISOString(),
        };

        if (newStatus === 'APPROVED') {
          await dispatchAllApprovedOrderEvents(fullProduct, fullOrder);
        } else if (newStatus === 'REFUNDED' || newStatus === 'CHARGEBACK') {
          await Promise.allSettled([
            dispatchProductWebhook(fullProduct, 'order.refunded', fullOrder),
          ]);
        } else if (newStatus === 'DECLINED') {
          await Promise.allSettled([
            dispatchProductWebhook(fullProduct, 'order.declined', fullOrder),
          ]);
        }
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
