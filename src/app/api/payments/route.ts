import { NextResponse } from 'next/server';
import dbStore from '@/lib/store';
import { syncPendingOrdersLifecycle } from '@/lib/orderSync';
import { getEffectiveLostTimestampMs, isLostOrderStatus } from '@/lib/orderLifecycle';
import { getMozambiqueDate, createMozambiqueDateUtc } from '@/lib/utils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    // Sync active PENDING checkouts & expire orders older than 72 hours (throttled 15s)
    await syncPendingOrdersLifecycle();

    const allOrdersUnfiltered = await dbStore.getOrders({ startDate, endDate });
    const allOrders =
      status && status !== 'ALL'
        ? status === 'LOST'
          ? allOrdersUnfiltered.filter((o) => isLostOrderStatus(o.status))
          : allOrdersUnfiltered.filter((o) => o.status === status)
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
    const expiredAll = allOrdersUnfiltered.filter((o) => isLostOrderStatus(o.status));
    const refundedAll = allOrdersUnfiltered.filter((o) => o.status === 'REFUNDED');

    const isInRange = (createdMs: number, lostMs: number, minDate: Date, maxDate?: Date) => {
      const minMs = minDate.getTime();
      const maxMs = maxDate ? maxDate.getTime() : Number.MAX_SAFE_INTEGER;
      return (createdMs >= minMs && createdMs < maxMs) || (lostMs >= minMs && lostMs < maxMs);
    };

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

    const todayExpired = expiredAll.filter((o) =>
      isInRange(new Date(o.createdAt).getTime(), getEffectiveLostTimestampMs(o), startOfToday)
    );
    const yesterdayExpired = expiredAll.filter((o) =>
      isInRange(new Date(o.createdAt).getTime(), getEffectiveLostTimestampMs(o), startOfYesterday, startOfToday)
    );
    const weekExpired = expiredAll.filter((o) =>
      isInRange(new Date(o.createdAt).getTime(), getEffectiveLostTimestampMs(o), startOfThisWeek)
    );
    const monthExpired = expiredAll.filter((o) =>
      isInRange(new Date(o.createdAt).getTime(), getEffectiveLostTimestampMs(o), startOfThisMonth)
    );

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
      todayExpiredCount: todayExpired.length,
      yesterdayExpiredCount: yesterdayExpired.length,
      weekExpiredCount: weekExpired.length,
      monthExpiredCount: monthExpired.length,
      refundedCount: refundedAll.length,
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
