import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import { escalepayProvider } from '@/services/payment/escalepay';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';

/**
 * EscalePay Webhook Handler
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-signature') || req.headers.get('x-escalepay-signature') || '';

    // Verify signature if configured
    if (signature && !escalepayProvider.verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    // EscalePay webhook structure: { event: 'transaction.paid', data: { reference: '...', status: 'PAID' } }
    const event = payload.event || payload.type || 'payment.success';
    const data = payload.data || payload;
    const reference = data.reference || data.order_id;
    const transactionId = data.id || data.transaction_id || `ESC-${Date.now()}`;

    if (!reference) {
      return NextResponse.json({ error: 'Referência não informada.' }, { status: 400 });
    }

    const orders = await dbStore.getOrders();
    const order = orders.find((o) => o.id === reference);

    if (!order) {
      console.warn(`[EscalePay Webhook] Pedido ${reference} não encontrado.`);
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const isPaid = event === 'transaction.paid' || data.status === 'PAID' || data.status === 'APPROVED';

    if (isPaid) {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'APPROVED',
        zenofyTransactionId: transactionId,
        method: data.payment_method?.toUpperCase() === 'MPESA' ? 'MPESA' : 'EMOLA',
        responsePayload: payload,
      });

      const product = await dbStore.getProductById(order.productId);
      if (product) {
        const approvedOrder = { ...order, status: 'APPROVED' as const };
        Promise.allSettled([
          dispatchProductWebhook(product, 'order.approved', approvedOrder),
          dispatchMetaCapi(product, 'Purchase', approvedOrder),
          dispatchUtmifyOrder(product, approvedOrder),
        ]).catch((err) => console.warn('[EscalePay Webhook] Tracking error:', err));
      }

      console.log(`[EscalePay Webhook] Pedido ${order.id} APROVADO.`);
      return NextResponse.json({ success: true, message: 'Pagamento aprovado.' });
    } else if (event === 'transaction.failed' || data.status === 'FAILED') {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'DECLINED',
        zenofyTransactionId: transactionId,
        responsePayload: payload,
      });

      return NextResponse.json({ success: true, message: 'Status atualizado para recusado.' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[EscalePay Webhook Error]:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook.' }, { status: 500 });
  }
}
