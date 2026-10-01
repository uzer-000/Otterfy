import crypto from 'crypto';

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
    webhookEvents?: string[];
  };
}

interface OrderData {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  paymentMethod?: string;
  status: string;
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

/**
 * Dispatches a real webhook payload to the external URL configured on the product
 */
export async function dispatchProductWebhook(
  product: TrackingProduct,
  event: string,
  order: OrderData
) {
  const url = product.automation?.webhookUrl;
  if (!url || !url.startsWith('http')) return;

  const events = product.automation?.webhookEvents || ['order.approved'];
  if (events.length > 0 && !events.includes(event)) {
    return;
  }

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    productId: product.id,
    productName: product.name,
    order: {
      id: order.id,
      amount: order.amount,
      currency: 'MZN',
      status: order.status,
      paymentMethod: order.paymentMethod || 'MPESA',
      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail || null,
      },
      utm: order.utmParams || {},
      createdAt: order.createdAt || new Date().toISOString(),
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Otterfy-Webhook-Engine/1.0',
        'X-Otterfy-Event': event,
        'X-Otterfy-Product-Id': product.id,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    console.log(`[Webhook Dispatch] ${url} -> Status ${res.status}`);
    return { ok: res.ok, status: res.status };
  } catch (err: any) {
    console.warn(`[Webhook Dispatch Error] to ${url}:`, err.message);
    return { ok: false, error: err.message };
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
  const pixelId = product.tracking?.metaPixelId;
  const token = product.tracking?.metaApiToken;

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
    // Normalise phone: remove + and non-digits
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
  const pixelId = product.tracking?.utmifyPixelId;
  const token = product.tracking?.utmifyToken;

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
    // Utmify webhook endpoint
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
