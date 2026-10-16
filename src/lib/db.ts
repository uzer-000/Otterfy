import type { ProductItem, OrderItem } from './store';

export interface Product extends Omit<ProductItem, 'description'> {
  description: string;
}

export interface Transaction {
  id: string;
  productId: string;
  customerName?: string;
  customerPhone: string;
  customerEmail?: string | null;
  amount: number;
  gateway: 'MPESA' | 'EMOLA' | string;
  status: 'PAID' | 'APPROVED' | 'PENDING' | 'FAILED' | 'DECLINED' | 'REFUNDED' | string;
  createdAt: string;
}

export function normalizeTransactions(payload: unknown): Transaction[] {
  const rawList: OrderItem[] = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: OrderItem[] }).data)
    ? (payload as { data: OrderItem[] }).data
    : [];

  return rawList.map((item) => {
    const rawStatus = (item.status || 'PENDING').toUpperCase();
    const mappedStatus =
      rawStatus === 'APPROVED' || rawStatus === 'PAID'
        ? 'PAID'
        : rawStatus === 'DECLINED' || rawStatus === 'FAILED'
        ? 'FAILED'
        : 'PENDING';

    const gateway =
      item.transaction?.method ||
      ((item as unknown as { gateway?: string }).gateway ?? 'MPESA');

    return {
      id: item.id,
      productId: item.productId,
      customerName: item.customerName,
      customerPhone: item.customerPhone || '',
      customerEmail: item.customerEmail || undefined,
      amount: Number(item.amount) || 0,
      gateway,
      status: mappedStatus,
      createdAt: item.createdAt || new Date().toISOString(),
    };
  });
}
