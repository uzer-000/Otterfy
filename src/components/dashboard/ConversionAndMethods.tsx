'use client';

import React from 'react';
import Image from 'next/image';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ConversionAndMethodsProps {
  conversionRate?: number;
  emolaAmount?: number;
  mpesaAmount?: number;
  sparklineData?: { val: number }[];
  periodLabel?: string;
  animationKey?: string;
}

const defaultSparklineData = [
  { val: 0 },
  { val: 0 },
  { val: 0 },
  { val: 0 },
  { val: 0 },
  { val: 0 },
  { val: 0 },
];

export default function ConversionAndMethods({
  conversionRate = 0,
  emolaAmount = 0,
  mpesaAmount = 0,
  sparklineData = defaultSparklineData,
  periodLabel = 'nesta semana',
  animationKey = 'default',
}: ConversionAndMethodsProps) {
  const total = emolaAmount + mpesaAmount;
  const emolaPercentage = total > 0 ? Math.round((emolaAmount / total) * 100) : 0;
  const mpesaPercentage = total > 0 ? Math.round((mpesaAmount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full min-w-0">
      {/* Bloco 1 — Conversão */}
      <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Performance de Checkout
            </span>
            <p className="text-sm font-medium text-slate-900 dark:text-[#F8FAFC] mt-0.5">Taxa de Conversão</p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 transition-all duration-300 ${
            conversionRate > 0 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-slate-400 dark:text-[#64748B] bg-slate-50 dark:bg-[#0F0E14] border-slate-200 dark:border-[#1E1B26]'
          }`}>
            <span>{conversionRate > 0 ? `↑ +${conversionRate.toFixed(1)}%` : '0.0%'}</span>
          </div>
        </div>

        <div className="flex items-baseline flex-wrap gap-2.5 my-3">
          <span className="text-4xl md:text-5xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight transition-all duration-300">
            {conversionRate.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
            média {periodLabel}
          </span>
        </div>

        {/* Mini Sparkline Chart */}
        <div key={animationKey} className="h-[70px] w-full min-w-0 pt-2 otter-chart-animate">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="conversionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                key={`spark-${animationKey}`}
                type="monotone"
                dataKey="val"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fill="url(#conversionGrad)"
                isAnimationActive={true}
                animationDuration={620}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bloco 2 — Métodos de Pagamento */}
      <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate">Vendas por Método</h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 truncate">Distribuição móvel ({periodLabel})</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] block">Total Processado</span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              MT {total.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-4 my-auto">
          {/* Linha 1: eMola com Container de Imagem Oficial */}
          <div className="space-y-2 p-2.5 rounded-xl bg-orange-500/[0.04] border border-orange-500/10">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center p-1.5 shrink-0 border border-slate-200/90 dark:border-white/10">
                  <Image
                    src="/gateways/emola.svg"
                    alt="e-Mola"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block leading-tight">e-Mola</span>
                  <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">Movitel (86 • 87)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                  MT {emolaAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-orange-600 dark:text-orange-400 font-mono font-bold text-xs w-9 text-right bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20">
                  {emolaPercentage}%
                </span>
              </div>
            </div>
            {/* Progress bar in Movitel Orange */}
            <div className="h-2 w-full bg-slate-100 dark:bg-[#0F0E14] rounded-full overflow-hidden border border-slate-200 dark:border-[#1E1B26]">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${emolaPercentage}%` }}
              />
            </div>
          </div>

          {/* Linha 2: M-Pesa com Container de Imagem Oficial */}
          <div className="space-y-2 p-2.5 rounded-xl bg-red-500/[0.04] border border-red-500/10">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center p-1.5 shrink-0 border border-slate-200/90 dark:border-white/10">
                  <Image
                    src="/gateways/mpesa.svg"
                    alt="M-Pesa"
                    width={28}
                    height={28}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block leading-tight">M-Pesa</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Vodacom (84 • 85)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                  MT {mpesaAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-red-600 dark:text-red-400 font-mono font-bold text-xs w-9 text-right bg-red-500/10 px-1.5 py-0.5 rounded-md border border-red-500/20">
                  {mpesaPercentage}%
                </span>
              </div>
            </div>
            {/* Progress bar in Vodacom Red */}
            <div className="h-2 w-full bg-slate-100 dark:bg-[#0F0E14] rounded-full overflow-hidden border border-slate-200 dark:border-[#1E1B26]">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-rose-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${mpesaPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#1E1B26] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Processamento: Zenofy Live</span>
          </span>
          <span>Liquidação automática</span>
        </div>
      </div>
    </div>
  );
}
