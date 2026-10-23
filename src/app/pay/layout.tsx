'use client';

import React, { useLayoutEffect } from 'react';

export default function PayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    const enforceLightOnPay = () => {
      try {
        document.documentElement.setAttribute('data-theme', 'checkout');
        document.documentElement.classList.remove('dark');
        document.documentElement.style.colorScheme = 'light';
        if (document.body) {
          document.body.style.backgroundColor = '#F5F3FA';
          document.body.style.color = '#0F172A';
        }
      } catch {}
    };

    enforceLightOnPay();

    const observer = new MutationObserver(() => {
      if (
        document.documentElement.getAttribute('data-theme') !== 'checkout' ||
        document.documentElement.classList.contains('dark')
      ) {
        enforceLightOnPay();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => {
      observer.disconnect();
      try {
        const saved = (localStorage.getItem('otterfy-theme') as 'dark' | 'light') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        document.documentElement.style.colorScheme = saved;
        if (document.body) {
          document.body.style.backgroundColor = '';
          document.body.style.color = '';
        }
      } catch {}
    };
  }, []);

  return (
    <div
      id="pay-checkout-root-container"
      data-checkout-root="true"
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
                document.documentElement.setAttribute('data-theme', 'checkout');
                document.documentElement.classList.remove('dark');
                document.documentElement.style.colorScheme = 'light';
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
