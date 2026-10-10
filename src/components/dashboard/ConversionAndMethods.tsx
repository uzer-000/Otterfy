'use client';

import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

interface ConversionAndMethodsProps {
  conversionRate?: number;
  emolaAmount?: number;
  mpesaAmount?: number;
  sparklineData?: { val: number }[];
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
}: ConversionAndMethodsProps) {
  const total = emolaAmount + mpesaAmount;
  const emolaPercentage = total > 0 ? Math.round((emolaAmount / total) * 100) : 0;
  const mpesaPercentage = total > 0 ? Math.round((mpesaAmount / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bloco 1 — Conversão */}
      <div className="otter-widget-card rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              Performance de Checkout
            </span>
            <p className="text-sm font-medium text-[#F8FAFC] mt-0.5">Taxa de Conversão</p>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${
            conversionRate > 0 
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
              : 'text-[#64748B] bg-[#0F0E14] border-[#1E1B26]'
          }`}>
            <span>{conversionRate > 0 ? `↑ +${conversionRate.toFixed(1)}%` : '0.0%'}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-3 my-3">
          <span className="text-4xl md:text-5xl font-black text-[#F8FAFC] tracking-tight">
            {conversionRate.toFixed(1)}%
          </span>
          <span className="text-xs text-[#94A3B8]">
            média nos últimos 7 dias
          </span>
        </div>

        {/* Mini Sparkline Chart */}
        <div className="h-[70px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="conversionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                fill="url(#conversionGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bloco 2 — Métodos de Pagamento */}
      <div className="otter-widget-card rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#F8FAFC]">Vendas por Método</h3>
            <p className="text-xs text-[#94A3B8] mt-0.5">Distribuição móvel (eMola vs M-Pesa)</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#94A3B8] block">Total Processado</span>
            <span className="text-sm font-bold text-violet-400">
              MT {total.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="space-y-4 my-auto">
          {/* Linha 1: eMola */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#F8FAFC] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
                eMola
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F8FAFC]">
                  MT {emolaAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[#94A3B8] font-mono text-[11px] w-8 text-right">
                  {emolaPercentage}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-[#0F0E14] rounded-full overflow-hidden border border-[#1E1B26]">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
                style={{ width: `${emolaPercentage}%` }}
              />
            </div>
          </div>

          {/* Linha 2: M-Pesa */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#F8FAFC] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" />
                M-Pesa
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F8FAFC]">
                  MT {mpesaAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[#94A3B8] font-mono text-[11px] w-8 text-right">
                  {mpesaPercentage}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full bg-[#0F0E14] rounded-full overflow-hidden border border-[#1E1B26]">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${mpesaPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-[#1E1B26] flex items-center justify-between text-[11px] text-[#64748B]">
          <span>Gateway: Zenofy</span>
          <span>Liquidação automática</span>
        </div>
      </div>
    </div>
  );
}
