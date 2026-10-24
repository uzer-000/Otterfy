'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface WeeklySalesBarChartProps {
  data?: { day: string; fullLabel?: string; vendas: number; date?: string }[];
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  animationKey?: string;
}

const defaultWeeklyData = [
  { day: 'Seg', fullLabel: 'Segunda', vendas: 0 },
  { day: 'Ter', fullLabel: 'Terça', vendas: 0 },
  { day: 'Qua', fullLabel: 'Quarta', vendas: 0 },
  { day: 'Qui', fullLabel: 'Quinta', vendas: 0 },
  { day: 'Sex', fullLabel: 'Sexta', vendas: 0 },
  { day: 'Sáb', fullLabel: 'Sábado', vendas: 0 },
  { day: 'Dom', fullLabel: 'Domingo', vendas: 0 },
];

export default function WeeklySalesBarChart({
  data = defaultWeeklyData,
  title = 'Vendas por Dia',
  subtitle = 'Ciclo semanal atual (Segunda a Domingo)',
  badgeLabel = 'Semana Atual',
  animationKey = 'default',
}: WeeklySalesBarChartProps) {
  return (
    <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between w-full max-w-full min-w-0 overflow-hidden">
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 min-w-0">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate">{title}</h3>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 whitespace-nowrap shrink-0 transition-all duration-300">
          {badgeLabel}
        </div>
      </div>

      <div key={animationKey} className="h-[210px] sm:h-[250px] md:h-[280px] w-full min-w-0 otter-chart-animate">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="barPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1B26" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E1B26' }}
              padding={{ left: 8, right: 8 }}
              tickFormatter={(val: string) =>
                val && val.length > 5 && !val.includes(' ') ? val.substring(0, 3) : val
              }
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
              domain={[0, (dataMax: number) => Math.max(dataMax, 4)]}
              allowDataOverflow={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] p-3 rounded-xl shadow-xl text-xs">
                      <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {item.fullLabel || item.day} {item.date ? `(${item.date})` : ''}
                      </p>
                      <p className="text-violet-600 dark:text-violet-400 font-bold mt-1 text-sm">
                        {item.vendas} {item.vendas === 1 ? 'venda aprovada' : 'vendas aprovadas'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              key={`bar-${animationKey}`}
              dataKey="vendas"
              fill="url(#barPurpleGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              isAnimationActive={true}
              animationDuration={620}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
