'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { getMozambiqueDate, getMozambiqueDateString } from '@/lib/utils';

export interface HourlyDataPoint {
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

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const toDateInputString = (d: Date) => getMozambiqueDateString(d);

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

  // Calendar & Date Selection State (Calibrated for Mozambique Africa/Maputo, CAT = UTC+2)
  const now = useMemo(() => getMozambiqueDate(), []);
  const todayStr = useMemo(() => getMozambiqueDateString(), []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  );
  const [monthActivity, setMonthActivity] = useState<Record<number, { total: number; approved: number }>>({});

  // Active dataset & metadata
  const [activeData, setActiveData] = useState<HourlyDataPoint[]>(data);
  const [customBadge, setCustomBadge] = useState<string | null>(null);
  const [customSubtitle, setCustomSubtitle] = useState<string | null>(null);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [localAnimKey, setLocalAnimKey] = useState<string>(animationKey);

  const calendarRef = useRef<HTMLDivElement>(null);

  // Synchronize when data prop changes from outside (e.g. real-time today sync)
  useEffect(() => {
    if (selectedDate === todayStr) {
      setActiveData(data);
      setLocalAnimKey(`prop-${animationKey}`);
    }
  }, [data, selectedDate, todayStr, animationKey]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Fetch month activity for calendar dots when the slider month changes
  useEffect(() => {
    if (!isCalendarOpen) return;
    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, '0');
    const monthQuery = `${year}-${month}`;

    fetch(`/api/analytics/hourly?month=${monthQuery}&date=${selectedDate}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.monthActivity) {
          setMonthActivity(res.monthActivity);
        }
      })
      .catch(() => {});
  }, [calendarMonth, isCalendarOpen, selectedDate]);

  // Load hourly data for a selected date
  const loadDateData = async (dateStr: string) => {
    setIsLoadingDate(true);
    try {
      const res = await fetch(`/api/analytics/hourly?date=${dateStr}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActiveData(json.data);
        setSelectedDate(dateStr);
        setCustomBadge(json.badgeLabel);
        setCustomSubtitle(
          `Movimento hora a hora durante as 24 horas de ${json.shortDateText} (00:00 – 23:59): Carrinhos Iniciados vs. Vendas Aprovadas`
        );
        setLocalAnimKey(`date-${dateStr}-${Date.now()}`);
        if (json.monthActivity) {
          setMonthActivity(json.monthActivity);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do dia:', err);
    } finally {
      setIsLoadingDate(false);
      setIsCalendarOpen(false);
    }
  };

  // Month navigation in calendar slider
  const handlePrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    // Do not allow sliding past the current month/year
    if (next.getFullYear() > now.getFullYear() || (next.getFullYear() === now.getFullYear() && next.getMonth() > now.getMonth())) {
      return;
    }
    setCalendarMonth(next);
  };

  // Metrics for active dataset
  const totalIniciados = activeData.reduce((acc, curr) => acc + curr.iniciados, 0);
  const totalAprovados = activeData.reduce((acc, curr) => acc + curr.aprovados, 0);
  const taxaMedia = totalIniciados > 0 ? ((totalAprovados / totalIniciados) * 100).toFixed(1) : '0';

  // Dynamic peak calculation for wave dots
  const peakIniciados = useMemo(() => {
    let maxVal = 0;
    let maxIdx = -1;
    activeData.forEach((d, i) => {
      const v = Number(d.iniciados) || 0;
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return { val: maxVal, idx: maxIdx };
  }, [activeData]);

  const peakAprovados = useMemo(() => {
    let maxVal = 0;
    let maxIdx = -1;
    activeData.forEach((d, i) => {
      const v = Number(d.aprovados) || 0;
      if (v > maxVal) {
        maxVal = v;
        maxIdx = i;
      }
    });
    return { val: maxVal, idx: maxIdx };
  }, [activeData]);

  // Dynamic peak hour calculation
  const peakEntry = activeData.reduce(
    (best, curr, idx) => {
      const score = curr.aprovados * 2 + curr.iniciados;
      return score > best.score ? { score, idx, hour: curr.hour } : best;
    },
    { score: 0, idx: 19, hour: '19:00' }
  );
  const nextPeakHour = activeData[Math.min(activeData.length - 1, peakEntry.idx + 1)]?.hour || '21:00';
  const peakRangeText =
    peakEntry.score > 0
      ? `${peakEntry.hour} e ${nextPeakHour}`
      : 'sem picos registados no dia';

  // Calendar days grid computation for currently displayed month
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Seg = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ day: number | null; dateStr: string | null; isFuture: boolean; isToday: boolean; isSelected: boolean }> = [];

    // Empty leading days
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null, isFuture: false, isToday: false, isSelected: false });
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dateStr = toDateInputString(dayDate);
      const isFuture = dayDate > now && dayDate.toDateString() !== now.toDateString();
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      days.push({
        day: d,
        dateStr,
        isFuture,
        isToday,
        isSelected,
      });
    }

    return days;
  }, [calendarMonth, now, todayStr, selectedDate]);

  // Is next month button disabled?
  const isNextMonthDisabled =
    calendarMonth.getFullYear() === now.getFullYear() &&
    calendarMonth.getMonth() >= now.getMonth();

  // Selected date formatted for trigger button
  const displayTriggerDate = useMemo(() => {
    if (selectedDate === todayStr) return 'Hoje (24 Horas)';
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (selectedDate === toDateInputString(yesterday)) return 'Ontem (24 Horas)';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate, todayStr, now]);

  return (
    <div className="otter-widget-card rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-xl w-full max-w-full min-w-0 overflow-visible relative">
      {/* Top Header: Title, Calendar Date Trigger, 24h summary badges & interactive toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4 mb-5 sm:mb-6 min-w-0">
        <div className="min-w-0 relative">
          <div className="flex items-center flex-wrap gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
              {title}
            </h3>

            {/* Interactive Calendar Trigger Pill */}
            <div className="relative inline-block" ref={calendarRef}>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-600/10 hover:bg-violet-600/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 transition-all cursor-pointer shadow-xs active:scale-95"
                title="Clique para abrir o calendário e escolher qualquer dia"
              >
                <svg className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{customBadge || badgeLabel || displayTriggerDate}</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${isCalendarOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* CALENDAR POPOVER & MONTH SLIDER */}
              {isCalendarOpen && (
                <div
                  className="absolute left-0 sm:left-auto top-full mt-2.5 z-50 w-[310px] sm:w-[330px] rounded-2xl bg-white dark:bg-[#100E17] border border-slate-200 dark:border-[#221D2F] p-4 shadow-2xl text-slate-900 dark:text-[#F8FAFC] animate-in fade-in zoom-in-95 duration-150"
                  style={{
                    boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 25px -5px rgba(139, 92, 246, 0.15)',
                  }}
                >
                    {/* Quick Shortcuts */}
                    <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-white/10 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          loadDateData(todayStr);
                          setCalendarMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
                        }}
                        className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                          selectedDate === todayStr
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const y = new Date(now.getTime() - 86400000);
                          const yStr = getMozambiqueDateString(y);
                          loadDateData(yStr);
                          setCalendarMonth(new Date(Date.UTC(y.getUTCFullYear(), y.getUTCMonth(), 1)));
                        }}
                        className="flex-1 py-1 px-2 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                      >
                        Ontem
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(now.getTime() - 2 * 86400000);
                          const dStr = getMozambiqueDateString(d);
                          loadDateData(dStr);
                          setCalendarMonth(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
                        }}
                        className="flex-1 py-1 px-2 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-all cursor-pointer text-center"
                      >
                        Anteontem
                      </button>
                    </div>

                  {/* Month Navigation / Slider Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors"
                      title="Mês Anterior"
                    >
                      ‹
                    </button>
                    <div className="text-center font-bold text-xs sm:text-sm tracking-wide text-slate-900 dark:text-white">
                      {MONTH_NAMES[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      disabled={isNextMonthDisabled}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isNextMonthDisabled
                          ? 'opacity-25 cursor-not-allowed text-slate-400'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                      }`}
                      title={isNextMonthDisabled ? 'Mês Futuro Indisponível' : 'Próximo Mês'}
                    >
                      ›
                    </button>
                  </div>

                  {/* Weekday Header Labels */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {WEEK_DAYS_SHORT.map((wd) => (
                      <span key={wd} className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 py-1">
                        {wd}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((item, idx) => {
                      if (!item.day || !item.dateStr) {
                        return <div key={`empty-${idx}`} className="w-8 h-8" />;
                      }

                      const activity = monthActivity[item.day];
                      const hasSales = activity && activity.approved > 0;
                      const hasInitiated = activity && activity.total > 0;

                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          disabled={item.isFuture}
                          onClick={() => item.dateStr && loadDateData(item.dateStr)}
                          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all ${
                            item.isFuture
                              ? 'opacity-20 cursor-not-allowed text-slate-400'
                              : item.isSelected
                              ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30 scale-105 z-10'
                              : item.isToday
                              ? 'border-2 border-violet-500 text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-50 dark:hover:bg-violet-950/40 cursor-pointer'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer'
                          }`}
                        >
                          <span>{item.day}</span>
                          {/* Dot indicator for activity on that day */}
                          {!item.isSelected && (hasSales || hasInitiated) && (
                            <span
                              className={`absolute bottom-1 w-1 h-1 rounded-full ${
                                hasSales ? 'bg-emerald-500' : 'bg-violet-500'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Footer note */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Dias com vendas</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCalendarOpen(false)}
                      className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Loading Spinner when fetching selected date */}
            {isLoadingDate && (
              <span className="inline-flex items-center gap-1 text-[11px] text-violet-600 dark:text-violet-400 font-bold animate-pulse">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Carregando dia...</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
            {customSubtitle || subtitle || (
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
      <div key={localAnimKey} className="h-[230px] sm:h-[260px] md:h-[300px] w-full min-w-0 otter-chart-animate">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={activeData} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#64748B" strokeOpacity={0.15} vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#64748B', strokeOpacity: 0.2 }}
              interval={2}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
              domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax * 1.25), 4)]}
              allowDataOverflow={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0]?.payload as HourlyDataPoint;
                  const conv = item && item.iniciados > 0 
                    ? ((item.aprovados / item.iniciados) * 100).toFixed(0) 
                    : '0';

                  return (
                    <div className="bg-white dark:bg-[#0F0E14] border border-slate-200 dark:border-[#1E1B26] p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[190px]">
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
                key={`iniciados-${localAnimKey}`}
                type="monotone"
                name="Carrinhos Iniciados"
                dataKey="iniciados"
                stroke="#8B5CF6"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={(props: any) => {
                  const { cx, cy, index, key } = props;
                  if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) {
                    return <React.Fragment key={key} />;
                  }
                  // Pontinho destacado no pico da onda
                  if (peakIniciados.val > 0 && index === peakIniciados.idx) {
                    return (
                      <g key={key} className="pointer-events-none">
                        <circle cx={cx} cy={cy} r={10} fill="#8B5CF6" fillOpacity={0.16} />
                        <circle cx={cx} cy={cy} r={7} fill="#8B5CF6" fillOpacity={0.32} />
                        <circle cx={cx} cy={cy} r={4.5} fill="#8B5CF6" stroke="#FFFFFF" strokeWidth={2.5} />
                        <circle cx={cx} cy={cy} r={1.5} fill="#FFFFFF" />
                      </g>
                    );
                  }
                  return <React.Fragment key={key} />;
                }}
                isAnimationActive={true}
                animationDuration={620}
                animationEasing="ease-out"
                activeDot={{ r: 5, fill: '#8B5CF6', stroke: 'var(--bg-surface, #FFFFFF)', strokeWidth: 2 }}
              />
            )}

            {showAprovados && (
              <Line
                key={`aprovados-${localAnimKey}`}
                type="monotone"
                name="Vendas Aprovadas"
                dataKey="aprovados"
                stroke="#10B981"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={(props: any) => {
                  const { cx, cy, index, key } = props;
                  if (typeof cx !== 'number' || typeof cy !== 'number' || isNaN(cx) || isNaN(cy)) {
                    return <React.Fragment key={key} />;
                  }
                  // Pontinho destacado no pico da onda
                  if (peakAprovados.val > 0 && index === peakAprovados.idx) {
                    return (
                      <g key={key} className="pointer-events-none">
                        <circle cx={cx} cy={cy} r={10} fill="#10B981" fillOpacity={0.16} />
                        <circle cx={cx} cy={cy} r={7} fill="#10B981" fillOpacity={0.32} />
                        <circle cx={cx} cy={cy} r={4.5} fill="#10B981" stroke="#FFFFFF" strokeWidth={2.5} />
                        <circle cx={cx} cy={cy} r={1.5} fill="#FFFFFF" />
                      </g>
                    );
                  }
                  return <React.Fragment key={key} />;
                }}
                isAnimationActive={true}
                animationDuration={680}
                animationEasing="ease-out"
                activeDot={{ r: 5.5, fill: '#10B981', stroke: 'var(--bg-surface, #FFFFFF)', strokeWidth: 2 }}
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
              <span>Sem picos registados nas 24 horas do dia ({customBadge || badgeLabel})</span>
            )}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 dark:text-[#64748B]">
          Sincronizado em tempo real • Fluxo diário 24h (00:00 – 23:59)
        </span>
      </div>
    </div>
  );
}
