import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import prisma from '@/lib/prisma';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchAllApprovedOrderEvents } from '@/services/tracking/dispatcher';
import { getMozambiqueDate, createMozambiqueDateUtc } from '@/lib/utils';

let lastZenofySyncTime = 0;

// Orders older than 30 minutes that were never paid are expired in M-Pesa / e-Mola STK push
const PENDING_EXPIRATION_MS = 30 * 60 * 1000;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    // Auto-sync recent PENDING Zenofy orders & expire stale abandoned checkouts (with 15s throttle)
    const now = Date.now();
    if (now - lastZenofySyncTime > 15_000) {
      lastZenofySyncTime = now;
      try {
        const recentPending = await prisma.order.findMany({
          where: {
            status: 'PENDING',
          },
          take: 15,
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
                const ageMs = now - po.createdAt.getTime();
                const checkoutId = po.transaction?.zenofyCheckoutId;

                if (checkoutId) {
                  const zStatus = await zenofyProvider.getOrderStatus(checkoutId);
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
                    return;
                  }

                  if (zStatus.status === 'EXPIRED' || zStatus.status === 'FAILED' || ageMs > PENDING_EXPIRATION_MS) {
                    const nextSt = zStatus.status === 'FAILED' ? 'DECLINED' : 'EXPIRED';
                    if (po.transaction?.id) {
                      await prisma.$transaction([
                        prisma.order.update({
                          where: { id: po.id },
                          data: { status: nextSt },
                        }),
                        prisma.transaction.update({
                          where: { id: po.transaction.id },
                          data: { status: nextSt },
                        }),
                      ]).catch(() => {});
                    } else {
                      await prisma.order.update({
                        where: { id: po.id },
                        data: { status: nextSt },
                      }).catch(() => {});
                    }
                    await dbStore.updateOrderTransaction(po.id, {
                      status: nextSt,
                    }).catch(() => {});
                    return;
                  }
                } else if (ageMs > PENDING_EXPIRATION_MS) {
                  // Pending order without Zenofy checkout ID older than 30 min -> mark EXPIRED
                  if (po.transaction?.id) {
                    await prisma.$transaction([
                      prisma.order.update({
                        where: { id: po.id },
                        data: { status: 'EXPIRED' },
                      }),
                      prisma.transaction.update({
                        where: { id: po.transaction.id },
                        data: { status: 'EXPIRED' },
                      }),
                    ]).catch(() => {});
                  } else {
                    await prisma.order.update({
                      where: { id: po.id },
                      data: { status: 'EXPIRED' },
                    }).catch(() => {});
                  }
                  await dbStore.updateOrderTransaction(po.id, {
                    status: 'EXPIRED',
                  }).catch(() => {});
                }
              } catch {}
            })
          );
        }
      } catch {}
    }

    const allOrdersUnfiltered = await dbStore.getOrders({ startDate, endDate });
    const allOrders =
      status && status !== 'ALL'
        ? allOrdersUnfiltered.filter((o) => o.status === status)
        : allOrdersUnfiltered;

    // Compute accurate real-time summary in Mozambique timezone (CAT = UTC+2)
    const mozNow = getMozambiqueDate();
    const mozYear = mozNow.getUTCFullYear();
    const mozMonth = mozNow.getUTCMonth();
    const mozDay = mozNow.getUTCDate();
    const mozDayOfWeek = mozNow.getUTCDay();
    const diffToMonday = mozDayOfWeek === 0 ? 6 : mozDayOfWeek - 1;

    const startOfToday = createMozambiqueDateUtc(mozYear, mozMonth, mozDay, 0, 0, 0, 0);
    const startOfYesterday = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - 1, 0, 0, 0, 0);
    const startOfThisWeek = createMozambiqueDateUtc(mozYear, mozMonth, mozDay - diffToMonday, 0, 0, 0, 0);
    const startOfThisMonth = createMozambiqueDateUtc(mozYear, mozMonth, 1, 0, 0, 0, 0);
    const startOfLastMonth = createMozambiqueDateUtc(mozYear, mozMonth - 1, 1, 0, 0, 0, 0);

    const approvedAll = allOrdersUnfiltered.filter((o) => o.status === 'APPROVED');
    const pendingAll = allOrdersUnfiltered.filter((o) => o.status === 'PENDING');
    const expiredAll = allOrdersUnfiltered.filter(
      (o) => o.status === 'EXPIRED' || o.status === 'DECLINED' || o.status === 'CANCELLED'
    );

    const todayApproved = approvedAll.filter((o) => new Date(o.createdAt) >= startOfToday);
    const yesterdayApproved = approvedAll.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startOfYesterday && d < startOfToday;
    });
    const weekApproved = approvedAll.filter((o) => new Date(o.createdAt) >= startOfThisWeek);
    const monthApproved = approvedAll.filter((o) => new Date(o.createdAt) >= startOfThisMonth);
    const lastMonthApproved = approvedAll.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startOfLastMonth && d < startOfThisMonth;
    });

    const summary = {
      totalApprovedRevenue: approvedAll.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      totalApprovedCount: approvedAll.length,
      todayRevenue: todayApproved.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      todaySalesCount: todayApproved.length,
      yesterdayRevenue: yesterdayApproved.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      yesterdaySalesCount: yesterdayApproved.length,
      weekRevenue: weekApproved.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      weekSalesCount: weekApproved.length,
      monthRevenue: monthApproved.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      monthSalesCount: monthApproved.length,
      lastMonthRevenue: lastMonthApproved.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      lastMonthSalesCount: lastMonthApproved.length,
      pendingCount: pendingAll.length,
      pendingAmount: pendingAll.reduce((s, o) => s + (Number(o.amount) || 0), 0),
      expiredCount: expiredAll.length,
      expiredAmount: expiredAll.reduce((s, o) => s + (Number(o.amount) || 0), 0),
    };

    const total = allOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(skip, skip + limit);

    return NextResponse.json({
      data: paginatedOrders,
      orders: paginatedOrders,
      summary,
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
