import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import { dispatchProductWebhook, dispatchMetaCapi, dispatchUtmifyOrder } from '@/services/tracking/dispatcher';

/**
 * E2Payment IPN Webhook
 * Triggered automatically when customer completes M-Pesa / e-Mola USSD PIN confirmation
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let payload: any;

    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    // E2Payment fields: reference, status, transaction_id, amount, phone
    const reference = payload.reference || payload.order_id || payload.ref;
    const status = (payload.status || payload.state || '').toUpperCase();
    const transactionId = payload.transaction_id || payload.id || `E2P-${Date.now()}`;

    if (!reference) {
      return NextResponse.json({ error: 'Referência não informada.' }, { status: 400 });
    }

    const orders = await dbStore.getOrders();
    const order = orders.find((o) => o.id === reference);

    if (!order) {
      console.warn(`[E2Payment Webhook] Pedido ${reference} não encontrado.`);
      return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
    }

    const isSuccess = ['SUCCESS', 'COMPLETED', 'PAID', 'APPROVED'].includes(status);

    if (isSuccess) {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'APPROVED',
        zenofyTransactionId: transactionId,
        method: payload.phone?.startsWith('25884') || payload.phone?.startsWith('25885') ? 'MPESA' : 'EMOLA',
        responsePayload: payload,
      });

      // Fetch product to trigger tracking
      const product = await dbStore.getProductById(order.productId);
      if (product) {
        const approvedOrder = { ...order, status: 'APPROVED' as const };
        Promise.allSettled([
          dispatchProductWebhook(product, 'order.approved', approvedOrder),
          dispatchMetaCapi(product, 'Purchase', approvedOrder),
          dispatchUtmifyOrder(product, approvedOrder),
        ]).catch((err) => console.warn('[E2Payment Webhook] Tracking error:', err));
      }

      console.log(`[E2Payment Webhook] Pedido ${order.id} APROVADO via M-Pesa/e-Mola.`);
      return NextResponse.json({ success: true, message: 'Pagamento processado com sucesso.' });
    } else if (['FAILED', 'DECLINED', 'CANCELLED'].includes(status)) {
      await dbStore.updateOrderTransaction(order.id, {
        status: 'DECLINED',
        zenofyTransactionId: transactionId,
        responsePayload: payload,
      });

      return NextResponse.json({ success: true, message: 'Status atualizado para recusado.' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[E2Payment Webhook Error]:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook.' }, { status: 500 });
  }
}
