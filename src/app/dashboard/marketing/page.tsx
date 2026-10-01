'use client';

import React from 'react';
import ComingSoonPlaceholder from '@/components/dashboard/ComingSoonPlaceholder';

export default function MarketingPage() {
  return (
    <ComingSoonPlaceholder
      title="Cupons & Ofertas Promocionais"
      description="Em breve poderá criar cupões de desconto percentual ou fixo, configurar promoções relâmpago e criar regras especiais de carrinho."
      badge="Em Breve"
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
        </svg>
      }
    />
  );
}
