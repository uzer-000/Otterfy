// Otterfy Service Worker for Real Background Web Push & System Notifications (v2.2)
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function formatMznBody(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return 'Valor : MT 0,00';
  }
  try {
    const formatted = new Intl.NumberFormat('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
    return `Valor : MT ${formatted}`;
  } catch {
    return `Valor : MT ${amount},00`;
  }
}

// Receive Web Push messages from Otterfy server even when the app/browser is completely closed!
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Venda Aprovada - Otterfy',
    body: 'Valor : MT 0,00',
    icon: '/icon-192.png',
    badge: '/logo.png',
    tag: 'otterfy-sale',
    url: '/dashboard',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
        title: parsed.title || 'Venda Aprovada - Otterfy',
      };
      if (parsed.amount !== undefined && !parsed.body) {
        payload.body = formatMznBody(parsed.amount);
      }
    } catch {
      try {
        payload.body = event.data.text() || payload.body;
      } catch {}
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/logo.png',
    tag: payload.tag || `sale-${Date.now()}`,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: payload.url || '/dashboard',
      orderId: payload.orderId,
      amount: payload.amount,
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Handle notification click to focus or open dashboard
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
