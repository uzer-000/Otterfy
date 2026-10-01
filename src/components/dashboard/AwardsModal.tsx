'use client';

import React, { useState, useEffect } from 'react';
import { formatMZN } from '@/lib/utils';

export interface Milestone {
  level: string;
  name: string;
  target: number;
  description: string;
  imageSrc?: string; // Path to custom PNG or ICO in /public/awards/
}

export const MILESTONES: Milestone[] = [
  {
    level: '50K',
    name: 'Pulseira Bronze',
    target: 50000,
    description: 'Primeiro grande marco de 50.000 MT: Pulseira oficial de faturamento Otterfy (as placas físicas começam a partir de 100K).',
    imageSrc: '/awards/50k.png',
  },
  {
    level: '100K',
    name: 'Placa Prata',
    target: 100000,
    description: 'Consolidação de operação e consistência nas vendas.',
    imageSrc: '/awards/100k.png',
  },
  {
    level: '500K',
    name: 'Placa Ouro',
    target: 500000,
    description: 'Nível avançado de escala e faturamento digital.',
    imageSrc: '/awards/500k.png',
  },
  {
    level: '1M',
    name: 'Placa Diamante',
    target: 1000000,
    description: 'Clube do Milhão Otterfy — operação de alta performance.',
    imageSrc: '/awards/1m.png',
  },
  {
    level: '5M',
    name: 'Placa Black',
    target: 5000000,
    description: 'Operação de referência nacional no e-commerce moçambicano.',
    imageSrc: '/awards/5m.png',
  },
  {
    level: '10M',
    name: 'Placa Titan',
    target: 10000000,
    description: 'Maior honraria e premiação máxima de escala Otterfy.',
    imageSrc: '/awards/10m.png',
  },
];

interface AwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRevenue: number;
}

export default function AwardsModal({ isOpen, onClose, currentRevenue }: AwardsModalProps) {
  // Track image load errors to gracefully display custom placeholder slot
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const updateTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
      setTheme(current);
    };
    updateTheme();

    const observer = new MutationObserver(() => updateTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const isLight = theme === 'light';

  if (!isOpen) return null;

  const nextTarget = 50000;
  const remainingFor50k = Math.max(0, nextTarget - currentRevenue);
  const progressPercent = Math.min(100, Math.round((currentRevenue / nextTarget) * 100));

  const handleImageError = (level: string) => {
    setImageErrors((prev) => ({ ...prev, [level]: true }));
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors animate-fadeIn ${
      isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm'
    }`}>
      <div 
        className={`rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border transition-colors ${
          isLight
            ? 'bg-white border-[#E2E8F0] text-[#0F172A]'
            : 'bg-[#121016] border-[#1E1B26] text-[#F8FAFC]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 border-b flex items-center justify-between transition-colors ${
          isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#0F0E14]/80 border-[#1E1B26]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-500 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.004 0H8.496m5.004 0V9.375c0-.621-.504-1.125-1.125-1.125H9.621c-.621 0-1.125.504-1.125 1.125v4.875" />
              </svg>
            </div>
            <div>
              <h2 className={`text-xl font-black ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                Premiações Otterfy
              </h2>
              <p className={`text-xs ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Conquistas e placas de faturamento oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm cursor-pointer border ${
              isLight
                ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
                : 'bg-[#1A1820] hover:bg-[#252230] text-[#94A3B8] hover:text-[#F8FAFC] border-transparent'
            }`}
          >
            ✕
          </button>
        </div>

        {/* Current status banner */}
        <div className={`p-6 border-b transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-violet-50/70 via-white to-white border-[#E2E8F0]'
            : 'bg-gradient-to-r from-violet-950/40 via-[#121016] to-[#121016] border-[#1E1B26]'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-violet-600 dark:text-violet-400">
                Próximo Marco: Pulseira Bronze (50K)
              </span>
              <p className={`text-2xl font-black mt-0.5 ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                {formatMZN(currentRevenue)}{' '}
                <span className={`text-sm font-normal ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  / {formatMZN(50000)}
                </span>
              </p>
            </div>
            <div>
              <span className={`text-xs block ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Faltam exatamente
              </span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {formatMZN(remainingFor50k)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className={`h-2.5 w-full rounded-full overflow-hidden border ${
              isLight ? 'bg-[#F1F0F7] border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}>
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>0 MT</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400">{progressPercent}% Concluído</span>
              <span>50.000 MT</span>
            </div>
          </div>
        </div>

        {/* Milestones List with Dedicated Image Slots */}
        <div className="p-6 overflow-y-auto space-y-3.5 max-h-[440px] custom-scrollbar">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-xs uppercase tracking-wider font-semibold ${
              isLight ? 'text-[#475569]' : 'text-[#94A3B8]'
            }`}>
              Placas & Troféus Oficiais:
            </h3>
            <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
              ✓ Troféus & Placas Oficiais Carregados
            </span>
          </div>

          {MILESTONES.map((m) => {
            const isUnlocked = currentRevenue >= m.target;
            const itemPercent = Math.min(100, Math.round((currentRevenue / m.target) * 100));
            const diff = Math.max(0, m.target - currentRevenue);
            const hasError = imageErrors[m.level];

            return (
              <div
                key={m.level}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnlocked
                    ? isLight
                      ? 'bg-violet-50/60 border-violet-200 text-[#0F172A]'
                      : 'bg-violet-950/20 border-violet-500/40 text-[#F8FAFC]'
                    : isLight
                      ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#334155]'
                      : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Photo / Badge Slot (PNG / ICO) */}
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex flex-col items-center justify-center shrink-0 overflow-hidden group transition-all ${
                    isLight 
                      ? 'bg-white border-[#CBD5E1] shadow-sm hover:border-violet-500' 
                      : 'bg-[#171420] border-[#2A2538] shadow-inner hover:border-violet-500/50'
                  }`}>
                    {!hasError && m.imageSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={m.imageSrc}
                        alt={`Premiação ${m.name}`}
                        onError={() => handleImageError(m.level)}
                        className={
                          m.level === '50K' || m.imageSrc.includes('50k')
                            ? "w-full h-full object-cover p-0 scale-125 group-hover:scale-135 transition-transform duration-300"
                            : "w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                        }
                      />
                    ) : (
                      /* Fallback Slot for User's Image */
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <span className="text-violet-600 dark:text-violet-400 font-black text-sm tracking-tight">
                          {m.level}
                        </span>
                        <span className="text-[8px] font-medium text-[#64748B] tracking-tighter">
                          + FOTO
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        isUnlocked
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                      }`}>
                        {m.level}
                      </span>
                      <h4 className={`text-sm font-bold truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                        {m.name}
                      </h4>
                      {isUnlocked && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          ✓ Desbloqueado
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                      {m.description}
                    </p>

                    {/* Progress to this milestone */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${
                        isLight ? 'bg-[#E2E8F0]' : 'bg-[#1A1820]'
                      }`}>
                        <div 
                          className="h-full bg-violet-600 rounded-full transition-all duration-500"
                          style={{ width: `${itemPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        {itemPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:w-36 shrink-0">
                  <span className={`text-xs block ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                    Meta: {formatMZN(m.target)}
                  </span>
                  {!isUnlocked ? (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Faltam {formatMZN(diff)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Conquistado!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`p-4 px-6 border-t flex items-center justify-between transition-colors ${
          isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
        }`}>
          <span className="text-xs text-[#64748B]">
            Premiação física oficial da Otterfy Moçambique
          </span>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0]'
                : 'bg-[#1A1820] hover:bg-[#252230] text-[#F8FAFC] border-[#2A2636]'
            }`}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
