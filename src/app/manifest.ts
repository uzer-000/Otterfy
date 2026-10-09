import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Otterfy — Checkout de Pagamentos',
    short_name: 'Otterfy',
    description: 'Gerencie suas vendas M-Pesa & e-Mola e receba notificações em tempo real.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0e0b12',
    theme_color: '#0e0b12',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/favicon.png',
        sizes: '1024x1024',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
