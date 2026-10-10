'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

export interface Milestone {
  id: number;
  level: string;
  name: string;
  target: number;
  description: string;
  tag: string;
  imageSrc: string;
  type: 'bracelet' | 'plaque';
}

export const MILESTONES: Milestone[] = [
  {
    id: 1,
    level: '50K',
    name: 'Pulseira Bronze',
    target: 50000,
    tag: '1/6',
    description: 'Pulseira oficial de faturamento Otterfy para o pulso, entregue no seu endereço.',
    imageSrc: '/awards/50k.png',
    type: 'bracelet',
  },
  {
    id: 2,
    level: '100K',
    name: 'Placa Prata',
    target: 100000,
    tag: '2/6',
    description: 'Troféu em acrílico maciço com o seu marco de 100.000 MT gravado, entregue no seu endereço.',
    imageSrc: '/awards/100k.png',
    type: 'plaque',
  },
  {
    id: 3,
    level: '500K',
    name: 'Placa Ouro',
    target: 500000,
    tag: '3/6',
    description: 'Troféu em acrílico maciço com o seu marco de 500.000 MT gravado, entregue no seu endereço.',
    imageSrc: '/awards/500k.png',
    type: 'plaque',
  },
  {
    id: 4,
    level: '1M',
    name: 'Placa Diamante',
    target: 1000000,
    tag: '4/6',
    description: 'Clube do Milhão Otterfy. Acrílico maciço exclusivo, entregue no seu endereço.',
    imageSrc: '/awards/1m.png',
    type: 'plaque',
  },
  {
    id: 5,
    level: '5M',
    name: 'Placa Black',
    target: 5000000,
    tag: '5/6',
    description: 'Operação de alta escala nacional. Acrílico maciço escurecido de alta densidade.',
    imageSrc: '/awards/5m.png',
    type: 'plaque',
  },
  {
    id: 6,
    level: '10M',
    name: 'Placa Titan',
    target: 10000000,
    tag: '6/6',
    description: 'A última parada e premiação máxima de escala digital da Otterfy.',
    imageSrc: '/awards/10m.png',
    type: 'plaque',
  },
];

interface AwardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRevenue: number;
}

