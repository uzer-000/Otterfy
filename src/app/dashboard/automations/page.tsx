'use client';

import React from 'react';
import ComingSoonPlaceholder from '@/components/dashboard/ComingSoonPlaceholder';

export default function AutomationsPage() {
  return (
    <ComingSoonPlaceholder
      title="Automações de Vendas & Webhooks"
      description="Em breve poderá configurar fluxos automáticos de pós-venda, integração com n8n, recuperação automática de carrinho no WhatsApp e notificações personalizadas."
      badge="Em Breve"
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      }
    />
  );
}
