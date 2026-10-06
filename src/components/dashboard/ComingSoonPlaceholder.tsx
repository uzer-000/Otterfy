'use client';

import React from 'react';

interface ComingSoonPlaceholderProps {
  title: string;
  description: string;
  badge?: string;
  icon?: React.ReactNode;
}

export default function ComingSoonPlaceholder({
  title,
  description,
  badge = 'Em Breve',
  icon,
}: ComingSoonPlaceholderProps) {
  return (
    <div className="w-full max-w-6xl 2xl:max-w-[1800px] mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Top Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1E1B26]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">
              Módulo Otterfy
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
            {title}
          </h1>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-600/15 text-violet-300 border border-violet-500/30 self-start sm:self-auto">
          {badge}
        </span>
      </div>

      {/* Clean Zeroed Box */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-12 sm:p-20 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] text-violet-400 flex items-center justify-center mb-6 shadow-inner relative z-10">
          {icon || (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Badge */}
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-3 relative z-10">
          {badge}
        </span>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight relative z-10">
          Funcionalidade em Breve
        </h2>

        {/* Explanation */}
        <p className="text-sm text-[#94A3B8] max-w-md mt-3 leading-relaxed relative z-10">
          {description}
        </p>

        {/* Status Pills */}
        <div className="flex items-center gap-2 mt-8 text-[11px] text-[#64748B] font-medium relative z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Em fase de desenvolvimento para as próximas versões</span>
        </div>
      </div>
    </div>
  );
}
