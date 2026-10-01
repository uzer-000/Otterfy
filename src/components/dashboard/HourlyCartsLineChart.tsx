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
  badgeLabel?: string;
}

export default function HourlyCartsLineChart({
  data = defaultHourlyData,
  title = 'Fluxo por Horário (00:00 – 23:59)',
  badgeLabel = 'Hoje (24 Horas)',
}: HourlyCartsLineChartProps) {
  const [showIniciados, setShowIniciados] = useState(true);
  const [showAprovados, setShowAprovados] = useState(true);

  const totalIniciados = data.reduce((acc, curr) => acc + curr.iniciados, 0);
  const totalAprovados = data.reduce((acc, curr) => acc + curr.aprovados, 0);
  const taxaMedia = totalIniciados > 0 ? ((totalAprovados / totalIniciados) * 100).toFixed(1) : '0';

  return (
    <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 flex flex-col justify-between shadow-xl w-full">
      {/* Top Header: Title, 24h summary badges & interactive toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              {title}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
              {badgeLabel}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1">
            Comparativo em tempo real: <span className="text-[#A78BFA] font-medium">Carrinhos Iniciados</span> vs.{' '}
            <span className="text-emerald-400 font-medium">Vendas Aprovadas</span>
          </p>
        </div>

        {/* Badges & Legend Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Quick Metrics Badges */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-xs">
            <span className="text-[#94A3B8]">Iniciados:</span>
            <span className="text-[#A78BFA] font-bold font-mono">{totalIniciados}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-xs">
            <span className="text-[#94A3B8]">Aprovados:</span>
            <span className="text-emerald-400 font-bold font-mono">{totalAprovados}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-xs">
            <span className="text-[#94A3B8]">Conversão:</span>
            <span className="text-violet-300 font-bold font-mono">{taxaMedia}%</span>
          </div>

          {/* Interactive Line Toggles */}
          <div className="flex items-center gap-2 ml-1">
            <button
              type="button"
              onClick={() => setShowIniciados(!showIniciados)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                showIniciados
                  ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                  : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-50'
              }`}
              title="Alternar visibilidade dos carrinhos iniciados"
            >
              <span className="w-2 h-2 rounded-full bg-[#A78BFA]" />
              <span>Iniciados</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAprovados(!showAprovados)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border cursor-pointer ${
                showAprovados
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-50'
              }`}
              title="Alternar visibilidade das vendas aprovadas"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Aprovados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Long Chart Container */}
      <div className="h-[250px] md:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
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
                    <div className="bg-[#0F0E14] border border-[#1E1B26] p-3.5 rounded-2xl shadow-2xl text-xs space-y-2 min-w-[190px]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-[#1E1B26]">
                        <span className="font-bold text-[#F8FAFC]">Horário: {label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-600/10 text-violet-400 font-mono font-bold">
                          {conv}% conv.
                        </span>
                      </div>

                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-[#94A3B8]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-[#F8FAFC] font-mono">
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
                type="monotone"
                name="Carrinhos Iniciados"
                dataKey="iniciados"
                stroke="#A78BFA"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#A78BFA', stroke: '#08070C', strokeWidth: 2 }}
              />
            )}

            {showAprovados && (
              <Line
                type="monotone"
                name="Vendas Aprovadas"
                dataKey="aprovados"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#10B981', stroke: '#08070C', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info: Peak hour indicator */}
      <div className="pt-4 mt-2 border-t border-[#1E1B26] flex items-center justify-between text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span>Pico diário registrado entre as <strong>19:00 e 21:00</strong></span>
        </div>
        <span className="text-[11px] text-[#64748B]">Atualização automática a cada 60s</span>
      </div>
    </div>
  );
}
