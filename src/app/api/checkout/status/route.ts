import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchAllApprovedOrderEvents } from '@/services/tracking/dispatcher';
import { clientIp, enforceRateLimit, rateLimitResponse } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const limit = await enforceRateLimit(`checkout-status:${clientIp(req)}`, { limit: 60, windowMs: 60_000 });
    if (!limit.success) return rateLimitResponse(limit.reset);
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'Referência da encomenda não fornecida.' }, { status: 400 });
    }

    const order = await dbStore.getOrderById(ref);
    if (!order) {
      return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    }

    const product = await dbStore.getProductById(order.productId);
    const configuredUpsellUrl = product?.checkoutSettings?.postPurchase?.upsellUrl?.trim() || product?.checkoutSettings?.upsellUrl?.trim();
    let upsellUrl: string | undefined;
    try {
      const parsedUrl = configuredUpsellUrl ? new URL(configuredUpsellUrl) : undefined;
      if (parsedUrl?.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && parsedUrl?.protocol === 'http:' && parsedUrl.hostname === 'localhost')) {
        upsellUrl = parsedUrl.toString();
      }
    } catch {}

    const transaction = order.transaction;

    if (transaction?.zenofyCheckoutId && order.status === 'PENDING') {
      try {
        const zenofyStatus = await zenofyProvider.getOrderStatus(transaction.zenofyCheckoutId);

        if (zenofyStatus.status === 'PAID') {
          await dbStore.updateOrderTransaction(order.id, {
            status: 'APPROVED',
          });

          try {
            await prisma.$transaction([
              prisma.order.update({
                where: { id: order.id },
                data: { status: 'APPROVED' },
              }),
              prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'APPROVED' },
              }),
            ]);
          } catch {}

          await dispatchAllApprovedOrderEvents(product, { ...order, status: 'APPROVED' });

          return NextResponse.json({
            status: 'APPROVED',
            transactionId: transaction.id,
            orderId: order.id,
            upsellUrl,
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status no Zenofy como fallback', error);
      }
    }

    return NextResponse.json({
      status: order.status,
      transactionId: transaction?.id,
      orderId: order.id,
      upsellUrl,
    });
  } catch (error) {
    console.error('Order status error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
