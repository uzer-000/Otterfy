import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Otterfy — Checkout de Pagamentos",
  description: "Checkout de pagamentos para Moçambique. eMola & M-Pesa.",
  icons: {
    icon: "/favicon.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('otterfy-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', saved);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#08070C] text-[#F8FAFC] font-sans">
        {children}
      </body>
    </html>
  );
}
