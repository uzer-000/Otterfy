import { NextResponse } from 'next/server';
import { z } from 'zod';
import dbStore from '@/lib/store';
import { dispatchCheckout } from '@/services/payment/gatewayManager';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';
import { getZenofyTierByPrice, DEFAULT_ZENOFY_PRODUCT_ID } from '@/lib/zenofyPrices';

const checkoutSchema = z.object({
  productId: z.string(),
  customerName: z.string().min(1, 'O nome é obrigatório.'),
  customerPhone: z.string().startsWith('+258', 'O telefone deve começar com +258.'),
  customerEmail: z.string().email('Email inválido.').optional().or(z.literal('')),
  paymentMethod: z.enum(['MPESA', 'EMOLA']).optional(),
  hasOrderBump: z.boolean().optional(),
  orderBumpPrice: z.number().optional(),
  orderBumpTitle: z.string().optional(),
  affiliateRef: z.string().optional(),
  couponCode: z.string().optional(),
  discountAmount: z.number().optional(),
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
      return NextResponse.json({ error: result.error.issues[0]?.message || 'Dados inválidos.' }, { status: 400 });
    }

    const {
      productId,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod,
      hasOrderBump,
      orderBumpPrice = 250,
      orderBumpTitle,
      affiliateRef,
      couponCode,
      discountAmount = 0,
      utmParams,
    } = result.data;

    // Fetch product
    const product = await dbStore.getProductById(productId);

    if (!product || product.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Produto não encontrado ou inativo.' }, { status: 404 });
    }

    // Calculate total amount with Order Bump and Coupon discount
    const calculatedBase = product.price + (hasOrderBump ? orderBumpPrice : 0);
    const totalAmount = Math.max(1, calculatedBase - (discountAmount || 0));

    // Create Order in store
    const order = await dbStore.createOrder({
      productId: product.id,
      customerName,
      customerPhone,
      customerEmail: customerEmail || undefined,
      amount: totalAmount,
      paymentMethod,
      hasOrderBump,
      orderBumpTitle: hasOrderBump ? (orderBumpTitle || 'Item Adicional (Order Bump)') : undefined,
      orderBumpAmount: hasOrderBump ? orderBumpPrice : undefined,
      affiliateRef,
      utmParams,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Dispatch payment through the currently active gateway (Zenofy, E2Payment, EscalePay, or Demo)
    const resolvedZenofyProductId =
      (product as any).zenofyProductId ||
      (product as any).checkoutSettings?.zenofyProductId ||
      (product as any).checkoutSettings?.customCheckout?.zenofyProductId ||
      getZenofyTierByPrice(totalAmount)?.id ||
      getZenofyTierByPrice(product.price)?.id ||
      DEFAULT_ZENOFY_PRODUCT_ID;

    const dispatchResult = await dispatchCheckout({
      orderId: order.id,
      amount: totalAmount,
      productName: product.name,
      hasOrderBump,
      orderBumpTitle,
      zenofyProductId: resolvedZenofyProductId,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || undefined,
      },
      paymentMethod,
      baseUrl,
    });

    if (dispatchResult.status === 'APPROVED') {
      // Instant demo approval
      await dbStore.updateOrderTransaction(order.id, {
        status: 'APPROVED',
        zenofyCheckoutId: dispatchResult.transactionId,
        zenofyTransactionId: dispatchResult.transactionId,
        method: paymentMethod,
      });

      // Asynchronously trigger Webhooks, Meta CAPI and Utmify in background
      Promise.allSettled([
        dispatchProductWebhook(product, 'order.approved', { ...order, status: 'APPROVED' }),
        dispatchMetaCapi(product, 'Purchase', { ...order, status: 'APPROVED' }),
        dispatchUtmifyOrder(product, { ...order, status: 'APPROVED' }),
      ]).catch((e) => console.warn('Background tracking dispatch error:', e));

      return NextResponse.json({
        checkoutUrl: dispatchResult.checkoutUrl,
        gateway: dispatchResult.gatewayId,
        status: 'APPROVED',
      });
    } else {
      // Real gateway pending approval (USSD or external checkout redirect)
      await dbStore.updateOrderTransaction(order.id, {
        zenofyCheckoutId: dispatchResult.transactionId,
        zenofyCheckoutUrl: dispatchResult.checkoutUrl,
        status: 'PENDING',
        method: paymentMethod,
      });

      return NextResponse.json({
        checkoutUrl: dispatchResult.checkoutUrl,
        gateway: dispatchResult.gatewayId,
        status: 'PENDING',
        message: dispatchResult.message,
      });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
