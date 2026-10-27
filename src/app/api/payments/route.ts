import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchAllApprovedOrderEvents } from '@/services/tracking/dispatcher';

let lastZenofySyncTime = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Auto-sync recent PENDING Zenofy orders with 30s throttle
    const now = Date.now();
    if (now - lastZenofySyncTime > 30_000) {
      lastZenofySyncTime = now;
      try {
        const recentPending = await prisma.order.findMany({
          where: {
            status: 'PENDING',
            transaction: {
              zenofyCheckoutId: { not: null },
            },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: true,
            customer: true,
          },
        });

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

                  // Dispatch full events (Web Push, Webhooks, CAPI, Utmify)
                  const product = await dbStore.getProductById(po.productId);
                  await dispatchAllApprovedOrderEvents(product, {
                    id: po.id,
                    productId: po.productId,
                    customerId: po.customerId,
                    customerName: po.customer.name,
                    customerPhone: po.customer.phone,
                    customerEmail: po.customer.email,
                    amount: po.amount,
                    status: 'APPROVED',
                    hasOrderBump: po.hasOrderBump || false,
                    orderBumpTitle: po.orderBumpTitle || undefined,
                    orderBumpAmount: po.orderBumpAmount ? Number(po.orderBumpAmount) : undefined,
                    affiliateRef: po.affiliateRef || undefined,
                    utmParams: (po.utmParams as any) || undefined,
                    createdAt: po.createdAt.toISOString(),
                    updatedAt: po.updatedAt.toISOString(),
                  });
                }
              } catch {}
            })
          );
        }
      } catch {}
    }

    const allOrders = await dbStore.getOrders({ status, startDate, endDate });

    const total = allOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedOrders,
      orders: paginatedOrders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar pagamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
