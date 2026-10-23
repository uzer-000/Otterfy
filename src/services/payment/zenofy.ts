import crypto from 'crypto';
import { getZenofyTierByPrice, getZenofyTierById } from '@/lib/zenofyPrices';

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
    const exactAmount = Math.max(1, Math.round(params.amount));

    const exactTierMatch = getZenofyTierByPrice(exactAmount);
    const paramTier = params.productId ? getZenofyTierById(params.productId) : undefined;
    const isParamExactMatch =
      Boolean(params.productId) &&
      (!paramTier || Math.round(paramTier.price) === exactAmount);

    const targetProductId =
      (isParamExactMatch ? params.productId : undefined) ||
      exactTierMatch?.id ||
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

    const cancelRedirectUrl = isLocalhost
      ? `${publicOrigin}/pay/cancel?ref=${params.reference}`
      : params.cancelUrl;

    const webhookUrl = `${publicOrigin}/api/webhooks/zenofy`;

    const authHeaders = {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
      'x-api-key': apiKey,
      Authorization: `Bearer ${apiKey}`,
    };

    // 1. Try direct dynamic API Gateway endpoint with user's official Zenofy account (/checkout/order-api-gateway)
    // Works for ANY custom price (10, 50, 120, 150, 190, 300 MZN) when configured with a Zenofy API Gateway product
    const gatewayProductId =
      process.env.ZENOFY_GATEWAY_PRODUCT_ID ||
      (isParamExactMatch ? params.productId : undefined) ||
      targetProductId;

    try {
      const gwRes = await fetch('https://api.zenofy.io/checkout/order-api-gateway', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          productId: gatewayProductId,
          amount: exactAmount,
          currency: 'MZN',
          language: 'pt',
          description: params.description || 'Compra Otterfy',
          reference: params.reference,
          customer: {
            name: customerName,
            email,
            phone: toZenofyPhone(params.customer.phone),
          },
          payment_methods: ['mpesa', 'emola'],
          success_url: successRedirectUrl,
          cancel_url: cancelRedirectUrl,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (gwRes.ok) {
        const gwData = await gwRes.json().catch(() => null);
        const gwId = gwData?.checkout_id || gwData?.orderId;
        if (gwId && gwData?.success !== false) {
          const rawUrl =
            gwData.checkout_url ||
            gwData.paymentUrl ||
            `https://pay.zenofy.io/c/${gwId}`;
          const checkoutUrl = rawUrl.includes('?') ? rawUrl : `${rawUrl}?lang=pt`;
          return {
            checkout_id: gwId,
            checkout_url: checkoutUrl,
            status: gwData.status || 'PENDING',
          };
        }
      }
    } catch {
      // Proceed to fixed-price product endpoint in user's Zenofy account below
    }

    // 2. Standard product endpoint in user's Zenofy account (/checkout/order-from-product)
    const body = {
      productId: targetProductId,
      customerName,
      email,
      phoneNumber: toZenofyPhone(params.customer.phone),
      currency: 'MZN',
      language: 'pt',
      bumpProductIds: [],
      redirectUrl: successRedirectUrl,
      webhookUrl,
    };

    let response: Response;
    try {
      response = await fetch('https://api.zenofy.io/checkout/order-from-product', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(12000),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Timeout ou erro de rede';
      throw new Error(`Falha ao conectar com o gateway Zenofy: ${message}`);
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = `HTTP ${response.status}`;
      }
      throw new Error(
        `Erro Zenofy (${response.status}): ${errorBody || 'Resposta inválida do provedor'}`
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error('Zenofy retornou resposta em formato inválido.');
    }

    if (!data.orderId && !data.checkout_id) {
      throw new Error(
        data.message || 'Zenofy não retornou identificador de pedido válido.'
      );
    }

    const checkoutId = data.orderId || data.checkout_id;
    const rawCheckoutUrl =
      data.paymentUrl || data.checkout_url || `https://pay.zenofy.io/o/${checkoutId}`;
    const checkoutUrl = rawCheckoutUrl.includes('?')
      ? rawCheckoutUrl
      : `${rawCheckoutUrl}?lang=pt`;

    return {
      checkout_id: checkoutId,
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
    method?: 'MPESA' | 'EMOLA',
    checkoutUrl?: string | null
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
      const candidateUrls = [
        checkoutUrl,
        `https://pay.zenofy.io/o/${encodeURIComponent(checkoutId)}?lang=pt`,
        `https://pay.zenofy.io/c/${encodeURIComponent(checkoutId)}?lang=pt`,
      ].filter((u): u is string => Boolean(u));

      let pageRes: Response | null = null;
      let resolvedPageUrl = candidateUrls[0];

      for (const url of candidateUrls) {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          pageRes = res;
          resolvedPageUrl = url;
          break;
        }
      }

      if (!pageRes || !pageRes.ok) {
        return {
          success: false,
          message: 'Pedido Zenofy não encontrado.',
        };
      }

      const setCookies =
        typeof pageRes.headers.getSetCookie === 'function'
          ? pageRes.headers.getSetCookie()
          : [pageRes.headers.get('set-cookie')].filter((c): c is string => Boolean(c));
      const cookieHeader = [...new Set(setCookies.map((c) => c.split(';')[0]))].join('; ');

      const html = await pageRes.text();
      const tokenMatch =
        html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/i) ||
        html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/i);
      const token = tokenMatch ? tokenMatch[1] : '';

      const payRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(token ? { RequestVerificationToken: token } : {}),
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          Origin: 'https://pay.zenofy.io',
          Referer: resolvedPageUrl,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
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
    customKey?: string
  ): Promise<OrderStatusResponse> {
    const apiKey = getApiKey(customKey);

    // 1. Try official API endpoint first (GET https://api.zenofy.io/checkout/order-status?orderId=...)
    try {
      const apiRes = await fetch(
        `https://api.zenofy.io/checkout/order-status?orderId=${encodeURIComponent(checkoutId)}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Api-Key': apiKey,
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        }
      );

      if (apiRes.ok) {
        const data = await apiRes.json();
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
          rawStatus === 'EXPIRED' ||
          rawStatus === 'REFUNDED';

        if (isPaid || isFailed) {
          return {
            success: Boolean(data.success ?? true),
            orderId: data.orderId || checkoutId,
            status: isPaid ? 'PAID' : 'FAILED',
            totalAmountMzn: data.totalAmount ?? data.totalAmountMzn,
            customer: data.customer,
          };
        }
      }
    } catch {
      // Fallback to pay.zenofy.io check below
    }

    // 2. Check pay.zenofy.io live order status endpoint
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
