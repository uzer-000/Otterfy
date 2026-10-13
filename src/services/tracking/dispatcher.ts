import crypto from 'crypto';
import { formatSaleNotificationMessage } from '@/lib/utils';
import { getAllIntegrations, addWebhookLog } from './webhookConfig';

interface TrackingProduct {
  id: string;
  name: string;
  tracking?: {
    metaPixelId?: string;
    metaApiToken?: string;
    tiktokPixelId?: string;
    tiktokAccessToken?: string;
    utmifyPixelId?: string;
    utmifyToken?: string;
  };
  automation?: {
    webhookUrl?: string;
    webhookSecret?: string;
    webhookEvents?: string[];
  };
  checkoutSettings?: any;
}

export interface OrderData {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  paymentMethod?: string;
  status: string;
  hasOrderBump?: boolean;
  orderBumpTitle?: string;
  orderBumpAmount?: number;
  createdAt?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  [key: string]: any;
}

function sha256(val: string): string {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

function hmacSha256(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

export function buildWebhookPayload(
  product: { id: string; name: string },
  event: string,
  order: OrderData
) {
  const numAmount = Number(order.amount) || 0;
  const formattedAmt = Number.isInteger(numAmount) ? `${numAmount}` : numAmount.toFixed(2);

  return {
    event,
    timestamp: new Date().toISOString(),
    notification: {
      title: event === 'order.approved' ? 'Venda Aprovada' : `Pedido (${event})`,
      message: formatSaleNotificationMessage(numAmount),
    },
    productId: product.id,
    productName: product.name,
    product: {
      id: product.id,
      name: product.name,
    },
    order: {
      id: order.id,
      amount: numAmount,
      formattedAmount: `MT ${formattedAmt}`,
      currency: 'MZN',
      status: order.status,
      paymentMethod: order.paymentMethod || order.transaction?.method || 'MPESA',
      hasOrderBump: Boolean(order.hasOrderBump),
      orderBumpTitle: order.orderBumpTitle || null,
      orderBumpAmount: order.orderBumpAmount || null,
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || null,
      },
      utm: order.utmParams || {},
      createdAt: order.createdAt || new Date().toISOString(),
    },
  };
}

export async function sendSingleWebhook(
  url: string,
  event: string,
  payload: any,
  options?: {
    secret?: string;
    authHeader?: string;
    productId?: string;
    productName?: string;
    orderId?: string;
  }
) {
  const startTime = Date.now();
  const bodyStr = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Otterfy-Webhook-Engine/2.0',
    'X-Otterfy-Event': event,
    'X-Otterfy-Product-Id': options?.productId || payload.productId || 'global',
    'X-Otterfy-Delivery': `wh_${Date.now()}`,
  };

  if (options?.secret?.trim()) {
    const sig = hmacSha256(options.secret.trim(), bodyStr);
    headers['X-Otterfy-Signature'] = `sha256=${sig}`;
    headers['X-Signature'] = sig;
  }

  if (options?.authHeader?.trim()) {
    headers['Authorization'] = options.authHeader.trim();
  }

  try {
    const res = await fetch(url.trim(), {
      method: 'POST',
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(8000),
    });

    const durationMs = Date.now() - startTime;
    let responseText = '';
    try {
      responseText = (await res.text()).slice(0, 300);
    } catch {}

    addWebhookLog({
      url: url.trim(),
      event,
      orderId: options?.orderId || payload.order?.id || 'TEST',
      productName: options?.productName || payload.productName || 'Teste Webhook',
      status: res.status,
      ok: res.ok,
      durationMs,
      responsePreview: responseText,
    });

    console.log(`[Webhook Dispatch] ${url} (${event}) -> Status ${res.status} (${durationMs}ms)`);
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      durationMs,
      responsePreview: responseText,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const errMsg = err?.message || 'Erro de conexão com o endpoint';

    addWebhookLog({
      url: url.trim(),
      event,
      orderId: options?.orderId || payload.order?.id || 'TEST',
      productName: options?.productName || payload.productName || 'Teste Webhook',
      status: 0,
      ok: false,
      durationMs,
      error: errMsg,
    });

    console.warn(`[Webhook Dispatch Error] to ${url}:`, errMsg);
    return {
      ok: false,
      status: 0,
      statusText: 'Connection Failed',
      durationMs,
      error: errMsg,
    };
  }
}

/**
 * Dispatches real webhook payloads to:
 * 1) Product-specific webhook URL (if configured on the product)
 * 2) Global Webhook / n8n / Membership endpoints configured in /dashboard/integrations or /dashboard/automations
 */
