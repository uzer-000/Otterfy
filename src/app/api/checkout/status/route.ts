import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'Referência da encomenda não fornecida.' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: ref },
      include: {
        transaction: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Encomenda não encontrada.' }, { status: 404 });
    }

    const transaction = order.transaction;

    if (transaction?.zenofyCheckoutId && order.status === 'PENDING') {
      try {
        const zenofyStatus = await zenofyProvider.getOrderStatus(transaction.zenofyCheckoutId);
        
        if (zenofyStatus.status === 'PAID') {
          // Update to APPROVED if Zenofy is PAID but DB is PENDING
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: 'APPROVED' }
            }),
            prisma.transaction.update({
              where: { id: transaction.id },
              data: { status: 'APPROVED' }
            })
          ]);
          
          return NextResponse.json({ status: 'APPROVED', transactionId: transaction.id, orderId: order.id });
        }
      } catch (error) {
        console.error('Erro ao verificar status no Zenofy como fallback', error);
      }
    }

    return NextResponse.json({ status: order.status, transactionId: transaction?.id, orderId: order.id });

  } catch (error) {
    console.error('Order status error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
