'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface HourlyDataPoint {
  hour: string;
  iniciados: number;
  aprovados: number;
}

const generate24hData = (): HourlyDataPoint[] => {
  const hours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:59'
  ];

  return hours.map((hour) => ({
    hour,
    iniciados: 0,
    aprovados: 0,
  }));
};

const defaultHourlyData = generate24hData();

interface HourlyCartsLineChartProps {
  data?: HourlyDataPoint[];
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  animationKey?: string;
}

export default function HourlyCartsLineChart({
  data = defaultHourlyData,
  title = 'Fluxo por Horário do Dia (00:00 – 23:59)',
  subtitle,
  badgeLabel = 'Hoje (24 Horas)',
  animationKey = 'default',
}: HourlyCartsLineChartProps) {
  const [showIniciados, setShowIniciados] = useState(true);
  const [showAprovados, setShowAprovados] = useState(true);

  const totalIniciados = data.reduce((acc, curr) => acc + curr.iniciados, 0);
  const totalAprovados = data.reduce((acc, curr) => acc + curr.aprovados, 0);
  const taxaMedia = totalIniciados > 0 ? ((totalAprovados / totalIniciados) * 100).toFixed(1) : '0';

  // Calculate dynamic peak hour range from actual period data
  const peakEntry = data.reduce(
    (best, curr, idx) => {
      const score = curr.aprovados * 2 + curr.iniciados;
      return score > best.score ? { score, idx, hour: curr.hour } : best;
    },
    { score: 0, idx: 19, hour: '19:00' }
  );
  const nextPeakHour = data[Math.min(data.length - 1, peakEntry.idx + 1)]?.hour || '21:00';
  const peakRangeText =
    peakEntry.score > 0
      ? `${peakEntry.hour} e ${nextPeakHour}`
      : 'sem picos registados no dia';

  return (
    <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xl w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Header: Title, 24h summary badges & interactive toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
              {title}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 whitespace-nowrap shrink-0 transition-all duration-300">
              {badgeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            {subtitle || (
              <>
                Movimento em tempo real ao longo das 24 horas do dia (00:00 – 23:59):{' '}
                <span className="text-violet-600 dark:text-[#A78BFA] font-medium">Carrinhos Iniciados</span> vs.{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Vendas Aprovadas</span>
              </>
            )}
          </p>
        </div>

        {/* Badges & Legend Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-xs">
            <span className="text-slate-500 dark:text-[#94A3B8]">Iniciados (24h):</span>
            <span className="text-violet-600 dark:text-[#A78BFA] font-bold font-mono">{totalIniciados}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-xs">
            <span className="text-slate-500 dark:text-[#94A3B8]">Aprovados (24h):</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{totalAprovados}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] text-xs">
            <span className="text-slate-500 dark:text-[#94A3B8]">Conversão (Dia):</span>
            <span className="text-purple-600 dark:text-violet-300 font-bold font-mono">{taxaMedia}%</span>
          </div>

          {/* Interactive Line Toggles */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowIniciados(!showIniciados)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                showIniciados
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300'
                  : 'bg-slate-50 dark:bg-[#0F0E14] border-slate-200 dark:border-[#1E1B26] text-slate-400 dark:text-[#64748B] opacity-60'
              }`}
              title="Alternar visibilidade dos carrinhos iniciados"
            >
              <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-[#A78BFA]" />
              <span>Iniciados</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAprovados(!showAprovados)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                showAprovados
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-[#0F0E14] border-slate-200 dark:border-[#1E1B26] text-slate-400 dark:text-[#64748B] opacity-60'
              }`}
              title="Alternar visibilidade das vendas aprovadas"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Aprovados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Long Chart Container */}
      <div key={animationKey} className="h-[230px] sm:h-[260px] md:h-[300px] w-full min-w-0 otter-chart-animate">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1B26" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E1B26' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0]?.payload as HourlyDataPoint;
                  const conv = item && item.iniciados > 0 
                    ? ((item.aprovados / item.iniciados) * 100).toFixed(0) 
                    : '0';

                  return (
                    <div className="bg-white dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[180px]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 dark:border-[#1E1B26] gap-2">
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">Horário: {label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/10 text-violet-600 dark:text-violet-400 font-mono font-bold">
                          {conv}% conv.
                        </span>
                      </div>

                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-[#94A3B8]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] font-mono">
                            {entry.value} {entry.name === 'Carrinhos Iniciados' ? 'carrinhos' : 'vendas'}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {showIniciados && (
              <Line
                key={`iniciados-${animationKey}`}
                type="monotone"
                name="Carrinhos Iniciados"
                dataKey="iniciados"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={620}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: '#8B5CF6', stroke: 'var(--bg-surface, #FFFFFF)', strokeWidth: 2 }}
              />
            )}

            {showAprovados && (
              <Line
                key={`aprovados-${animationKey}`}
                type="monotone"
                name="Vendas Aprovadas"
                dataKey="aprovados"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={680}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: '#10B981', stroke: 'var(--bg-surface, #FFFFFF)', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info: Peak hour indicator */}
      <div className="pt-3.5 mt-2 border-t border-slate-200 dark:border-[#1E1B26] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-[#94A3B8]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse shrink-0" />
          <span className="truncate">
            {peakEntry.score > 0 ? (
              <>Pico do dia registado entre as <strong className="text-slate-900 dark:text-white">{peakRangeText}</strong></>
            ) : (
              <span>Sem picos registados nas 24 horas do dia ({badgeLabel})</span>
            )}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-[#64748B]">Sincronizado em tempo real • Fluxo diário 24h (00:00 – 23:59)</span>
      </div>
    </div>
  );
}
