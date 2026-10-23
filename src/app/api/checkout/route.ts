import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbStore from '@/lib/store';
import { dispatchCheckout } from '@/services/payment/gatewayManager';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';
import { getZenofyTierByPrice, getClosestZenofyTierByPrice, DEFAULT_ZENOFY_PRODUCT_ID } from '@/lib/zenofyPrices';

export const maxDuration = 60;

const checkoutSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().trim().min(1, 'O nome é obrigatório.'),
  customerPhone: z.string().min(9, 'Número de telefone inválido.'),
  customerEmail: z.union([z.string().email(), z.literal('')]).optional(),
  paymentMethod: z.enum(['MPESA', 'EMOLA']).optional(),
  hasOrderBump: z.boolean().optional(),
  orderBumpTitle: z.string().optional(),
  orderBumpAmount: z.number().optional(),
  selectedBumpKeys: z.array(z.string()).optional(),
  affiliateRef: z.string().optional(),
  couponCode: z.string().trim().optional(),
  discountPercent: z.number().optional(),
  acceptedTerms: z.boolean().optional(),
  marketingConsent: z.boolean().optional(),
  utmParams: z.object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
    content: z.string().optional(),
    term: z.string().optional(),
  }).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = checkoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Dados inválidos.' },
        { status: 400 }
      );
    }

    const {
      productId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      selectedBumpKeys = [],
      hasOrderBump,
      orderBumpTitle,
      orderBumpAmount,
      affiliateRef,
      couponCode,
      discountPercent: clientDiscountPercent,
      marketingConsent = true,
      utmParams,
    } = result.data;

    let product = await dbStore.getProductById(productId);
    if (!product && productId.toLowerCase() === 'demo') {
      product = {
        id: 'demo',
        name: 'Curso de Marketing Digital Pro',
        description: 'Aprenda tráfego pago, funis de conversão e estratégias práticas de vendas online para Moçambique.',
        price: 1500,
        imageUrl: null,
        status: 'ACTIVE',
        userId: 'admin-user-otterfy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Produto não encontrado ou inativo.' }, { status: 404 });
    }

    const checkoutSettings = product.checkoutSettings;
    const extraOffers = checkoutSettings?.extraOffers || [];
    const configuredOffers =
      extraOffers.length > 0
        ? extraOffers.map((offer, index) => ({
            key: String(offer.id || offer.productId || `bump_${index}`),
            title: String(offer.title || '').trim(),
            price: Number(offer.price) || 0,
          }))
        : checkoutSettings?.orderBump?.enabled === true
        ? [
            {
              key: 'default_bump',
              title: String(checkoutSettings.orderBump.title || '').trim(),
              price: Number(checkoutSettings.orderBump.price) || 0,
            },
          ]
        : [];

    const selectedKeys = [...new Set(selectedBumpKeys)];
    const validSelectedOffers = selectedKeys
      .map((key) => configuredOffers.find((offer) => offer.key === key))
      .filter((offer): offer is { key: string; title: string; price: number } => Boolean(offer && offer.price > 0));

    const resolvedBumpAmount =
      validSelectedOffers.length > 0
        ? validSelectedOffers.reduce((sum, offer) => sum + offer.price, 0)
        : hasOrderBump && orderBumpAmount
        ? Number(orderBumpAmount)
        : 0;

    const resolvedBumpTitle =
      validSelectedOffers.length > 0
        ? validSelectedOffers.map((offer) => offer.title).filter(Boolean).join(' + ')
        : orderBumpTitle || '';

    const resolvedHasOrderBump = resolvedBumpAmount > 0;

    let discountPercent = 0;
    if (couponCode) {
      const coupon = checkoutSettings?.coupons?.find(
        (item) => item.code.trim().toUpperCase() === couponCode.toUpperCase()
      );
      if (coupon && Number.isFinite(Number(coupon.discountPercent))) {
        discountPercent = Math.min(100, Math.max(0, Number(coupon.discountPercent)));
      }
    } else if (clientDiscountPercent && clientDiscountPercent > 0 && clientDiscountPercent <= 95) {
      discountPercent = clientDiscountPercent;
    }

    const subtotal = product.price + resolvedBumpAmount;
    const totalAmount = Math.max(1, Math.round(subtotal * (1 - discountPercent / 100) * 100) / 100);

    let reqOrigin = 'http://localhost:3000';
    try {
      reqOrigin = new URL(req.url).origin;
    } catch {
      // ignore
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || reqOrigin || 'http://localhost:3000';

    const order = await dbStore.createOrder({
      productId: product.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      amount: totalAmount,
      paymentMethod,
      hasOrderBump: resolvedHasOrderBump,
      orderBumpTitle: resolvedHasOrderBump ? resolvedBumpTitle : undefined,
      orderBumpAmount: resolvedHasOrderBump ? resolvedBumpAmount : undefined,
      affiliateRef,
      utmParams,
    });

    const resolvedZenofyProductId =
      getZenofyTierByPrice(totalAmount)?.id ||
      product.zenofyProductId ||
      product.checkoutSettings?.zenofyProductId ||
      product.checkoutSettings?.customCheckout?.zenofyProductId ||
      getZenofyTierByPrice(product.price)?.id ||
      getClosestZenofyTierByPrice(totalAmount)?.id ||
      DEFAULT_ZENOFY_PRODUCT_ID;

    const dispatchResult = await dispatchCheckout({
      orderId: order.id,
      amount: totalAmount,
      productName: product.name,
      hasOrderBump: resolvedHasOrderBump,
      orderBumpTitle: resolvedBumpTitle,
      zenofyProductId: resolvedZenofyProductId,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
      },
      paymentMethod,
      baseUrl,
    });

    const upsellUrl =
      product.checkoutSettings?.postPurchase?.upsellUrl?.trim() ||
      product.checkoutSettings?.upsellUrl?.trim() ||
      undefined;
    const downsellUrl =
      product.checkoutSettings?.postPurchase?.downsellUrl?.trim() ||
      product.checkoutSettings?.downsellUrl?.trim() ||
      undefined;

    if (dispatchResult.status === 'APPROVED') {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'APPROVED',
        zenofyCheckoutId: dispatchResult.transactionId,
        zenofyTransactionId: dispatchResult.transactionId,
        method: paymentMethod,
      });

      const tasks: Promise<unknown>[] = [
        dispatchProductWebhook(product, 'order.created', { ...order, status: 'PENDING' }),
        dispatchProductWebhook(product, 'order.approved', { ...order, status: 'APPROVED' }),
      ];
      if (marketingConsent) {
        tasks.push(
          dispatchMetaCapi(product, 'Purchase', { ...order, status: 'APPROVED' }),
          dispatchUtmifyOrder(product, { ...order, status: 'APPROVED' })
        );
      }
      Promise.allSettled(tasks).catch((e) => console.warn('Background tracking dispatch error:', e));

      return NextResponse.json({
        checkoutUrl: upsellUrl || dispatchResult.checkoutUrl,
        upsellUrl,
        downsellUrl,
        orderId: order.id,
        gateway: dispatchResult.gatewayId,
        status: 'APPROVED',
      });
    } else {
      await dbStore.updateOrderTransaction(order.id, {
        zenofyCheckoutId: dispatchResult.transactionId,
        zenofyCheckoutUrl: dispatchResult.checkoutUrl,
        status: 'PENDING',
        method: paymentMethod,
      });

      const pendingTasks: Promise<unknown>[] = [
        dispatchProductWebhook(product, 'order.created', { ...order, status: 'PENDING' }),
      ];
      if (marketingConsent) {
        pendingTasks.push(dispatchUtmifyOrder(product, { ...order, status: 'PENDING' }));
      }
      Promise.allSettled(pendingTasks).catch((e) =>
        console.warn('Background order.created webhook dispatch error:', e)
      );

      return NextResponse.json({
        checkoutUrl: dispatchResult.checkoutUrl,
        upsellUrl,
        downsellUrl,
        orderId: order.id,
        gateway: dispatchResult.gatewayId,
        status: 'PENDING',
        message: dispatchResult.message,
      });
    }
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno do servidor.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
