import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function TelegramBotPage() {
  return (
    <ComingSoonFeature
      category="Automações & Bots"
      title="Bot do Telegram para Vendas & Alertas"
      description="Receba alertas instantâneos de cada venda aprovada no Telegram, gerencie grupos VIP de membros e envie links automáticos aos clientes."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="12" x="3" y="8" rx="2" />
          <path d="M12 2v4" />
          <circle cx="8" cy="14" r="1.5" />
          <circle cx="16" cy="14" r="1.5" />
          <path d="M2 14h1M21 14h1" />
        </svg>
      }
      highlights={[
        {
          title: 'Notificações de Venda Instantâneas',
          description: 'Seu celular toca a cada pedido pago com nome do cliente, produto e valor recebido em MT.',
        },
        {
          title: 'Acesso Automático a Canais VIP',
          description: 'O bot adiciona compradores aos seus grupos privados e remove inadimplentes automaticamente.',
        },
        {
          title: 'Entrega de Conteúdo no Chat',
          description: 'Envie PDFs, chaves de acesso e links seguros diretamente na conversa do Telegram do cliente.',
        },
      ]}
    />
  );
}
