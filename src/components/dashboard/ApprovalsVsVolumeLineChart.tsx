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
import { formatMZN } from '@/lib/utils';

interface ApprovalsVsVolumeLineChartProps {
  data?: {
    date: string;
    dayName?: string;
    fullDate?: string;
    aprovados: number;
    volume: number;
  }[];
}

const generate7DayData = () => {
  const result = [];
  const weekDayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const weekDayShort = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const now = new Date();
  const currentJsDay = now.getDay();
  const diffToMonday = currentJsDay === 0 ? 6 : currentJsDay - 1;
  const startOfThisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfThisWeek);
    d.setDate(startOfThisWeek.getDate() + i);
    const dateLabel = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
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

export default function ApprovalsVsVolumeLineChart({ data = defaultData }: ApprovalsVsVolumeLineChartProps) {
  const [showAprovados, setShowAprovados] = useState(true);
  const [showVolume, setShowVolume] = useState(true);

  return (
    <div className="otter-widget-card rounded-2xl p-6 flex flex-col justify-between">
      {/* Header with Title and Interactive Toggles in Top Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[#F8FAFC]">
              Carrinhos Aprovados vs Total de Carrinhos
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20">
              7 Dias
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Evolução diária da semana atual (Segunda a Domingo em Meticais)
          </p>
        </div>

        {/* Legend toggles */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setShowAprovados(!showAprovados)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              showAprovados
                ? 'bg-violet-600/10 border-violet-500/30 text-violet-300'
                : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-60'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" />
            <span>Carrinhos Aprovados</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
              showVolume
                ? 'bg-purple-400/10 border-purple-400/30 text-purple-300'
                : 'bg-[#0F0E14] border-[#1E1B26] text-[#64748B] opacity-60'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-[#A78BFA]" />
            <span>Total de Carrinhos</span>
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px] md:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E1B26" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#1E1B26' }}
              interval={0}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const titleLabel = item?.dayName
                    ? `${item.dayName} (${item.fullDate})`
                    : item?.fullDate
                    ? `${label} (${item.fullDate})`
                    : `Dia ${label}`;

                  return (
                    <div className="bg-[#0F0E14] border border-[#1E1B26] p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                      <p className="font-semibold text-[#F8FAFC] pb-1 border-b border-[#1E1B26]">
                        {titleLabel}
                      </p>
                      {payload.map((entry: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[#94A3B8]">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}:
                          </span>
                          <span className="font-bold text-[#F8FAFC]">
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
                type="monotone"
                name="Carrinhos Aprovados"
                dataKey="aprovados"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#8B5CF6', stroke: '#08070C', strokeWidth: 2 }}
              />
            )}
            {showVolume && (
              <Line
                type="monotone"
                name="Total de Carrinhos"
                dataKey="volume"
                stroke="#A78BFA"
                strokeWidth={2}
                strokeDasharray="4 4"
                strokeOpacity={0.75}
                dot={false}
                activeDot={{ r: 4, fill: '#A78BFA', stroke: '#08070C', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
