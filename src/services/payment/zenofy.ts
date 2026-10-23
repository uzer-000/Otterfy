import crypto from 'crypto';

export const DEFAULT_ZENOFY_API_KEY =
  '';

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

export interface TriggerUssdPushResponse {
  success: boolean;
  message?: string;
  redirectUrl?: string;
}

function getApiKey(customKey?: string): string {
  const envKey = (process.env.ZENOFY_API_KEY || '').trim();
  if (envKey && !envKey.startsWith('pco_ck_Slm1Z')) {
    return envKey;
  }
  const cleanCustom = (customKey || '').trim();
  if (cleanCustom && !cleanCustom.startsWith('pco_ck_Slm1Z')) {
    return cleanCustom;
  }
  return DEFAULT_ZENOFY_API_KEY;
}

/** Returns the 9-digit local Mozambican number (e.g. 841234567). */
export function normalizeMozPhone(phone: string): string {
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

/**
 * Zenofy requires at least two names (e.g. "Joao Jose").
 * If the buyer enters a single name, append "Cliente" so Zenofy accepts the order.
 */
function toZenofyFullName(rawName?: string): string {
  const cleaned = (rawName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'Cliente Otterfy';
  if (!cleaned.includes(' ')) {
    return `${cleaned} Cliente`;
  }
  return cleaned;
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
    const customerName = toZenofyFullName(params.customer.name);
    const email =
      params.customer.email && params.customer.email.includes('@')
        ? params.customer.email.trim()
        : `cliente.${formattedPhone}@otterfy.com`;

    let baseOrigin = 'https://otterfy.vercel.app';
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
        : 'https://otterfy.vercel.app'
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
    if (data?.success === false || !data?.orderId) {
      console.error('[Zenofy Order Creation Rejected]:', data);
      throw new Error(
        data?.message || 'Não foi possível iniciar o pedido no gateway Zenofy.'
      );
    }

    const checkoutUrl = data.paymentUrl || `https://pay.zenofy.io/o/${data.orderId}`;

    return {
      checkout_id: data.orderId,
      checkout_url: checkoutUrl,
      status: data.status || 'PENDING',
    };
  },

  /**
   * Triggers the direct USSD STK Push on the customer's phone (Vodacom M-Pesa or Movitel e-Mola)
   * via Zenofy's checkout processor for an existing Zenofy orderId.
   */
  async triggerUssdPush(
    checkoutId: string,
    phone: string,
    method?: 'MPESA' | 'EMOLA'
  ): Promise<TriggerUssdPushResponse> {
    const cleanPhone = normalizeMozPhone(phone);
    if (!/^8[4567]\d{7}$/.test(cleanPhone)) {
      return {
        success: false,
        message: 'Número inválido. Use 9 dígitos começando por 84/85 (M-Pesa) ou 86/87 (e-Mola).',
      };
    }

    const isEmola =
      cleanPhone.startsWith('86') ||
      cleanPhone.startsWith('87') ||
      (!cleanPhone.startsWith('84') && !cleanPhone.startsWith('85') && method === 'EMOLA');

    const endpoint = isEmola
      ? 'https://pay.zenofy.io/checkout/processemolapayment'
      : 'https://pay.zenofy.io/checkout/processmpesapayment';

    try {
      const pageUrl = `https://pay.zenofy.io/o/${encodeURIComponent(checkoutId)}`;
      const pageRes = await fetch(pageUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (!pageRes.ok) {
        return {
          success: false,
          message: `Pedido Zenofy não encontrado (${pageRes.status}).`,
        };
      }

      const setCookies =
        typeof pageRes.headers.getSetCookie === 'function'
          ? pageRes.headers.getSetCookie()
          : [pageRes.headers.get('set-cookie')].filter((c): c is string => Boolean(c));
      const cookieHeader = setCookies.map((c) => c.split(';')[0]).join('; ');

      const html = await pageRes.text();
      const tokenMatch =
        html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/i) ||
        html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
      const token = tokenMatch ? tokenMatch[1] : '';

      const payRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { RequestVerificationToken: token } : {}),
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          Origin: 'https://pay.zenofy.io',
          Referer: pageUrl,
        },
        body: JSON.stringify({
          orderId: checkoutId,
          phoneNumber: cleanPhone,
        }),
        signal: AbortSignal.timeout(55000),
      });

      const result = await payRes.json().catch(() => ({}));
      return {
        success: Boolean(result?.success),
        message: result?.message,
        redirectUrl: result?.redirectUrl,
      };
    } catch (err: unknown) {
      console.warn('[Zenofy USSD Push Warning]:', err);
      return {
        success: false,
        message: 'Aguardando confirmação do PIN no telemóvel.',
      };
    }
  },

  async getOrderStatus(
    checkoutId: string,
    _customKey?: string
  ): Promise<OrderStatusResponse> {
    try {
      const response = await fetch(
        `https://pay.zenofy.io/checkout/checkorderstatus?orderId=${encodeURIComponent(checkoutId)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
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
      const rawStatus = String(data.status || '').toUpperCase();
      const isPaid =
        data.isCompleted === true ||
        rawStatus === 'PAID' ||
        rawStatus === 'COMPLETED' ||
        rawStatus === 'APPROVED' ||
        rawStatus === 'SUCCESS';
      const isFailed =
        data.isFailed === true ||
        rawStatus === 'FAILED' ||
        rawStatus === 'CANCELLED' ||
        rawStatus === 'DECLINED' ||
        rawStatus === 'EXPIRED';

      return {
        success: Boolean(data.success ?? true),
        orderId: data.orderId || checkoutId,
        status: isPaid ? 'PAID' : isFailed ? 'FAILED' : 'PENDING',
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
