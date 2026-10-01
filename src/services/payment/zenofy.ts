import crypto from 'crypto';

export interface ZenofyCustomer {
  name: string;
  email?: string;
  phone: string;
}

export interface CreateCheckoutParams {
  amount: number; // in MZN
  reference: string;
  description: string;
  customer: ZenofyCustomer;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  expires_at: string;
}

export interface OrderStatusResponse {
  success: boolean;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
  currency: string;
  totalAmount: number;
}

const ZENOFY_API_KEY = process.env.ZENOFY_API_KEY || '';
const ZENOFY_PRODUCT_ID = process.env.ZENOFY_PRODUCT_ID || '';
const ZENOFY_WEBHOOK_SECRET = process.env.ZENOFY_WEBHOOK_SECRET || '';

export const zenofyProvider = {
  async createCheckoutOrder(params: CreateCheckoutParams): Promise<CreateCheckoutResponse> {
    if (!ZENOFY_API_KEY) {
      throw new Error('Chave da API do Zenofy não configurada.');
    }

    // Convert amount to minor units (x100)
    const amountMinorUnits = Math.round(params.amount * 100);

    const body = {
      productId: ZENOFY_PRODUCT_ID,
      amount: amountMinorUnits,
      currency: 'MZN',
      reference: params.reference,
      description: params.description,
      customer: params.customer,
      payment_methods: ['mpesa', 'emola'],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      language: 'pt'
    };

    const response = await fetch('https://api.zenofy.io/checkout/order-api-gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': ZENOFY_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao criar checkout no Zenofy:', errorText);
      throw new Error('Erro ao processar o pagamento com Zenofy.');
    }

    return response.json();
  },

  async getOrderStatus(checkoutId: string): Promise<OrderStatusResponse> {
    if (!ZENOFY_API_KEY) {
      throw new Error('Chave da API do Zenofy não configurada.');
    }

    const response = await fetch(`https://api.zenofy.io/checkout/order-status?orderId=${checkoutId}`, {
      method: 'GET',
      headers: {
        'Api-Key': ZENOFY_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao buscar status no Zenofy:', errorText);
      throw new Error('Erro ao verificar o status do pagamento no Zenofy.');
    }

    return response.json();
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    if (!ZENOFY_WEBHOOK_SECRET) {
      console.warn('ZENOFY_WEBHOOK_SECRET não está configurado.');
      return false;
    }

    const expectedSignaturePrefix = 'sha256=';
    if (!signature.startsWith(expectedSignaturePrefix)) {
      return false;
    }

    const hash = crypto
      .createHmac('sha256', ZENOFY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    const expectedSignature = expectedSignaturePrefix + hash;

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (e) {
      return false;
    }
  }
};
