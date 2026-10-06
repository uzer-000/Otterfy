'use client';

import React from 'react';
import Link from 'next/link';

interface FeatureHighlight {
  title: string;
  description: string;
}

interface ComingSoonFeatureProps {
  title: string;
  category: string;
  description: string;
  badge?: string;
  highlights: FeatureHighlight[];
  icon: React.ReactNode;
}

export default function ComingSoonFeature({
  title,
  category,
  description,
  badge = 'Em Breve',
  highlights,
  icon,
}: ComingSoonFeatureProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 md:p-8 backdrop-blur-sm">
        {/* Glow de fundo sutil com a cor da Otterfy */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/25 text-[#7C3AED] dark:text-[#A78BFA] shrink-0">
              {icon}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {category}
                </span>
                <span className="otter-sb-badge otter-sb-badge--soon">
                  {badge}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                {title}
              </h1>
              <p className="text-sm md:text-base text-[var(--text-secondary)] max-w-xl pt-1">
                {description}
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95 transition-all duration-150"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Voltar ao Dashboard
          </Link>
        </div>
      </div>

      {/* Grid com o que está sendo preparado */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-[var(--text-secondary)] px-1">
          O que você poderá fazer com este módulo:
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((h, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-5 hover:border-violet-500/30 transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10 text-[#7C3AED] dark:text-[#A78BFA] font-bold text-xs mb-3">
                0{i + 1}
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                {h.title}
              </h3>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
                {h.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Status banner */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10 p-4 flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
        <p className="text-xs md:text-sm text-[var(--text-primary)]">
          <span className="font-semibold text-violet-600 dark:text-violet-400">Em desenvolvimento ativo:</span> Esta funcionalidade está sendo construída pela equipe Otterfy e será liberada em uma próxima atualização do seu painel.
        </p>
      </div>
    </div>
  );
}
