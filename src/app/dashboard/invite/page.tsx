'use client';

import React from 'react';
import ComingSoonPlaceholder from '@/components/dashboard/ComingSoonPlaceholder';

export default function InvitePage() {
  return (
    <ComingSoonPlaceholder
      title="Convidar Criadores & Amigos"
      description="Em breve poderá indicar outros infoprodutores e lojistas de Moçambique para a Otterfy e receber comissões automáticas pelas vendas geradas na plataforma."
      badge="Em Breve"
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M21 11.25l-9-5.25-9 5.25m18 0l-9 5.25-9-5.25" />
        </svg>
      }
    />
  );
}