export async function dispatchProductWebhook(
  product: TrackingProduct,
  event: string,
  order: OrderData
) {
  const targets: Array<{
    url: string;
    secret?: string;
    authHeader?: string;
  }> = [];

  // 1. Product-level webhook
  const prodAuto = product.automation || product.checkoutSettings?._automation;
  const prodUrl = prodAuto?.webhookUrl?.trim();
  if (prodUrl && prodUrl.startsWith('http')) {
    const prodEvents = prodAuto?.webhookEvents || ['order.approved'];
    if (prodEvents.length === 0 || prodEvents.includes(event)) {
      targets.push({
        url: prodUrl,
        secret: prodAuto?.webhookSecret,
      });
    }
  }

  // 2. Global Integrations (Webhook, n8n, Membership)
  try {
    const integrations = getAllIntegrations();
    for (const integ of integrations) {
      if (integ.status !== 'Ativo') continue;

      if (integ.id === 'webhook' && integ.fields?.webhookUrl?.startsWith('http')) {
        const allowedEvents = integ.events && integ.events.length > 0 ? integ.events : ['order.approved', 'order.created', 'order.declined', 'order.refunded'];
        if (allowedEvents.includes(event)) {
          targets.push({
            url: integ.fields.webhookUrl.trim(),
            secret: integ.fields.secret,
          });
        }
      } else if (integ.id === 'n8n' && integ.fields?.webhookUrl?.startsWith('http')) {
        const allowedEvents = integ.events && integ.events.length > 0 ? integ.events : ['order.approved', 'order.created', 'order.declined', 'order.refunded'];
        if (allowedEvents.includes(event)) {
          targets.push({
            url: integ.fields.webhookUrl.trim(),
            authHeader: integ.fields.authHeader,
          });
        }
      } else if (integ.id === 'membership' && event === 'order.approved' && integ.fields?.apiUrl?.startsWith('http')) {
        targets.push({
          url: integ.fields.apiUrl.trim(),
        });
      }
    }
  } catch (e) {
    console.warn('Error reading global integrations for webhook dispatch:', e);
  }

  // Deduplicate by URL
  const uniqueTargets = targets.filter(
    (t, index, self) => index === self.findIndex((x) => x.url === t.url)
  );

  if (uniqueTargets.length === 0) return [];

  const payload = buildWebhookPayload(product, event, order);

  const results = await Promise.allSettled(
    uniqueTargets.map((target) =>
      sendSingleWebhook(target.url, event, payload, {
        secret: target.secret,
        authHeader: target.authHeader,
        productId: product.id,
        productName: product.name,
        orderId: order.id,
      })
    )
  );

  return results;
}

/**
 * Dispatches server-to-server Meta Conversions API (CAPI) event
 */
export async function dispatchMetaCapi(
  product: TrackingProduct,
  eventName: 'Purchase' | 'InitiateCheckout',
  order: OrderData,
  clientIp?: string,
  userAgent?: string
) {
  const tracking = product.tracking || product.checkoutSettings?._tracking;
  const pixelId = tracking?.metaPixelId;
  const token = tracking?.metaApiToken;

  if (!pixelId || !token) return;

  const userData: Record<string, any> = {
    client_user_agent: userAgent || 'Otterfy/1.0',
  };

  if (clientIp) {
    userData.client_ip_address = clientIp;
  }

  if (order.customerEmail) {
    userData.em = [sha256(order.customerEmail)];
  }

  if (order.customerPhone) {
    const digitsOnly = order.customerPhone.replace(/\D/g, '');
    userData.ph = [sha256(digitsOnly)];
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: `https://checkout.otterfy.co.mz/pay/${product.id}`,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: 'MZN',
          value: Number(order.amount),
          content_ids: [product.id],
          content_name: product.name,
          order_id: order.id,
        },
      },
    ],
  };

  try {
    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    const json = await res.json();
    console.log(`[Meta CAPI Dispatch] Pixel ${pixelId} ->`, json);
  } catch (err: any) {
    console.warn(`[Meta CAPI Error]:`, err.message);
  }
}

/**
 * Dispatches conversion event to Utmify API
 */
export async function dispatchUtmifyOrder(
  product: TrackingProduct,
  order: OrderData
) {
  const tracking = product.tracking || product.checkoutSettings?._tracking;
  let pixelId = tracking?.utmifyPixelId;
  let token = tracking?.utmifyToken;

  // Fallback to global Utmify integration if configured in /dashboard/integrations
  if (!pixelId && !token) {
    try {
      const utmifyGlobal = getAllIntegrations().find((i) => i.id === 'utmify' && i.status === 'Ativo');
      if (utmifyGlobal) {
        pixelId = utmifyGlobal.fields?.pixelId;
        token = utmifyGlobal.fields?.apiToken;
      }
    } catch {}
  }

  if (!pixelId && !token) return;

  const payload = {
    pixel_id: pixelId,
    token: token,
    order_id: order.id,
    product_id: product.id,
    product_name: product.name,
    amount: order.amount,
    currency: 'MZN',
    status: order.status === 'APPROVED' ? 'paid' : 'waiting_payment',
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || '',
    utm_source: order.utmParams?.source,
    utm_medium: order.utmParams?.medium,
    utm_campaign: order.utmParams?.campaign,
    utm_content: order.utmParams?.content,
    utm_term: order.utmParams?.term,
  };

  try {
    const res = await fetch('https://api.utmify.com.br/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    console.log(`[Utmify Dispatch] -> Status ${res.status}`);
  } catch (err: any) {
    console.warn(`[Utmify Dispatch Error]:`, err.message);
  }
}
