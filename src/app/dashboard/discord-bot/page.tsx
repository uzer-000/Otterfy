import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function DiscordBotPage() {
  return (
    <ComingSoonFeature
      category="Automações & Comunidades"
      title="Bot do Discord & Gestão de Cargos VIP"
      description="Sincronize compras na Otterfy com seu servidor do Discord para atribuição automática de cargos VIP, canais exclusivos e alertas de vendas."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.89 5.86A16.03 16.03 0 0 0 15 4.5a.1.1 0 0 0-.08.05c-.37.66-.78 1.53-1.07 2.22a14.86 14.86 0 0 0-4.7 0c-.29-.69-.7-1.56-1.07-2.22a.1.1 0 0 0-.08-.05 16 16 0 0 0-3.89 1.36.08.08 0 0 0-.04.04C2.65 11.83 2 17.65 2.47 23.41a.1.1 0 0 0 .04.07 16.14 16.14 0 0 0 4.88 2.48.1.1 0 0 0 .1-.04c.38-.52.71-1.07 1-1.65a.1.1 0 0 0-.05-.13 10.6 10.6 0 0 1-1.53-.73.1.1 0 0 1 0-.15c.1-.08.2-.16.3-.24a.1.1 0 0 1 .1 0 11.5 11.5 0 0 0 9.88 0 .1.1 0 0 1 .1 0c.1.08.2.16.3.24a.1.1 0 0 1 0 .15c-.48.28-1 .52-1.53.73a.1.1 0 0 0-.05.13c.29.58.62 1.13 1 1.65a.1.1 0 0 0 .1.04 16.09 16.09 0 0 0 4.89-2.48.1.1 0 0 0 .04-.07c.56-6.66-.96-12.43-3.66-17.51a.08.08 0 0 0-.04-.04Z" />
          <circle cx="8.5" cy="15" r="1.5" />
          <circle cx="15.5" cy="15" r="1.5" />
        </svg>
      }
      highlights={[
        {
          title: 'Cargos Automáticos por Produto',
          description: 'Ao comprar o Produto X, o membro ganha instantaneamente o cargo correspondente no seu Discord.',
        },
        {
          title: 'Canal de Notificações de Vendas',
          description: 'Transmita vendas em tempo real em um canal privado de administradores com detalhes do comprador.',
        },
        {
          title: 'Revogação em Cancelamentos',
          description: 'Cargos revogados automaticamente em caso de estorno, reembolso ou término de assinatura.',
        },
      ]}
    />
  );
}
