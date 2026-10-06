import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function StorePage() {
  return (
    <ComingSoonFeature
      category="E-commerce & Vitrine"
      title="Loja Virtual & Catálogo de Produtos"
      description="Tenha sua própria loja online personalizada com todos os seus produtos digitais e físicos em uma única vitrine com checkout integrado."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
        </svg>
      }
      highlights={[
        {
          title: 'Domínio Próprio ou Subdomínio',
          description: 'Sua vitrine rodando em seu domínio personalizado com certificado SSL gratuito automático.',
        },
        {
          title: 'Carrinho Multiprocesso',
          description: 'Permita que o cliente adicione múltiplos produtos ao carrinho e pague tudo em uma única transação.',
        },
        {
          title: 'Design Personalizável',
          description: 'Ajuste cores, banners e categorias para manter a identidade visual da sua marca.',
        },
      ]}
    />
  );
}
