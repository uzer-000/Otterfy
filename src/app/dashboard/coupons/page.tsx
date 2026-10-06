import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function CouponsPage() {
  return (
    <ComingSoonFeature
      category="Marketing & Vendas"
      title="Cupons de Desconto Promocionais"
      description="Crie códigos promocionais personalizados, limite o número de usos por cliente e alavanque suas campanhas de marketing."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6" />
          <path d="M9 9h.01" />
          <path d="M15 15h.01" />
        </svg>
      }
      highlights={[
        {
          title: 'Desconto Fixo ou Percentual',
          description: 'Defina cupons com desconto em Meticais (MT) ou em porcentagem sobre o valor total do carrinho.',
        },
        {
          title: 'Regras de Expiração & Limites',
          description: 'Limite o cupom por data de término, quantidade máxima de utilizações ou valor mínimo da compra.',
        },
        {
          title: 'Métricas de Conversão',
          description: 'Veja exatamente quantas vendas e receita cada cupom gerou nas suas campanhas de tráfego.',
        },
      ]}
    />
  );
}
