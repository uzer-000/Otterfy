'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';
import AwardsModal from './AwardsModal';

interface TotalRevenueHeroCardProps {
  totalRevenue: number;
  approvedCount?: number;
}

export default function TotalRevenueHeroCard({
  totalRevenue = 0,
  approvedCount = 0,
}: TotalRevenueHeroCardProps) {
  const [awardsOpen, setAwardsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Synchronize theme with html data-theme
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

  // Determine Milestone Level & Info (7 marcos oficiais da jornada Otterfy)
  const getMilestoneInfo = (revenue: number) => {
    if (revenue < 5000) {
      return {
        levelName: 'Marco 1/7',
        plaqueName: 'Grupo WhatsApp (5K)',
        nextTarget: 5000,
        imageSrc: '/awards/50k.png',
      };
    } else if (revenue < 10000) {
      return {
        levelName: 'Marco 2/7',
        plaqueName: 'Pulseira Otterfy (10K)',
        nextTarget: 10000,
        imageSrc: '/awards/50k.png',
      };
    } else if (revenue < 50000) {
      return {
        levelName: 'Marco 3/7',
        plaqueName: 'Placa 50K',
        nextTarget: 50000,
        imageSrc: '/awards/50k.png',
      };
    } else if (revenue < 100000) {
      return {
        levelName: 'Marco 4/7',
        plaqueName: 'Placa 100K',
        nextTarget: 100000,
        imageSrc: '/awards/100k.png',
      };
    } else if (revenue < 500000) {
      return {
        levelName: 'Marco 5/7',
        plaqueName: 'Placa 500K',
        nextTarget: 500000,
        imageSrc: '/awards/500k.png',
      };
    } else {
      return {
        levelName: 'Marco 6/7',
        plaqueName: 'Placa 1M (Final)',
        nextTarget: 1000000,
        imageSrc: '/awards/1m.png',
      };
    }
  };

  const info = getMilestoneInfo(totalRevenue);
  const remaining = Math.max(0, info.nextTarget - totalRevenue);
  const progressPercent = Math.min(100, Math.round((totalRevenue / info.nextTarget) * 100));

  return (
    <>
      {/* Outer LED container with white laser gradient and glow */}
      <div 
        className={`w-full rounded-2xl p-[1.5px] transition-all duration-300 relative ${
          isLight
            ? 'bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.06),0_0_12px_rgba(255,255,255,0.8)]'
            : 'bg-gradient-to-r from-white/40 via-white/10 to-white/30 shadow-[0_0_22px_rgba(255,255,255,0.14),inset_0_0_12px_rgba(255,255,255,0.03)]'
        }`}
      >
        {/* Ambient subtle light glow */}
        <div 
          className={`absolute -right-8 -top-8 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity ${
            isLight ? 'bg-slate-200/40 opacity-40' : 'bg-white/10 opacity-30'
          }`}
        />

        {/* Inner Card Content - same size and padding as standard dashboard widgets */}
        <div 
          className={`w-full rounded-[14px] p-5 sm:p-6 transition-all relative z-10 ${
            isLight
              ? 'bg-white text-[#0F172A]'
              : 'bg-[#121016] text-[#F8FAFC]'
          }`}
        >
          {/* Top Row: Faturamento Total + Current Level Badge & Award Photo Slot */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
            isLight ? 'border-[#E2E8F0]' : 'border-[#1E1B26]'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span 
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    isLight 
                      ? 'bg-slate-800 shadow-[0_0_6px_rgba(15,23,42,0.4)]' 
                      : 'bg-white shadow-[0_0_8px_#ffffff]'
                  }`} 
                />
                <span className={`text-[11px] uppercase font-extrabold tracking-wider ${
                  isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                }`}>
                  Faturamento Total Acumulado
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLight 
                    ? 'bg-slate-100 text-slate-800 border-slate-300' 
                    : 'bg-white/10 text-white border-white/20'
                }`}>
                  {info.levelName}
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-0.5">
                <h2 className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'
                }`}>
                  {formatMZN(totalRevenue)}
                </h2>
                <span className={`text-xs font-semibold ${
                  isLight ? 'text-[#64748B]' : 'text-[#64748B]'
                }`}>
                  ({approvedCount} {approvedCount === 1 ? 'venda aprovada' : 'vendas aprovadas'})
                </span>
              </div>
            </div>

            {/* Award Photo/Badge Slot (PNG / ICO) + Link to Awards page */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <Link 
                href="/dashboard/awards"
                className={`cursor-pointer group flex items-center gap-3 p-2 px-3 rounded-xl border transition-all shadow-sm ${
                  isLight
                    ? 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-400 hover:bg-slate-50'
                    : 'bg-[#0F0E14] border-[#1E1B26] hover:border-white/30 hover:bg-[#16141F]'
                }`}
                title="Clique para ver a jornada de conquistas e premiações oficiais"
              >
                {/* Photo slot */}
                <div 
                  className={`relative w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform ${
                    isLight 
                      ? 'bg-white border-[#E2E8F0]' 
                      : 'bg-[#171420] border-[#2A2538]'
                  }`}
                >
                  {!imageError ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={info.imageSrc}
                      alt={info.plaqueName}
                      onError={() => setImageError(true)}
                      className={
                        info.imageSrc?.includes('50k')
                          ? "w-full h-full object-cover p-0 scale-125"
                          : "w-full h-full object-contain p-1"
                      }
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <span className={`text-[9px] font-black uppercase tracking-tighter ${
                        isLight ? 'text-slate-800' : 'text-white'
                      }`}>
                        {info.levelName.replace('Nível ', '')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col pr-1">
                  <span className={`text-[9px] uppercase font-bold ${
                    isLight ? 'text-[#64748B]' : 'text-[#64748B]'
                  }`}>
                    Premiação em Disputa
                  </span>
                  <span className={`text-xs font-bold transition-colors ${
                    isLight 
                      ? 'text-[#0F172A] group-hover:text-violet-600' 
                      : 'text-[#F8FAFC] group-hover:text-white'
                  }`}>
                    {info.plaqueName} →
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Bottom Row: Next Goal Progress & Remaining amount */}
          <div className="space-y-2 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className={isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}>
                Faltam exatamente{' '}
                <strong className={`font-mono text-xs sm:text-sm ${
                  isLight ? 'text-[#0F172A]' : 'text-white'
                }`}>
                  {formatMZN(remaining)}
                </strong>{' '}
                para a próxima meta (<span className={`font-semibold ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>{info.plaqueName}</span>)
              </span>
              <div className="flex items-center gap-2">
                <span className={`font-mono font-bold text-xs ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {progressPercent}% CONCLUÍDO
                </span>
                <span className={`text-[11px] ${isLight ? 'text-[#64748B]' : 'text-[#64748B]'}`}>
                  ({formatMZN(totalRevenue)} / {formatMZN(info.nextTarget)})
                </span>
              </div>
            </div>

            {/* Static White LED / Laser Progress Bar with cool gradient */}
            <div className={`w-full h-2 rounded-full overflow-hidden border ${
              isLight ? 'bg-slate-100 border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}>
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  isLight
                    ? 'bg-gradient-to-r from-slate-600 via-slate-800 to-slate-700'
                    : 'bg-gradient-to-r from-slate-400 via-white to-slate-200 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Awards Modal for complete inspection */}
      <AwardsModal
        isOpen={awardsOpen}
        onClose={() => setAwardsOpen(false)}
        currentRevenue={totalRevenue}
      />
    </>
  );
}
