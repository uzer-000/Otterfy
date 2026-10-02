import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Auto-sync recent PENDING Zenofy orders in parallel (fast, non-blocking)
    try {
      const pendingOrders = await dbStore.getOrders({ status: 'PENDING' });
      const recentPending = pendingOrders
        .filter((po) => po.transaction?.zenofyCheckoutId)
        .slice(0, 5);

      if (recentPending.length > 0) {
        await Promise.allSettled(
          recentPending.map(async (po) => {
            try {
              const zStatus = await zenofyProvider.getOrderStatus(po.transaction!.zenofyCheckoutId!);
              if (zStatus.status === 'PAID') {
                if (po.transaction?.id) {
                  await prisma.$transaction([
                    prisma.order.update({
                      where: { id: po.id },
                      data: { status: 'APPROVED' },
                    }),
                    prisma.transaction.update({
                      where: { id: po.transaction.id },
                      data: { status: 'APPROVED' },
                    }),
                  ]).catch(() => {});
                } else {
                  await prisma.order.update({
                    where: { id: po.id },
                    data: { status: 'APPROVED' },
                  }).catch(() => {});
                }

                await dbStore.updateOrderTransaction(po.id, {
                  status: 'APPROVED',
                }).catch(() => {});
              }
            } catch {}
          })
        );
      }
    } catch {}

    const allOrders = await dbStore.getOrders({ status, startDate, endDate });

    const total = allOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
