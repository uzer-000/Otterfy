export interface CheckoutFormData {
  name: string;
  phone: string;
  email?: string;
  paymentMethod: 'EMOLA' | 'MPESA';
}

export interface KPIData {
  revenue: number;
  salesCount: number;
  percentChange: number;
}

export interface ZenofyCreateOrderRequest {
  amount: number; // minor units
  currency: 'MZN';
  success_url: string;
  cancel_url: string;
  metadata?: Record<string, string>;
  customer?: {
    name: string;
    email?: string;
    phone: string;
  };
}

export interface ZenofyCreateOrderResponse {
  checkout_id: string;
  checkout_url: string;
  status: string;
}

export interface ZenofyOrderStatusResponse {
  payment_id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED' | 'EXPIRED';
  amount: number;
  currency: string;
  created_at: string;
}

export interface ZenofyWebhookPayload {
  payment_id: string;
  checkout_id: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED' | 'EXPIRED';
  metadata: Record<string, string>;
  amount: number;
}

export interface PaymentMethodOption {
  id: 'EMOLA' | 'MPESA';
  name: string;
  icon: string;
}

export type DashboardFilter = 'today' | 'week' | 'month' | 'year' | 'all';
