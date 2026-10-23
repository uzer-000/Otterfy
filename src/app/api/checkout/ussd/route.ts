import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = String(body.orderId || body.ref || '').trim();

    if (!orderId) {
      return NextResponse.json({ error: 'ID da encomenda obrigatório.' }, { status: 400 });
    }

    const order = await dbStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    }

    const product = await dbStore.getProductById(order.productId);
    const configuredUpsellUrl =
      product?.checkoutSettings?.postPurchase?.upsellUrl?.trim() ||
      product?.checkoutSettings?.upsellUrl?.trim();

    if (order.status === 'APPROVED') {
      return NextResponse.json({
        success: true,
        status: 'APPROVED',
        orderId: order.id,
        upsellUrl: configuredUpsellUrl,
      });
    }

    const zenofyCheckoutId = order.transaction?.zenofyCheckoutId;
    if (!zenofyCheckoutId) {
      return NextResponse.json(
        { error: 'Sessão Zenofy não encontrada para esta encomenda.' },
        { status: 400 }
      );
    }

    const ussdResult = await zenofyProvider.triggerUssdPush(
      zenofyCheckoutId,
      order.customerPhone,
      (order.transaction?.method as 'MPESA' | 'EMOLA') || 'MPESA',
      order.transaction?.zenofyCheckoutUrl
    );

    // Check if the USSD push completed and was paid
    let isPaid = ussdResult.success;
    if (!isPaid) {
      const check = await zenofyProvider.getOrderStatus(zenofyCheckoutId);
      if (check.status === 'PAID') {
        isPaid = true;
      }
    }

    if (isPaid) {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'APPROVED',
      });

      if (order.transaction?.id) {
        try {
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'APPROVED' },
            }),
            prisma.transaction.update({
              where: { id: order.transaction.id },
              data: { status: 'APPROVED' },
            }),
          ]);
        } catch {
          // ignore if local fallback order
        }
      }

      if (product) {
        const approvedOrder = { ...order, status: 'APPROVED' as const };
        Promise.allSettled([
          dispatchProductWebhook(product, 'order.approved', approvedOrder),
          dispatchMetaCapi(product, 'Purchase', approvedOrder),
          dispatchUtmifyOrder(product, approvedOrder),
        ]).catch((err) => console.warn('[USSD Push Webhook Error]:', err));
      }

      return NextResponse.json({
        success: true,
        status: 'APPROVED',
        orderId: order.id,
        upsellUrl: configuredUpsellUrl,
      });
    }

    return NextResponse.json({
      success: false,
      status: 'PENDING',
      orderId: order.id,
      message: ussdResult.message || 'Aguardando confirmação do PIN no telemóvel.',
      checkoutUrl: order.transaction?.zenofyCheckoutUrl || `https://pay.zenofy.io/o/${zenofyCheckoutId}`,
    });
  } catch (error) {
    console.error('[USSD Push Route Error]:', error);
    return NextResponse.json(
      { error: 'Erro ao disparar pedido USSD no telemóvel.' },
      { status: 500 }
    );
  }
}
