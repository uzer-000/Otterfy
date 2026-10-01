import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Otterfy — Checkout de Pagamentos',
    short_name: 'Otterfy',
    description: 'Gerencie suas vendas M-Pesa & e-Mola e receba notificações em tempo real.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#08070C',
    theme_color: '#7C3AED',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
