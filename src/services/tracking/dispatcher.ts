import crypto from 'crypto';
import webpush from 'web-push';
import { formatSaleNotificationMessage, SALE_NOTIFICATION_TITLE } from '@/lib/utils';
import {
  getAllIntegrationsAsync,
  addWebhookLog,
  getPushSubscriptions,
  removePushSubscription,
} from './webhookConfig';

export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BKzVwF1vwtLCjElp3c-x9-_rJ7BDV7lXHiqAqiz9NglgP867pU82R0RGRUKW14TLnwvAXraItEf3neQbSV2c8HY';

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  '';

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:suporte@otterfy.co.mz';

let vapidConfigured = false;
function ensureVapidConfigured() {
  if (vapidConfigured) return;
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  } catch (err) {
    console.warn('[WebPush VAPID Setup Warning]:', err);
  }
}

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

// In-memory idempotency guard to prevent duplicate webhook/push firing within the same instance
const dispatchedOrderEvents = new Set<string>();

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
  const formattedAmt = new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);

  return {
    event,
    timestamp: new Date().toISOString(),
    notification: {
      title: event === 'order.approved' ? SALE_NOTIFICATION_TITLE : `Pedido (${event})`,
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

  let lastError = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
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

      if (!res.ok && res.status >= 500 && attempt === 1) {
        lastError = `HTTP ${res.status}`;
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }

      await addWebhookLog({
        url: url.trim(),
        event,
        orderId: options?.orderId || payload.order?.id || 'ORDER',
        productName: options?.productName || payload.productName || 'Produto',
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
      lastError = err?.message || 'Erro de conexão com o endpoint';
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    }
  }

  const durationMs = Date.now() - startTime;
  await addWebhookLog({
    url: url.trim(),
    event,
    orderId: options?.orderId || payload.order?.id || 'ORDER',
    productName: options?.productName || payload.productName || 'Produto',
    status: 0,
    ok: false,
    durationMs,
    error: lastError,
  });

  console.warn(`[Webhook Dispatch Error] to ${url}:`, lastError);
  return {
    ok: false,
    status: 0,
    statusText: 'Connection Failed',
    durationMs,
    error: lastError,
  };
}

/**
 * Dispatches real webhook payloads to:
 * 1) Product-specific webhook URL (if configured on the product)
 * 2) Global Webhook / n8n / Membership endpoints configured in /dashboard/integrations (persisted in Neon DB)
 */
export async function dispatchProductWebhook(
  product: TrackingProduct,
  event: string,
  order: OrderData
) {
  const dedupeKey = `wh:${order.id}:${event}`;
  if (dispatchedOrderEvents.has(dedupeKey)) {
    return [];
  }
  dispatchedOrderEvents.add(dedupeKey);

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
    // Always fire on order.approved if a product webhook URL is configured, or if event is in prodEvents
    if (event === 'order.approved' || prodEvents.length === 0 || prodEvents.includes(event)) {
      targets.push({
        url: prodUrl,
        secret: prodAuto?.webhookSecret,
      });
    }
  }

  // 2. Global Integrations (Webhook, n8n, Membership) from Neon DB + env fallback
  try {
    const integrations = await getAllIntegrationsAsync();
    for (const integ of integrations) {
      const hasUrl = Boolean(integ.fields?.webhookUrl?.startsWith('http') || integ.fields?.apiUrl?.startsWith('http'));
      if (integ.status !== 'Ativo' && !hasUrl) continue;

      if (integ.id === 'webhook' && integ.fields?.webhookUrl?.startsWith('http')) {
        const allowedEvents =
          integ.events && integ.events.length > 0
            ? integ.events
            : ['order.approved', 'order.created', 'order.declined', 'order.refunded'];
        if (event === 'order.approved' || allowedEvents.includes(event)) {
          targets.push({
            url: integ.fields.webhookUrl.trim(),
            secret: integ.fields.secret,
          });
        }
      } else if (integ.id === 'n8n' && integ.fields?.webhookUrl?.startsWith('http')) {
        const allowedEvents =
          integ.events && integ.events.length > 0
            ? integ.events
            : ['order.approved', 'order.created', 'order.declined', 'order.refunded'];
        if (event === 'order.approved' || allowedEvents.includes(event)) {
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
 * Sends Web Push notifications to all registered seller devices (Mobile PWA / Android / iOS / Desktop)
 * Works even when the browser or app is completely closed!
 */
export async function dispatchSaleWebPush(order: OrderData, product?: { id?: string; name?: string }) {
  const pushKey = `push:${order.id}`;
  if (dispatchedOrderEvents.has(pushKey)) return;
  dispatchedOrderEvents.add(pushKey);

  try {
    ensureVapidConfigured();
    const subs = await getPushSubscriptions();
    if (!subs || subs.length === 0) return;

    const amount = Number(order.amount) || 0;
    const pushPayload = JSON.stringify({
      title: SALE_NOTIFICATION_TITLE,
      body: formatSaleNotificationMessage(amount),
      icon: '/icon-192.png',
      badge: '/logo.png',
      tag: `sale-${order.id}`,
      orderId: order.id,
      amount,
      productName: product?.name || 'Produto Otterfy',
      url: '/dashboard',
    });

    await Promise.allSettled(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            pushPayload,
            { TTL: 86400, urgency: 'high' }
          );
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await removePushSubscription(sub.endpoint);
          } else {
            console.warn('[WebPush Send Error]:', err?.statusCode || err?.message);
          }
        }
      })
    );
  } catch (err) {
    console.warn('[WebPush Dispatch Warning]:', err);
  }
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
  const pixelId = tracking?.metaPixelId?.trim();
  const token = tracking?.metaApiToken?.trim();

  if (!pixelId || !token) return;

  const capiKey = `capi:${order.id}:${eventName}`;
  if (dispatchedOrderEvents.has(capiKey)) return;
  dispatchedOrderEvents.add(capiKey);

  const userData: Record<string, any> = {
    client_user_agent: userAgent || 'Otterfy/2.0',
    country: [sha256('mz')],
  };

  if (clientIp) {
    userData.client_ip_address = clientIp;
  }

  if (order.customerEmail) {
    userData.em = [sha256(order.customerEmail)];
  }

  if (order.customerPhone) {
    const digitsOnly = order.customerPhone.replace(/\D/g, '');
    const e164Digits = digitsOnly.startsWith('258') ? digitsOnly : `258${digitsOnly.slice(-9)}`;
    userData.ph = [sha256(e164Digits)];
  }

  if (order.customerName) {
    const parts = order.customerName.trim().split(/\s+/);
    if (parts[0]) userData.fn = [sha256(parts[0])];
    if (parts.length > 1) userData.ln = [sha256(parts[parts.length - 1])];
  }

  userData.external_id = [sha256(order.id)];

  const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://otterfy.vercel.app';
  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: `${eventName}_${order.id}`,
        event_source_url: `${baseAppUrl}/pay/${product.id}`,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: 'MZN',
          value: Number(order.amount),
          content_ids: [product.id],
          content_type: 'product',
          content_name: product.name,
          order_id: order.id,
        },
      },
    ],
  };

  try {
    const endpoint = `https://graph.facebook.com/v20.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const json = await res.json();
    console.log(`[Meta CAPI Dispatch] Pixel ${pixelId} (${eventName}) ->`, json);
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
      const allIntegs = await getAllIntegrationsAsync();
      const utmifyGlobal = allIntegs.find((i) => i.id === 'utmify' && (i.status === 'Ativo' || i.fields?.apiToken));
      if (utmifyGlobal) {
        pixelId = utmifyGlobal.fields?.pixelId;
        token = utmifyGlobal.fields?.apiToken;
      }
    } catch {}
  }

  if (!pixelId && !token) return;

  const utmKey = `utmify:${order.id}:${order.status}`;
  if (dispatchedOrderEvents.has(utmKey)) return;
  dispatchedOrderEvents.add(utmKey);

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
      signal: AbortSignal.timeout(6000),
    });

    console.log(`[Utmify Dispatch] -> Status ${res.status}`);
  } catch (err: any) {
    console.warn(`[Utmify Dispatch Error]:`, err.message);
  }
}

/**
 * Unified helper to fire all approved-order side effects (Webhooks, Web Push, Meta CAPI, Utmify)
 * and await them before the serverless function returns.
 */
export async function dispatchAllApprovedOrderEvents(
  product: TrackingProduct | null | undefined,
  order: OrderData
) {
  const safeProduct: TrackingProduct = product || {
    id: order.productId || 'otterfy_product',
    name: 'Produto Otterfy',
  };
  const approvedOrder: OrderData = { ...order, status: 'APPROVED' };

  await Promise.allSettled([
    dispatchSaleWebPush(approvedOrder, safeProduct),
    dispatchProductWebhook(safeProduct, 'order.approved', approvedOrder),
    dispatchMetaCapi(safeProduct, 'Purchase', approvedOrder),
    dispatchUtmifyOrder(safeProduct, approvedOrder),
  ]);
}
