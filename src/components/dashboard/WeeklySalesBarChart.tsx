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
  data?: { day: string; vendas: number; date?: string }[];
}

const defaultWeeklyData = [
  { day: 'Segunda', vendas: 0 },
  { day: 'Terça', vendas: 0 },
  { day: 'Quarta', vendas: 0 },
  { day: 'Quinta', vendas: 0 },
  { day: 'Sexta', vendas: 0 },
  { day: 'Sábado', vendas: 0 },
  { day: 'Domingo', vendas: 0 },
];

export default function WeeklySalesBarChart({ data = defaultWeeklyData }: WeeklySalesBarChartProps) {
  return (
    <div className="otter-widget-card rounded-2xl p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#F8FAFC]">Vendas por Dia</h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">Ciclo semanal atual (Segunda a Domingo)</p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20">
          Semana Atual
        </div>
      </div>

      <div className="h-[200px] md:h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#1E1B26' }}
              tickFormatter={(val) => val.substring(0, 3)}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(124, 58, 237, 0.08)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#0F0E14] border border-[#1E1B26] p-3 rounded-xl shadow-2xl text-xs">
                      <p className="font-semibold text-[#F8FAFC]">
                        {item.day} {item.date ? `(${item.date})` : ''}
                      </p>
                      <p className="text-violet-400 font-bold mt-1 text-sm">
                        {item.vendas} {item.vendas === 1 ? 'venda' : 'vendas'}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="vendas"
              fill="url(#barPurpleGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
