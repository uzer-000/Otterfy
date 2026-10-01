'use client';

import React from 'react';
import ComingSoonPlaceholder from '@/components/dashboard/ComingSoonPlaceholder';

export default function CampaignsPage() {
  return (
    <ComingSoonPlaceholder
      title="Campanhas & Links UTM"
      description="Em breve poderá rastrear a origem de cada venda (Instagram, TikTok, WhatsApp, Facebook Ads) com gerador automático de parâmetros UTM."
      badge="Em Breve"
      icon={
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      }
    />
  );
}
