import React from 'react';
import ComingSoonFeature from '@/components/dashboard/ComingSoonFeature';

export default function QuizPage() {
  return (
    <ComingSoonFeature
      category="Conversão & Funis"
      title="Funis de Quiz Interativos"
      description="Crie questionários interativos de alta conversão para qualificar leads e direcionar para ofertas sob medida com maior taxa de aprovação."
      icon={
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="6" r="3" />
          <path d="M6 15V9a3 3 0 0 1 3-3h6" />
          <path d="M18 15v6" />
          <path d="M15 18h6" />
        </svg>
      }
      highlights={[
        {
          title: 'Ramificação de Respostas',
          description: 'Crie lógicas condicionais onde cada resposta leva a uma pergunta diferente ou a um produto específico.',
        },
        {
          title: 'Captura de Leads Integrada',
          description: 'Capture nome, WhatsApp e e-mail antes de revelar o resultado final ou o link de checkout.',
        },
        {
          title: 'Pixels de Conversão',
          description: 'Dispare eventos de pixel (Facebook, Google, TikTok) a cada etapa concluída pelo usuário.',
        },
      ]}
    />
  );
}
