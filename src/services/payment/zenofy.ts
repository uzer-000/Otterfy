import crypto from 'crypto';

export interface CreateCheckoutOrderParams {
  productId?: string;
  amount: number;
  currency?: string;
  reference: string;
  description: string;
  customer: {
    name?: string;
    email?: string;
    phone: string;
  };
  apiKey?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreateCheckoutOrderResponse {
  checkout_id: string;
  checkout_url: string;
  status: string;
}

export interface OrderStatusResponse {
  success: boolean;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | string;
  totalAmountMzn?: number;
  customer?: {
    name?: string;
    email?: string;
  };
}

function getApiKey(customKey?: string): string {
  const key = (process.env.ZENOFY_API_KEY || customKey || '').trim();
  if (!key) {
    throw new Error('ZENOFY_API_KEY não configurada no servidor.');
  }
  return key;
}

/** Returns the 9-digit local Mozambican number (e.g. 841234567). */
function normalizeMozPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('258') && digits.length >= 12) {
    return digits.slice(3, 12);
  }
  return digits.slice(-9);
}

/** Zenofy requires E.164 with country code, e.g. +258841234567. */
function toZenofyPhone(phone: string): string {
  return `+258${normalizeMozPhone(phone)}`;
}

export const zenofyProvider = {
  async createCheckoutOrder(
    params: CreateCheckoutOrderParams
  ): Promise<CreateCheckoutOrderResponse> {
    const apiKey = getApiKey(params.apiKey);

    const targetProductId =
      params.productId ||
      process.env.ZENOFY_PRODUCT_ID ||
      '6a14cb656c431b52f6375dc2';

    const formattedPhone = normalizeMozPhone(params.customer.phone);
    const customerName = params.customer.name?.trim() || 'Cliente';
    const email =
      params.customer.email && params.customer.email.includes('@')
        ? params.customer.email.trim()
        : `cliente.${formattedPhone}@otterfy.com`;

    let baseOrigin = 'https://otterfy-checkout.vercel.app';
    try {
      baseOrigin = new URL(params.successUrl).origin;
    } catch {
      // keep fallback
    }

    const isLocalhost =
      baseOrigin.includes('localhost') || baseOrigin.includes('127.0.0.1');
    const publicOrigin = isLocalhost
      ? process.env.NEXT_PUBLIC_APP_URL &&
        !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
        ? process.env.NEXT_PUBLIC_APP_URL
        : 'https://otterfy-checkout.vercel.app'
      : baseOrigin;

    const successRedirectUrl = isLocalhost
      ? `${publicOrigin}/pay/success?ref=${params.reference}`
      : params.successUrl;

    const webhookUrl = `${publicOrigin}/api/webhooks/zenofy`;

    const body = {
      productId: targetProductId,
      customerName,
      email,
      phoneNumber: toZenofyPhone(params.customer.phone),
      redirectUrl: successRedirectUrl,
      webhookUrl,
    };

    let response: Response;
    try {
      response = await fetch('https://api.zenofy.io/checkout/order-from-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
    } catch (netErr: unknown) {
      console.error('[Zenofy API Network Error]:', netErr);
      throw new Error('Falha de conexão com o gateway Zenofy.');
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[Zenofy API Error] Status:', response.status, errorText);
      throw new Error(
        `Erro no Zenofy (${response.status}): ${errorText || 'Falha ao processar checkout.'}`
      );
    }

    const data = await response.json();
    const checkoutUrl = data.paymentUrl || `https://pay.zenofy.io/o/${data.orderId}`;

    return {
      checkout_id: data.orderId,
      checkout_url: checkoutUrl,
      status: data.status || 'PENDING',
    };
  },

  async getOrderStatus(
    checkoutId: string,
    customKey?: string
  ): Promise<OrderStatusResponse> {
    const apiKey = getApiKey(customKey);

    try {
      const response = await fetch(
        `https://api.zenofy.io/checkout/order/${checkoutId}`,
        {
          method: 'GET',
          headers: {
            'Api-Key': apiKey,
          },
          signal: AbortSignal.timeout(6000),
        }
      );

      if (!response.ok) {
        return {
          success: false,
          orderId: checkoutId,
          status: 'PENDING',
        };
      }

      const data = await response.json();
      return {
        success: true,
        orderId: data.orderId || checkoutId,
        status: data.status || 'PENDING',
        totalAmountMzn: data.totalAmountMzn,
        customer: data.customer,
      };
    } catch {
      return {
        success: false,
        orderId: checkoutId,
        status: 'PENDING',
      };
    }
  },

  /**
   * Zenofy sends the shared secret configured on the product integration
   * verbatim in the `X-Webhook-Secret` header (no HMAC).
   */
  verifyWebhookSignature(_rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.ZENOFY_WEBHOOK_SECRET || '';
    if (!webhookSecret || !signature) return false;

    const a = crypto.createHash('sha256').update(signature.trim()).digest();
    const b = crypto.createHash('sha256').update(webhookSecret).digest();
    return crypto.timingSafeEqual(a, b);
  },
};
