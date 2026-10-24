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
import { formatMZN, getMozambiqueDate, createMozambiqueDateUtc } from '@/lib/utils';

interface ApprovalsVsVolumeLineChartProps {
  data?: {
    date: string;
    dayName?: string;
    fullDate?: string;
    aprovados: number;
    volume: number;
  }[];
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  animationKey?: string;
}

const generate7DayData = () => {
  const result = [];
  const weekDayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weekDayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const mozNow = getMozambiqueDate();
  const dayOfWeek = mozNow.getUTCDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  for (let i = 0; i < 7; i++) {
    const dUtc = createMozambiqueDateUtc(
      mozNow.getUTCFullYear(),
      mozNow.getUTCMonth(),
      mozNow.getUTCDate() - diffToMonday + i,
      0, 0, 0, 0
    );
    const mozD = getMozambiqueDate(dUtc);
    const dateLabel = `${mozD.getUTCDate().toString().padStart(2, '0')}/${(mozD.getUTCMonth() + 1).toString().padStart(2, '0')}`;
    result.push({
      date: weekDayShort[i],
      dayName: weekDayNames[i],
      fullDate: dateLabel,
      aprovados: 0,
      volume: 0,
    });
  }
  return result;
};

const defaultData = generate7DayData();

export default function ApprovalsVsVolumeLineChart({
  data = defaultData,
  title = 'Carrinhos Aprovados vs Total de Carrinhos',
  subtitle = 'Evolução diária da semana atual (Segunda a Domingo em Meticais)',
  badgeLabel = '7 Dias',
  animationKey = 'default',
}: ApprovalsVsVolumeLineChartProps) {
  const [showAprovados, setShowAprovados] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  const chartData = data && data.length > 0 ? data : defaultData;

  // Accurate max calculation from data array
  const maxDataVal = Math.max(
    ...chartData.map((d) => Math.max(Number(d.aprovados) || 0, Number(d.volume) || 0)),
    0
  );

  const totalAprovados = chartData.reduce((acc, d) => acc + (Number(d.aprovados) || 0), 0);
  const totalVolume = chartData.reduce((acc, d) => acc + (Number(d.volume) || 0), 0);
  const financialConvRate = totalVolume > 0 ? ((totalAprovados / totalVolume) * 100).toFixed(1) : '0.0';
  const hasActivity = maxDataVal > 0;

  // Clean numerical domain max with 18% headroom and 100 MT minimum baseline
  const yDomainMax = !hasActivity ? 100 : Math.ceil(maxDataVal * 1.18);

  return (
    <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden relative">
      {/* Header with Title and Interactive Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
              {title}
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 whitespace-nowrap shrink-0 transition-all duration-300">
              {badgeLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 truncate">
            {subtitle}
          </p>
        </div>

        {/* Legend toggles */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowAprovados(!showAprovados)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
              showAprovados
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-700 dark:text-violet-300'
                : 'bg-slate-50 dark:bg-[#0F0E14] border-slate-200 dark:border-[#1E1B26] text-slate-400 dark:text-[#64748B] opacity-60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6] shrink-0" />
            <span>Aprovados</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border cursor-pointer ${
              showVolume
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-slate-50 dark:bg-[#0F0E14] border-slate-200 dark:border-[#1E1B26] text-slate-400 dark:text-[#64748B] opacity-60'
            }`}
          >
            <span className="w-2 h-0.5 bg-[#6366F1] shrink-0" />
            <span>Total</span>
          </button>
        </div>
      </div>

      {/* Quick Financial Summary Badges */}
      <div className="flex items-center flex-wrap gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-violet-600/5 dark:bg-violet-500/10 border border-violet-500/20">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Aprovados:</span>
          <span className="font-bold text-violet-700 dark:text-violet-300 font-mono">
            {formatMZN(totalAprovados)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Total:</span>
          <span className="font-bold text-indigo-700 dark:text-indigo-300 font-mono">
            {formatMZN(totalVolume)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">Efetividade:</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
            {financialConvRate}%
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div key={animationKey} className="h-[210px] sm:h-[250px] md:h-[280px] w-full min-w-0 otter-chart-animate relative">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
          <LineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#64748B"
              strokeOpacity={0.15}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#64748B', strokeOpacity: 0.2 }}
              interval="preserveStartEnd"
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={54}
              domain={[0, yDomainMax]}
              allowDataOverflow={false}
              tickFormatter={(v: number) => {
                if (v === 0) return '0 MT';
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) {
                  const k = v / 1000;
                  return Number.isInteger(k) ? `${k}k MT` : `${k.toFixed(1)}k MT`;
                }
                return `${v} MT`;
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const titleLabel = item?.dayName
                    ? `${item.dayName}${item.fullDate ? ` (${item.fullDate})` : ''}`
                    : item?.fullDate
                    ? `${label} (${item.fullDate})`
                    : `${label}`;

                  return (
                    <div className="bg-white dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[200px]">
                      <p className="font-semibold text-slate-900 dark:text-[#F8FAFC] pb-1 border-b border-slate-200 dark:border-[#1E1B26]">
                        {titleLabel}
                      </p>
                      {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-[#94A3B8]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] font-mono">
                            {formatMZN(Number(entry.value))}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            {showAprovados && (
              <Line
                key={`aprovados-vol-${animationKey}`}
                type="linear"
                name="Carrinhos Aprovados"
                dataKey="aprovados"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, value, key } = props;
                  if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) {
                    return <React.Fragment key={key} />;
                  }
                  if (!value || value <= 0) return <React.Fragment key={key} />;
                  return (
                    <g key={key}>
                      <circle cx={cx} cy={cy} r={4.5} fill="#8B5CF6" stroke="#FFFFFF" strokeWidth={2} />
                      <circle cx={cx} cy={cy} r={7.5} fill="#8B5CF6" fillOpacity={0.25} />
                    </g>
                  );
                }}
                isAnimationActive={true}
                animationDuration={620}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
            {showVolume && (
              <Line
                key={`total-vol-${animationKey}`}
                type="linear"
                name="Total de Carrinhos"
                dataKey="volume"
                stroke="#6366F1"
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeOpacity={0.85}
                dot={(props: any) => {
                  const { cx, cy, value, key } = props;
                  if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) {
                    return <React.Fragment key={key} />;
                  }
                  if (!value || value <= 0) return <React.Fragment key={key} />;
                  return (
                    <g key={key}>
                      <circle cx={cx} cy={cy} r={4} fill="#6366F1" stroke="#FFFFFF" strokeWidth={1.5} />
                    </g>
                  );
                }}
                isAnimationActive={true}
                animationDuration={680}
                animationEasing="ease-out"
                activeDot={{ r: 4.5, fill: '#6366F1', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Informative empty state overlay when period has 0 MT in sales and volume */}
        {!hasActivity && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50/90 dark:bg-[#14121D]/90 border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs shadow-sm backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span>Sem movimentação financeira neste período (MT 0,00)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
