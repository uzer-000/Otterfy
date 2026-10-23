'use client';

import React, { useLayoutEffect } from 'react';

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (typeof document !== 'undefined') {
    try {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.style.backgroundColor = '#F5F3FA';
        document.body.style.color = '#0F172A';
      }
    } catch {}
  }

  useLayoutEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      if (document.body) {
        document.body.style.backgroundColor = '#F5F3FA';
        document.body.style.color = '#0F172A';
      }
    } catch {}
  }, []);

  return (
    <div
      id="pay-checkout-root-container"
      data-theme="light"
      style={{
        backgroundColor: '#F5F3FA',
        color: '#0F172A',
        colorScheme: 'light',
      }}
      className="pay-checkout-root light min-h-dvh w-full max-w-[100vw] overflow-x-hidden overscroll-x-none bg-[#F5F3FA] text-[#0F172A] antialiased font-sans"
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.classList.remove('dark');
                if (document.body) {
                  document.body.style.backgroundColor = '#F5F3FA';
                  document.body.style.color = '#0F172A';
                }
              } catch(e) {}
            })();
          `,
        }}
      />
      {children}
    </div>
  );
}
