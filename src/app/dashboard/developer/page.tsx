'use client';

import React from 'react';
import ComingSoonPlaceholder from '@/components/dashboard/ComingSoonPlaceholder';

export default function DeveloperPage() {
  return (
    <ComingSoonPlaceholder
      title="Desenvolvedor & API Pública"
      description="Em breve poderá gerar chaves de API REST personalizadas, simular eventos em Sandbox e integrar o checkout da Otterfy diretamente nos seus próprios sistemas externos."
      badge="Em Breve"
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
        </svg>
      }
    />
  );
}
