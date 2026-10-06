import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function SacPage() {
  return (
    <ComingSoonFeature
      category="Atendimento ao Cliente"
      title="SAC — Sistema de Atendimento & Suporte"
      description="Gerencie tickets de suporte, atenda seus compradores em tempo real e resolva dúvidas sobre pedidos e entregas direto pelo painel."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
          <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
      }
      highlights={[
        {
          title: 'Tickets Centralizados',
          description: 'Visualize todas as mensagens dos compradores vinculadas ao número do pedido correspondente.',
        },
        {
          title: 'Respostas Rápidas & FAQ',
          description: 'Configure respostas automáticas para dúvidas frequentes de entrega de materiais e comprovantes.',
        },
        {
          title: 'Histórico de Atendimento',
          description: 'Acompanhe o status de cada solicitação desde a abertura até a resolução com métricas de tempo.',
        },
      ]}
    />
  );
}
