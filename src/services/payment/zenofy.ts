import crypto from 'crypto';

export interface ZenofyCustomer {
  name: string;
  email?: string;
  phone: string;
}

export interface CreateCheckoutParams {
  productId?: string;
  amount?: number; // in MZN
  reference: string;
  description?: string;
  customer: ZenofyCustomer;
  apiKey?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  expires_at?: string;
}

export interface OrderStatusResponse {
  success: boolean;
  orderId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED';
  currency: string;
  totalAmount: number;
}

function getApiKey(customKey?: string): string {
  return customKey || process.env.ZENOFY_API_KEY || 'pco_ck_Slm1ZREq0Mp5Fsrn6uZiR-SXQ8WBlheCXzESal0S73Y';
}

function normalizeMozPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[\s\-\(\)]/g, '');
  if (!cleaned) return '+258840000000';
  if (cleaned.startsWith('+258')) return cleaned;
  if (cleaned.startsWith('258')) return `+${cleaned}`;
  if (cleaned.startsWith('8') && cleaned.length === 9) return `+258${cleaned}`;
  return cleaned.startsWith('+') ? cleaned : `+258${cleaned}`;
}

export const zenofyProvider = {
  async createCheckoutOrder(params: CreateCheckoutParams): Promise<CreateCheckoutResponse> {
    const apiKey = getApiKey(params.apiKey);
    if (!apiKey) {
      throw new Error('Chave da API do Zenofy não configurada.');
    }

    const targetProductId =
      params.productId ||
      process.env.ZENOFY_PRODUCT_ID ||
      '6a14cb656c431b52f6375dc2';

    const formattedPhone = normalizeMozPhone(params.customer.phone);
    const customerName = params.customer.name?.trim() || 'Cliente';
    const email = params.customer.email?.trim() || 'cliente@otterfy.mz';

    const successRedirectUrl =
      params.successUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://otterfy.vercel.app'}/pay/success?ref=${params.reference}`;
    const cancelRedirectUrl =
      params.cancelUrl ||
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://otterfy.vercel.app'}/pay/cancel?ref=${params.reference}`;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://otterfy.vercel.app'}/api/webhooks/zenofy`;

    const body = {
      productId: targetProductId,
      customerName,
      email,
      phoneNumber: formattedPhone,
      reference: params.reference,
      redirectUrl: successRedirectUrl,
      successUrl: successRedirectUrl,
      returnUrl: successRedirectUrl,
      cancelUrl: cancelRedirectUrl,
      webhookUrl,
    };

    console.log('[Zenofy API] Creating order from product:', {
      productId: targetProductId,
      customerName,
      email,
      phoneNumber: formattedPhone,
      redirectUrl: successRedirectUrl,
    });

    let response: Response;
    try {
      response = await fetch('https://api.zenofy.io/checkout/order-from-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify(body),
      });
    } catch (netErr: any) {
      console.error('[Zenofy API Network Error]:', netErr);
      throw new Error('Falha de conexão com a API de pagamento. Verifique sua conexão com a internet.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Zenofy API Error] Status:', response.status, errorText);
      throw new Error(`Erro no Zenofy (${response.status}): ${errorText || 'Falha ao processar checkout'}`);
    }

    const data = await response.json();
    console.log('[Zenofy API Success] Created order:', data);

    const checkoutUrl = data.paymentUrl || `https://pay.zenofy.io/o/${data.orderId}`;

    return {
      checkout_id: data.orderId,
      checkout_url: checkoutUrl,
      expires_at: '',
    };
  },

  async getOrderStatus(checkoutId: string, customApiKey?: string): Promise<OrderStatusResponse> {
    const apiKey = getApiKey(customApiKey);
    if (!apiKey) {
      return {
        success: false,
        orderId: checkoutId,
        status: 'PENDING',
        currency: 'MZN',
        totalAmount: 0,
      };
    }

    try {
      const response = await fetch(`https://api.zenofy.io/checkout/order-status?orderId=${checkoutId}`, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Zenofy API Error] getOrderStatus:', errorText);
        return {
          success: false,
          orderId: checkoutId,
          status: 'PENDING',
          currency: 'MZN',
          totalAmount: 0,
        };
      }

      return await response.json();
    } catch (err: any) {
      console.warn('[Zenofy getOrderStatus Fetch Error]:', err?.message || err);
      return {
        success: false,
        orderId: checkoutId,
        status: 'PENDING',
        currency: 'MZN',
        totalAmount: 0,
      };
    }
  },

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.ZENOFY_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.warn('ZENOFY_WEBHOOK_SECRET não está configurado.');
      return false;
    }

    const expectedSignaturePrefix = 'sha256=';
    if (!signature.startsWith(expectedSignaturePrefix)) {
      return false;
    }

    const hash = crypto
      .createHmac('sha256', webhookSecret)
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
  },
};
export default zenofyProvider;
