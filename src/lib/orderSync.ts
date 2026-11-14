import prisma from '@/lib/prisma';
import dbStore from '@/lib/store';
import { zenofyProvider } from '@/services/payment/zenofy';
import { dispatchAllApprovedOrderEvents } from '@/services/tracking/dispatcher';
import {
  PENDING_MAX_AGE_MS,
  USSD_RETRY_GRACE_MS,
  isPendingExpired,
} from '@/lib/orderLifecycle';

let lastPendingSyncTime = 0;

async function persistOrderStatus(
  orderId: string,
  transactionId: string | undefined,
  nextStatus: 'APPROVED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED'
) {
  if (transactionId) {
    await prisma
      .$transaction([
        prisma.order.update({
          where: { id: orderId },
          data: { status: nextStatus },
        }),
        prisma.transaction.update({
          where: { id: transactionId },
          data: { status: nextStatus },
        }),
      ])
      .catch(() => {});
  } else {
    await prisma.order
      .update({
        where: { id: orderId },
        data: { status: nextStatus },
      })
      .catch(() => {});
  }

  await dbStore
    .updateOrderTransaction(orderId, {
      status: nextStatus,
    })
    .catch(() => {});
}

/**
 * Synchronizes active PENDING checkouts with Zenofy and expires any pending orders
 * older than 72 hours (PENDING_MAX_AGE_MS) across both Prisma and local fallback store.
 *
 * Inside the 72-hour window, orders stay PENDING (awaiting payment / WhatsApp recovery)
 * unless paid (APPROVED) or explicitly declined after the USSD modal retry grace period.
 */
export async function syncPendingOrdersLifecycle(options?: { force?: boolean }) {
  const now = Date.now();
  if (!options?.force && now - lastPendingSyncTime < 15_000) {
    return;
  }
  lastPendingSyncTime = now;

  try {
    const cutoffDate = new Date(now - PENDING_MAX_AGE_MS);

    // 1. Batch-expire all PENDING orders older than 72 hours in Prisma
    await Promise.allSettled([
      prisma.order.updateMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: cutoffDate },
        },
        data: { status: 'EXPIRED' },
      }),
      prisma.transaction.updateMany({
        where: {
          status: 'PENDING',
          order: { createdAt: { lt: cutoffDate } },
        },
        data: { status: 'EXPIRED' },
      }),
    ]);

    // 2. Also expire any fallback local-store PENDING orders older than 72 hours
    try {
      const localPending = dbStore
        .getLocalOrders()
        .filter((o) => o.status === 'PENDING' && isPendingExpired(o.createdAt, now));
      if (localPending.length > 0) {
        await Promise.allSettled(
          localPending.map((lo) =>
            dbStore.updateOrderTransaction(lo.id, { status: 'EXPIRED' })
          )
        );
      }
    } catch {}

    // 3. Reconcile remaining active (< 72h) PENDING orders with Zenofy status
    const activePending = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { gte: cutoffDate },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        transaction: true,
        customer: true,
      },
    });

    if (activePending.length > 0) {
      await Promise.allSettled(
        activePending.map(async (po) => {
          try {
            const ageMs = now - po.createdAt.getTime();
            const checkoutId = po.transaction?.zenofyCheckoutId;
            if (!checkoutId) return;

            const zStatus = await zenofyProvider.getOrderStatus(checkoutId);
            if (zStatus.status === 'PAID') {
              await persistOrderStatus(po.id, po.transaction?.id, 'APPROVED');

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
                utmParams: (po.utmParams as Record<string, string | undefined> | null) || undefined,
                createdAt: po.createdAt.toISOString(),
                updatedAt: po.updatedAt.toISOString(),
              });
              return;
            }

            // Explicit gateway failure after the USSD modal retry window -> mark DECLINED (lost)
            if (zStatus.status === 'FAILED' && ageMs > USSD_RETRY_GRACE_MS) {
              await persistOrderStatus(po.id, po.transaction?.id, 'DECLINED');
            }
          } catch {}
        })
      );
    }
  } catch {}
}
