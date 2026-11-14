export const PENDING_MAX_AGE_HOURS = 72;
export const PENDING_MAX_AGE_MS = PENDING_MAX_AGE_HOURS * 60 * 60 * 1000;

/**
 * Grace period for interactive USSD push retry modal (~3 minutes).
 * Prevents a single failed PIN/timeout push attempt from prematurely blocking retries
 * while the buyer is still on the checkout confirmation modal.
 */
export const USSD_RETRY_GRACE_MS = 3 * 60 * 1000;

export const LOST_ORDER_STATUSES = ['EXPIRED', 'DECLINED', 'CANCELLED'] as const;

export function isLostOrderStatus(status?: string | null): boolean {
  const s = String(status || '').toUpperCase();
  return s === 'EXPIRED' || s === 'DECLINED' || s === 'CANCELLED';
}

export function isPendingExpired(createdAt: string | Date, nowMs: number = Date.now()): boolean {
  const createdMs = createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime();
  if (!Number.isFinite(createdMs)) return false;
  return nowMs - createdMs > PENDING_MAX_AGE_MS;
}

/**
 * Resolves when a lost/expired order effectively became lost/expired.
 * - CANCELLED / DECLINED: happens at updatedAt (when buyer cancelled or payment was declined)
 * - EXPIRED: happens when it expired (updatedAt, or at least createdAt)
 */
export function getEffectiveLostTimestampMs(order: {
  status?: string;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}): number {
  const createdMs =
    order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
  const safeCreated = Number.isFinite(createdMs) ? createdMs : Date.now();

  if (order.updatedAt) {
    const updatedMs =
      order.updatedAt instanceof Date ? order.updatedAt.getTime() : new Date(order.updatedAt).getTime();
    if (Number.isFinite(updatedMs) && updatedMs >= safeCreated) {
      return updatedMs;
    }
  }

  return safeCreated;
}