export default function AwardsModal({ isOpen, onClose, currentRevenue }: AwardsModalProps) {
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

  const nextMilestone = MILESTONES.find((m) => m.target > currentRevenue) || MILESTONES[MILESTONES.length - 1];
  const targetAmount = nextMilestone.target;
  const remainingAmount = Math.max(0, targetAmount - currentRevenue);
  const progressPercent = Math.min(100, Math.round((currentRevenue / targetAmount) * 100));

  const handleImageError = (level: string) => {
    setImageErrors((prev) => ({ ...prev, [level]: true }));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors animate-fadeIn ${
        isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm'
      }`}
      onClick={onClose}
    >
      <div
        className={`rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative border transition-colors ${
          isLight
            ? 'bg-white border-[#E2E8F0] text-[#0F172A]'
            : 'bg-[#121016] border-[#1E1B26] text-[#F8FAFC]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b flex items-center justify-between transition-colors ${
            isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#0F0E14]/80 border-[#1E1B26]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-lg">
              🏆
            </div>
            <div>
              <h2 className={`text-xl font-black ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                Premiações Oficiais Otterfy
              </h2>
              <p className={`text-xs ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                6 marcos oficiais para celebrar a sua escala de faturamento
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
        <div
          className={`p-6 border-b transition-colors ${
            isLight
              ? 'bg-gradient-to-r from-violet-50/70 via-white to-white border-[#E2E8F0]'
              : 'bg-gradient-to-r from-violet-950/40 via-[#121016] to-[#121016] border-[#1E1B26]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-violet-600 dark:text-violet-400">
                Próxima Meta: {nextMilestone.name} ({nextMilestone.tag})
              </span>
              <p className={`text-2xl font-black mt-0.5 ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                {formatMZN(currentRevenue)}{' '}
                <span className={`text-sm font-normal ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  / {formatMZN(targetAmount)}
                </span>
              </p>
            </div>
            <div>
              <span className={`text-xs block ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Faltam exatamente
              </span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {formatMZN(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div
              className={`h-2.5 w-full rounded-full overflow-hidden border ${
                isLight ? 'bg-[#F1F0F7] border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
              }`}
            >
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-sky-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#64748B]">
              <span>0 MT</span>
              <span className="font-semibold text-violet-600 dark:text-violet-400">{progressPercent}% Concluído</span>
              <span>{formatMZN(targetAmount)}</span>
            </div>
          </div>
        </div>

        {/* Milestones List */}
        <div className="p-6 overflow-y-auto space-y-3.5 max-h-[440px] custom-scrollbar">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-xs uppercase tracking-wider font-semibold ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
              Troféus & Pulseiras Físicas:
            </h3>
            <Link
              href="/dashboard/awards"
              onClick={onClose}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-bold flex items-center gap-1"
            >
              Abrir página de premiações completa →
            </Link>
          </div>

          {MILESTONES.map((m) => {
            const isUnlocked = currentRevenue >= m.target;
            const isCurrent = m.id === nextMilestone.id && !isUnlocked;
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
                    : isCurrent
                    ? isLight
                      ? 'bg-sky-50/60 border-sky-300 text-[#0F172A] ring-1 ring-sky-300'
                      : 'bg-[#10192b]/60 border-sky-500/50 text-[#F8FAFC] ring-1 ring-sky-500/30'
                    : isLight
                    ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#334155]'
                    : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* Visual item slot */}
                  <div
                    className={`relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border flex flex-col items-center justify-center shrink-0 overflow-hidden group transition-all ${
                      isLight
                        ? 'bg-white border-[#CBD5E1] shadow-sm hover:border-violet-500'
                        : 'bg-[#171420] border-[#2A2538] shadow-inner hover:border-violet-500/50'
                    }`}
                  >
                    {!hasError && m.imageSrc ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={m.imageSrc}
                        alt={`Premiação ${m.name}`}
                        onError={() => handleImageError(m.level)}
                        className={
                          m.type === 'bracelet'
                            ? "w-full h-full object-cover scale-125"
                            : "w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                        }
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-1">
                        <span className="text-violet-600 dark:text-violet-400 font-black text-sm tracking-tight">
                          {m.level}
                        </span>
                        <span className="text-[8px] font-medium text-[#64748B] tracking-tighter">
                          🏆
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isUnlocked
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : isCurrent
                            ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
                            : 'bg-violet-500/10 text-violet-600 border-violet-500/20'
                        }`}
                      >
                        {m.tag}
                      </span>
                      <h4 className={`text-sm font-bold truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                        {m.name}
                      </h4>
                      {isUnlocked ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          ✓ Conquistado
                        </span>
                      ) : isCurrent ? (
                        <span className="text-[10px] font-bold text-sky-500 dark:text-sky-400">
                          📍 Você está aqui
                        </span>
                      ) : null}
                    </div>
                    <p className={`text-xs ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                      {m.description}
                    </p>

                    {/* Progress to this milestone */}
                    <div className="mt-2 flex items-center gap-3">
                      <div
                        className={`h-1.5 flex-1 rounded-full overflow-hidden ${
                          isLight ? 'bg-[#E2E8F0]' : 'bg-[#1A1820]'
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isUnlocked ? 'bg-emerald-500' : 'bg-violet-600'
                          }`}
                          style={{ width: `${itemPercent}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#64748B]">{itemPercent}%</span>
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
                      Liberado!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className={`p-4 px-6 border-t flex items-center justify-between transition-colors ${
            isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
          }`}
        >
          <Link
            href="/dashboard/awards"
            onClick={onClose}
            className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-bold"
          >
            Ver timeline oficial completa →
          </Link>
          <button
            onClick={onClose}
            className={`px-5 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0]'
                : 'bg-[#1A1820] hover:bg-[#252230] text-[#F8FAFC] border-[#2A2636]'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
