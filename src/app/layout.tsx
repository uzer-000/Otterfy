import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

import OtterSplashScreen from "@/components/ui/OtterSplashScreen";
import GlobalLoadingProvider from "@/components/ui/GlobalLoadingProvider";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";

export const dynamic = "force-dynamic";

// Satoshi (Fontshare, licença gratuita) — fonte geométrica auto-alojada localmente
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  style: "normal",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b12" },
  ],
};

export const metadata: Metadata = {
  title: "Otterfy — Checkout de Pagamentos para Moçambique",
  description: "Plataforma de checkout e entrega de produtos digitais para Moçambique compatível com M-Pesa e e-Mola.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Otterfy",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${satoshi.variable} h-full w-full max-w-[100vw] overflow-x-hidden antialiased`} suppressHydrationWarning>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #0e0b12;
                max-width: 100vw;
                overflow-x: hidden;
                overscroll-behavior-x: none;
              }
              [data-theme="light"],
              [data-theme="light"] body {
                background-color: #f4f2ee;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('otterfy-theme') || 'light';
                  document.documentElement.setAttribute('data-theme', saved);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full w-full max-w-[100vw] overflow-x-hidden flex flex-col bg-[#0e0b12] text-[#F8FAFC] font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[10000] focus:px-4 focus:py-2.5 focus:rounded-xl focus:bg-emerald-700 focus:text-white focus:font-bold focus:text-sm focus:shadow-xl"
        >
          Saltar para o conteúdo principal
        </a>
        <OtterSplashScreen />
        <GlobalLoadingProvider>
          {children}
        </GlobalLoadingProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
