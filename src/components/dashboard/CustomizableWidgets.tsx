'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import KPICard from './KPICard';
import WeeklySalesBarChart from './WeeklySalesBarChart';
import ApprovalsVsVolumeLineChart from './ApprovalsVsVolumeLineChart';
import HourlyCartsLineChart from './HourlyCartsLineChart';
import ConversionAndMethods from './ConversionAndMethods';
import CensoredTransactionsTable from './CensoredTransactionsTable';
import AwardsModal from './AwardsModal';
import { formatMZN, formatProgressPercent, getMozambiqueDate, getMozambiqueDateString } from '@/lib/utils';

export interface DashboardBlock {
  id: string;
  label: string;
  visible: boolean;
  type: 'hourly' | 'kpis' | 'dailyCharts' | 'conversion' | 'transactions';
}

export interface KpiItem {
  id: string;
  label: string;
  visible: boolean;
}

export type PeriodKey = 'yesterday' | 'today' | 'week' | 'month' | 'year' | 'all';

export interface PeriodMetric {
  salesCount: number;
  revenue: number;
  pendingCount: number;
  expiredCount: number;
  salesTrend: string;
  revenueTrend: string;
  pendingTrend: string;
  vsLabel: string;
  expiredLabel: string;
  periodBadge?: string;
  hourlyBadge?: string;
  hourlyTitle?: string;
  hourlySubtitle?: string;
  barChartTitle?: string;
  barChartSubtitle?: string;
  lineChartTitle?: string;
  lineChartSubtitle?: string;
  hourlyData?: { hour: string; iniciados: number; aprovados: number }[];
  barChartData?: { day: string; fullLabel?: string; vendas: number; date?: string }[];
  approvalsVsVolumeData?: { date: string; dayName?: string; fullDate?: string; aprovados: number; volume: number }[];
  conversionRate?: number;
  emolaTotal?: number;
  mpesaTotal?: number;
  recentTransactions?: Transaction[];
}

const DEFAULT_BLOCKS: DashboardBlock[] = [
  { id: 'kpis', label: 'Indicadores Principais (KPIs)', visible: true, type: 'kpis' },
  { id: 'hourly', label: 'Gráfico 24h do Dia: Fluxo por Horário (00:00 – 23:59)', visible: true, type: 'hourly' },
  { id: 'dailyCharts', label: 'Gráficos Diários (Vendas por Dia & Carrinhos Aprovados vs Total)', visible: true, type: 'dailyCharts' },
  { id: 'conversion', label: 'Conversão & Métodos (eMola / M-Pesa)', visible: true, type: 'conversion' },
  { id: 'transactions', label: 'Últimas Transações (6 itens)', visible: true, type: 'transactions' },
];

const DEFAULT_KPIS: KpiItem[] = [
  { id: 'totalSales', label: 'Total de Vendas', visible: true },
  { id: 'totalRevenue', label: 'Receita Total', visible: true },
  { id: 'pendingSales', label: 'Vendas Pendentes', visible: true },
  { id: 'expiredSales', label: 'Vendas Expiradas', visible: true },
];

const PERIOD_OPTIONS: { id: PeriodKey; label: string }[] = [
  { id: 'yesterday', label: 'Ontem' },
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
  { id: 'all', label: 'Tudo' },
];

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  productName: string;
  date: string;
  method?: string;
}

export interface ClientOrder {
  id: string;
  reference: string;
  amount: number;
  status: string;
  productName: string;
  createdAt: string;
  method?: string;
}

const CAT_OFFSET_MS = 2 * 60 * 60 * 1000; // UTC+2 (Maputo, Moçambique)

function parseMozDateParts(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    return { year: parts[0], month: parts[1] - 1, day: parts[2] };
  }
  const mozNow = getMozambiqueDate();
  return {
    year: mozNow.getUTCFullYear(),
    month: mozNow.getUTCMonth(),
    day: mozNow.getUTCDate(),
  };
}

function formatShiftedDateStr(shiftedMs: number): string {
  const d = new Date(shiftedMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShiftedShortDate(shiftedMs: number): string {
  const d = new Date(shiftedMs);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${m}`;
}

function calcTrendStr(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100.0%' : '+0.0%';
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

interface CustomizableWidgetsProps {
  todayRevenue: number;
  todaySalesCount: number;
  weekRevenue: number;
  weekSalesCount: number;
  monthRevenue: number;
  monthSalesCount: number;
  pendingAmount?: number;
  pendingCount?: number;
  lostAmount?: number;
  lostCount?: number;
  refundsAmount?: number;
  refundsCount?: number;
  averageTicket?: number;
  emolaTotal?: number;
  mpesaTotal?: number;
  conversionRate?: number;
  recentTransactions?: Transaction[];
  totalRevenue?: number;
  approvedCount?: number;
  hourlyData?: { hour: string; iniciados: number; aprovados: number }[];
  weeklyData?: { day: string; vendas: number; date?: string }[];
  approvalsVsVolumeData?: { date: string; dayName?: string; fullDate?: string; aprovados: number; volume: number }[];
  periodStats?: Record<PeriodKey, PeriodMetric>;
  initialOrders?: ClientOrder[];
}

export default function CustomizableWidgets({
  todayRevenue = 0,
  todaySalesCount = 0,
  weekRevenue = 0,
  weekSalesCount = 0,
  monthRevenue = 0,
  monthSalesCount = 0,
  pendingAmount = 0,
  pendingCount = 0,
  lostAmount = 0,
  lostCount = 0,
  refundsAmount = 0,
  refundsCount = 0,
  averageTicket = 0,
  emolaTotal = 0,
  mpesaTotal = 0,
  conversionRate = 0,
  recentTransactions = [],
  totalRevenue = 0,
  approvedCount = 0,
  hourlyData,
  weeklyData,
  approvalsVsVolumeData,
  periodStats,
  initialOrders = [],
}: CustomizableWidgetsProps) {
  const [blocks, setBlocks] = useState<DashboardBlock[]>(DEFAULT_BLOCKS);
  const [kpis, setKpis] = useState<KpiItem[]>(DEFAULT_KPIS);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('week');
  const todayMozStr = useMemo(() => getMozambiqueDateString(), []);
  const [referenceDateStr, setReferenceDateStr] = useState<string>(() => getMozambiqueDateString());
  const [ordersList, setOrdersList] = useState<ClientOrder[]>(initialOrders);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [customizingOpen, setCustomizingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'kpis'>('blocks');
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [draggedKpiIndex, setDraggedKpiIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [liveHourlyToday, setLiveHourlyToday] = useState<{ hour: string; iniciados: number; aprovados: number }[] | null>(null);
  const [liveHourlyYesterday, setLiveHourlyYesterday] = useState<{ hour: string; iniciados: number; aprovados: number }[] | null>(null);
  const [liveSummary, setLiveSummary] = useState<{
    totalApprovedRevenue?: number;
    totalApprovedCount?: number;
    todayRevenue?: number;
    todaySalesCount?: number;
    yesterdayRevenue?: number;
    yesterdaySalesCount?: number;
    weekRevenue?: number;
    weekSalesCount?: number;
    monthRevenue?: number;
    monthSalesCount?: number;
    pendingCount?: number;
    expiredCount?: number;
  } | null>(null);

  useEffect(() => {
    if (initialOrders && initialOrders.length > 0) {
      setOrdersList(initialOrders);
    }
  }, [initialOrders]);

  useEffect(() => {
    const handleOrdersUpdated = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.summary) {
        setLiveSummary(customEvt.detail.summary);
      }
      fetch('/api/payments', { cache: 'no-store' })
        .then((r) => r.json())
        .then((json) => {
          if (json.summary) setLiveSummary(json.summary);
          if (Array.isArray(json.data)) {
            setOrdersList(
              json.data.map((o: {
                id: string;
                amount: number;
                status: string;
                createdAt: string;
                product?: { name?: string };
                transaction?: { id?: string; method?: string | null } | null;
              }) => ({
                id: o.id,
                reference: o.transaction?.id || o.id,
                amount: o.amount,
                status: o.status,
                productName: o.product?.name || 'Produto Digital',
                createdAt: o.createdAt,
                method: o.transaction?.method || 'MPESA',
              }))
            );
          }
        })
        .catch(() => {});
    };
    window.addEventListener('orders_updated', handleOrdersUpdated);
    return () => window.removeEventListener('orders_updated', handleOrdersUpdated);
  }, []);

  // Live 24-hour daily flow synchronization (00:00 - 23:59 in local timezone)
  useEffect(() => {
    let active = true;
    let lastSync = 0;

    // Fetch yesterday once on mount since historical 24h data is static
    const fetchYesterdayOnce = async () => {
      try {
        const mozNow = getMozambiqueDate();
        const yDate = new Date(mozNow.getTime() - 86400000);
        const yesterdayIso = getMozambiqueDateString(yDate);
        const resYesterday = await fetch(`/api/analytics/hourly?date=${yesterdayIso}`);
        if (!active) return;
        if (resYesterday.ok) {
          const jsonYesterday = await resYesterday.json();
          if (jsonYesterday.success && Array.isArray(jsonYesterday.data)) {
            setLiveHourlyYesterday(jsonYesterday.data);
          }
        }
      } catch {}
    };

    fetchYesterdayOnce();

    const syncTodayFlow = async () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastSync < 30_000) return; // Minimum 30s throttle
      lastSync = now;

      try {
        const resToday = await fetch('/api/analytics/hourly');
        if (!active) return;
        if (resToday.ok) {
          const jsonToday = await resToday.json();
          if (jsonToday.success && Array.isArray(jsonToday.data)) {
            setLiveHourlyToday(jsonToday.data);
          }
        }
      } catch {
        // Keep server-rendered 24h series if offline
      }
    };

    syncTodayFlow();
    // 90-second refresh instead of aggressive 15s to preserve Neon network transfer budget
    const interval = setInterval(syncTodayFlow, 90_000);
    const handleFocus = () => syncTodayFlow();
    window.addEventListener('focus', handleFocus);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getNextMilestone = (rev: number) => {
    if (rev < 50000) return { name: 'Pulseira Bronze (50K)', target: 50000, level: '50K', imageSrc: '/awards/50k.png' };
    if (rev < 100000) return { name: 'Placa Prata (100K)', target: 100000, level: '100K', imageSrc: '/awards/100k.png' };
    if (rev < 500000) return { name: 'Placa Ouro (500K)', target: 500000, level: '500K', imageSrc: '/awards/500k.png' };
    if (rev < 1000000) return { name: 'Placa Diamante (1M)', target: 1000000, level: '1M', imageSrc: '/awards/1m.png' };
    if (rev < 5000000) return { name: 'Placa Black (5M)', target: 5000000, level: '5M', imageSrc: '/awards/5m.png' };
    return { name: 'Placa Titan (10M)', target: 10000000, level: '10M', imageSrc: '/awards/10m.png' };
  };

  // Synchronize theme with html data-theme
  useEffect(() => {
    const updateTheme = () => {
      const attr = document.documentElement.getAttribute('data-theme');
      const current = attr === 'dark' ? 'dark' : 'light';
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

  // Load layout from localStorage
  useEffect(() => {
    try {
      const savedBlocks = localStorage.getItem('otterfy-dashboard-blocks-v2');
      if (savedBlocks) {
        const parsed = JSON.parse(savedBlocks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with defaults to guarantee all IDs are present
          const merged = DEFAULT_BLOCKS.map((def) => {
            const found = parsed.find((p: DashboardBlock) => p.id === def.id);
            return found ? { ...def, visible: found.visible } : def;
          });
          // Order by saved order
          const ordered: DashboardBlock[] = [];
          parsed.forEach((p: DashboardBlock) => {
            const item = merged.find((m) => m.id === p.id);
            if (item && !ordered.some((o) => o.id === item.id)) ordered.push(item);
          });
          merged.forEach((m) => {
            if (!ordered.some((o) => o.id === m.id)) ordered.push(m);
          });
          setBlocks(ordered);
        }
      }

      const savedKpis = localStorage.getItem('otterfy-dashboard-kpis-v3');
      if (savedKpis) {
        const parsedKpis = JSON.parse(savedKpis);
        if (Array.isArray(parsedKpis) && parsedKpis.length > 0) {
          const mergedKpis = DEFAULT_KPIS.map((def) => {
            const found = parsedKpis.find((p: KpiItem) => p.id === def.id);
            return found ? { ...def, visible: found.visible } : def;
          });
          setKpis(mergedKpis);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar layout da dashboard', e);
    }
  }, []);

  const saveBlocks = (items: DashboardBlock[]) => {
    setBlocks(items);
    localStorage.setItem('otterfy-dashboard-blocks-v2', JSON.stringify(items));
  };

  const saveKpis = (items: KpiItem[]) => {
    setKpis(items);
    localStorage.setItem('otterfy-dashboard-kpis-v3', JSON.stringify(items));
  };

  const toggleBlock = (id: string) => {
    const updated = blocks.map((b) => (b.id === id ? { ...b, visible: !b.visible } : b));
    saveBlocks(updated);
  };

  const toggleKpi = (id: string) => {
    const updated = kpis.map((k) => (k.id === id ? { ...k, visible: !k.visible } : k));
    saveKpis(updated);
  };

  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    saveBlocks(copy);
  };

  const moveBlockDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    saveBlocks(copy);
  };

  const moveKpiUp = (index: number) => {
    if (index === 0) return;
    const copy = [...kpis];
    const temp = copy[index];
    copy[index] = copy[index - 1];
    copy[index - 1] = temp;
    saveKpis(copy);
  };

  const moveKpiDown = (index: number) => {
    if (index === kpis.length - 1) return;
    const copy = [...kpis];
    const temp = copy[index];
    copy[index] = copy[index + 1];
    copy[index + 1] = temp;
    saveKpis(copy);
  };

  const resetAll = () => {
    saveBlocks(DEFAULT_BLOCKS);
    saveKpis(DEFAULT_KPIS);
  };

  // Drag and Drop for Blocks
  const handleBlockDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBlockIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBlockDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedBlockIndex === null || draggedBlockIndex === index) return;
    const copy = [...blocks];
    const draggedItem = copy[draggedBlockIndex];
    copy.splice(draggedBlockIndex, 1);
    copy.splice(index, 0, draggedItem);
    setDraggedBlockIndex(index);
    setBlocks(copy);
  };

  const handleBlockDragEnd = () => {
    setDraggedBlockIndex(null);
    localStorage.setItem('otterfy-dashboard-blocks-v2', JSON.stringify(blocks));
  };

  // Interactive date & week navigation handlers
  const shiftPeriodDate = (direction: -1 | 1) => {
    const baseStr =
      selectedPeriod === 'yesterday' && referenceDateStr === todayMozStr
        ? formatShiftedDateStr(
            Date.UTC(
              parseMozDateParts(todayMozStr).year,
              parseMozDateParts(todayMozStr).month,
              parseMozDateParts(todayMozStr).day - 1
            )
          )
        : referenceDateStr;

    const { year, month, day } = parseMozDateParts(baseStr);

    if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
      const shifted = Date.UTC(year, month, day + direction);
      setReferenceDateStr(formatShiftedDateStr(shifted));
      setSelectedPeriod('today');
      return;
    }

    if (selectedPeriod === 'month') {
      const shifted = Date.UTC(year, month + direction, 1);
      setReferenceDateStr(formatShiftedDateStr(shifted));
      return;
    }

    if (selectedPeriod === 'year') {
      const shifted = Date.UTC(year + direction, month, 1);
      setReferenceDateStr(formatShiftedDateStr(shifted));
      return;
    }

    // Default ('week' or 'all'): step week-by-week (Segunda a Domingo)
    const shifted = Date.UTC(year, month, day + direction * 7);
    setReferenceDateStr(formatShiftedDateStr(shifted));
    if (selectedPeriod === 'all') {
      setSelectedPeriod('week');
    }
  };

  const handleDatePick = (pickedStr: string) => {
    if (!pickedStr) return;
    setReferenceDateStr(pickedStr);
    if (selectedPeriod === 'all' || selectedPeriod === 'year' || selectedPeriod === 'yesterday') {
      setSelectedPeriod('week');
    }
  };

  const resetToCurrentDate = () => {
    setReferenceDateStr(todayMozStr);
  };

  const isCustomDateActive = referenceDateStr !== todayMozStr;

  // Dynamic calculation for any selectedPeriod + referenceDateStr (Monday-to-Sunday weekly charts & synchronized widgets)
  const dynamicComputed = useMemo(() => {
    const { year, month, day } = parseMozDateParts(referenceDateStr);
    const refDayStartShifted = Date.UTC(year, month, day, 0, 0, 0, 0);

    // Effective day when 'yesterday' is selected on default date
    const activeDayStartShifted =
      selectedPeriod === 'yesterday' && !isCustomDateActive
        ? refDayStartShifted - 86400_000
        : refDayStartShifted;
    const activeDayEndShifted = activeDayStartShifted + 86400_000 - 1;

    // Monday-to-Sunday bounds around activeDayStartShifted
    const dow = new Date(activeDayStartShifted).getUTCDay(); // 0=Dom, 1=Seg..6=Sab
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const mondayStartShifted = activeDayStartShifted + diffToMonday * 86400_000;
    const sundayEndShifted = mondayStartShifted + 7 * 86400_000 - 1;

    const weekRangeStr = `${formatShiftedShortDate(mondayStartShifted)} – ${formatShiftedShortDate(sundayEndShifted)}`;
    const dayShortStr = formatShiftedShortDate(activeDayStartShifted);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];
    const monthStartShifted = Date.UTC(year, month, 1, 0, 0, 0, 0);
    const nextMonthStartShifted = Date.UTC(year, month + 1, 1, 0, 0, 0, 0);
    const monthEndShifted = nextMonthStartShifted - 1;
    const prevMonthStartShifted = Date.UTC(year, month - 1, 1, 0, 0, 0, 0);
    const prevMonthEndShifted = monthStartShifted - 1;

    const yearStartShifted = Date.UTC(year, 0, 1, 0, 0, 0, 0);
    const yearEndShifted = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0) - 1;
    const prevYearStartShifted = Date.UTC(year - 1, 0, 1, 0, 0, 0, 0);
    const prevYearEndShifted = yearStartShifted - 1;

    let navigatorLabel = `Seg ${formatShiftedShortDate(mondayStartShifted)} – Dom ${formatShiftedShortDate(sundayEndShifted)}`;
    if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
      navigatorLabel = `Dia ${dayShortStr} (Sem ${weekRangeStr})`;
    } else if (selectedPeriod === 'month') {
      navigatorLabel = `${monthNames[month]} ${year}`;
    } else if (selectedPeriod === 'year') {
      navigatorLabel = `Ano ${year}`;
    } else if (selectedPeriod === 'all' && !isCustomDateActive) {
      navigatorLabel = `Seg ${formatShiftedShortDate(mondayStartShifted)} – Dom ${formatShiftedShortDate(sundayEndShifted)}`;
    }

    if (!ordersList || ordersList.length === 0) {
      return { metric: null, navigatorLabel, weekRangeStr };
    }

    // Period start/end in shifted CAT ms
    let pStartShifted = mondayStartShifted;
    let pEndShifted = sundayEndShifted;
    let prevStartShifted = mondayStartShifted - 7 * 86400_000;
    let prevEndShifted = mondayStartShifted - 1;
    let vsLabel = 'vs. semana anterior';
    let expiredLabel = isCustomDateActive ? `na semana (${weekRangeStr})` : 'nesta semana';
    let periodBadge = `Semana (${weekRangeStr})`;
    let hourlyBadge = `Semana (${weekRangeStr})`;
    let hourlyTitle = `Fluxo por Horário na Semana (${weekRangeStr})`;
    let hourlySubtitle = `Iniciados vs. Aprovados de Segunda a Domingo (${weekRangeStr})`;
    let barChartTitle = 'Vendas da Semana (Seg – Dom)';
    let barChartSubtitle = `Vendas aprovadas de Segunda a Domingo (${weekRangeStr})`;
    let lineChartTitle = 'Carrinhos Aprovados vs Total (Seg – Dom)';
    let lineChartSubtitle = `Volume aprovado vs. iniciado de Segunda a Domingo (${weekRangeStr})`;

    if (selectedPeriod === 'today' || selectedPeriod === 'yesterday') {
      pStartShifted = activeDayStartShifted;
      pEndShifted = activeDayEndShifted;
      prevStartShifted = activeDayStartShifted - 86400_000;
      prevEndShifted = activeDayStartShifted - 1;
      const isYest = selectedPeriod === 'yesterday' && !isCustomDateActive;
      vsLabel = isYest ? 'vs. anteontem' : 'vs. dia anterior';
      expiredLabel = isCustomDateActive ? `em ${dayShortStr}` : isYest ? 'ontem' : 'hoje';
      periodBadge = `Semana (${weekRangeStr})`;
      hourlyBadge = isCustomDateActive ? `Dia ${dayShortStr} (24h)` : isYest ? `Ontem (${dayShortStr})` : `Hoje (${dayShortStr})`;
      hourlyTitle = isCustomDateActive
        ? `Fluxo por Horário em ${dayShortStr} (00:00 – 23:59)`
        : isYest
        ? `Fluxo por Horário de Ontem (00:00 – 23:59)`
        : `Fluxo por Horário do Dia (00:00 – 23:59)`;
      hourlySubtitle = `Carrinhos iniciados vs. vendas aprovadas em ${dayShortStr}`;
    } else if (selectedPeriod === 'month') {
      pStartShifted = monthStartShifted;
      pEndShifted = monthEndShifted;
      prevStartShifted = prevMonthStartShifted;
      prevEndShifted = prevMonthEndShifted;
      vsLabel = 'vs. mês anterior';
      expiredLabel = `em ${monthNames[month]}`;
      periodBadge = `Seg – Dom (${monthNames[month]})`;
      hourlyBadge = `${monthNames[month]} (24h)`;
      hourlyTitle = `Fluxo por Horário em ${monthNames[month]} (00:00 – 23:59)`;
      hourlySubtitle = `Distribuição horária acumulada em ${monthNames[month]} ${year}`;
      barChartTitle = `Vendas por Dia da Semana (${monthNames[month]})`;
      barChartSubtitle = `Vendas aprovadas de Segunda a Domingo em ${monthNames[month]}`;
      lineChartTitle = `Carrinhos Aprovados vs Total (${monthNames[month]})`;
      lineChartSubtitle = `Volume de Segunda a Domingo em ${monthNames[month]}`;
    } else if (selectedPeriod === 'year') {
      pStartShifted = yearStartShifted;
      pEndShifted = yearEndShifted;
      prevStartShifted = prevYearStartShifted;
      prevEndShifted = prevYearEndShifted;
      vsLabel = 'vs. ano anterior';
      expiredLabel = `em ${year}`;
      periodBadge = `Seg – Dom (${year})`;
      hourlyBadge = `Ano ${year} (24h)`;
      hourlyTitle = `Fluxo por Horário em ${year} (00:00 – 23:59)`;
      hourlySubtitle = `Distribuição horária acumulada no ano de ${year}`;
      barChartTitle = `Vendas por Dia da Semana (${year})`;
      barChartSubtitle = `Vendas aprovadas de Segunda a Domingo em ${year}`;
      lineChartTitle = `Carrinhos Aprovados vs Total (${year})`;
      lineChartSubtitle = `Volume de Segunda a Domingo em ${year}`;
    } else if (selectedPeriod === 'all') {
      pStartShifted = 0;
      pEndShifted = Number.MAX_SAFE_INTEGER;
      prevStartShifted = 0;
      prevEndShifted = 0;
      vsLabel = 'desde o início';
      expiredLabel = 'em todo o período';
      periodBadge = 'Seg – Dom (Todo o Período)';
      hourlyBadge = 'Todo o Período (24h)';
      hourlyTitle = 'Fluxo por Horário Acumulado (00:00 – 23:59)';
      hourlySubtitle = 'Distribuição horária de todos os pedidos registrados';
      barChartTitle = 'Vendas por Dia da Semana (Seg – Dom)';
      barChartSubtitle = 'Total de vendas aprovadas de Segunda a Domingo';
      lineChartTitle = 'Carrinhos Aprovados vs Total (Seg – Dom)';
      lineChartSubtitle = 'Volume aprovado vs. iniciado de Segunda a Domingo';
    }

    const inPeriod = ordersList.filter((o) => {
      const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
      return shifted >= pStartShifted && shifted <= pEndShifted;
    });

    const inPrevPeriod =
      selectedPeriod === 'all'
        ? []
        : ordersList.filter((o) => {
            const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
            return shifted >= prevStartShifted && shifted <= prevEndShifted;
          });

    const approvedInPeriod = inPeriod.filter((o) => o.status === 'APPROVED');
    const approvedInPrev = inPrevPeriod.filter((o) => o.status === 'APPROVED');

    const pendingInPeriod = inPeriod.filter((o) => o.status === 'PENDING');
    const pendingInPrev = inPrevPeriod.filter((o) => o.status === 'PENDING');

    const expiredInPeriod = inPeriod.filter(
      (o) => o.status === 'EXPIRED' || o.status === 'CANCELLED' || o.status === 'DECLINED'
    );

    const revInPeriod = approvedInPeriod.reduce((s, o) => s + o.amount, 0);
    const revInPrev = approvedInPrev.reduce((s, o) => s + o.amount, 0);

    const emolaInPeriod = approvedInPeriod
      .filter((o) => o.method === 'EMOLA')
      .reduce((s, o) => s + o.amount, 0);
    const mpesaInPeriod = Math.max(0, revInPeriod - emolaInPeriod);

    const convRate =
      inPeriod.length > 0 ? Number(((approvedInPeriod.length / inPeriod.length) * 100).toFixed(1)) : 0;

    // Build Monday-to-Sunday (Seg - Dom) series
    const weekDays = [
      { dow: 1, short: 'Seg', full: 'Segunda-feira', offset: 0 },
      { dow: 2, short: 'Ter', full: 'Terça-feira', offset: 1 },
      { dow: 3, short: 'Qua', full: 'Quarta-feira', offset: 2 },
      { dow: 4, short: 'Qui', full: 'Quinta-feira', offset: 3 },
      { dow: 5, short: 'Sex', full: 'Sexta-feira', offset: 4 },
      { dow: 6, short: 'Sáb', full: 'Sábado', offset: 5 },
      { dow: 0, short: 'Dom', full: 'Domingo', offset: 6 },
    ];

    const useSpecificWeekWindow =
      selectedPeriod === 'week' || selectedPeriod === 'today' || selectedPeriod === 'yesterday';

    const sourceForWeeklyChart = useSpecificWeekWindow
      ? ordersList.filter((o) => {
          const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
          return shifted >= mondayStartShifted && shifted <= sundayEndShifted;
        })
      : inPeriod;

    const computedBarData = weekDays.map((wd) => {
      const dayShifted = mondayStartShifted + wd.offset * 86400_000;
      const dateLabel = useSpecificWeekWindow
        ? formatShiftedShortDate(dayShifted)
        : selectedPeriod === 'month'
        ? monthNames[month]
        : selectedPeriod === 'year'
        ? String(year)
        : 'Seg – Dom';

      const ordersOnDay = sourceForWeeklyChart.filter((o) => {
        const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
        return new Date(shifted).getUTCDay() === wd.dow && o.status === 'APPROVED';
      });

      return {
        day: wd.short,
        fullLabel: wd.full,
        vendas: ordersOnDay.length,
        date: dateLabel,
      };
    });

    const computedLineData = weekDays.map((wd) => {
      const dayShifted = mondayStartShifted + wd.offset * 86400_000;
      const dateLabel = useSpecificWeekWindow
        ? formatShiftedShortDate(dayShifted)
        : selectedPeriod === 'month'
        ? monthNames[month]
        : selectedPeriod === 'year'
        ? String(year)
        : 'Seg – Dom';

      const ordersOnDay = sourceForWeeklyChart.filter((o) => {
        const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
        return new Date(shifted).getUTCDay() === wd.dow;
      });
      const appOnDay = ordersOnDay.filter((o) => o.status === 'APPROVED');

      return {
        date: wd.short,
        dayName: wd.full,
        fullDate: dateLabel,
        aprovados: appOnDay.reduce((s, o) => s + o.amount, 0),
        volume: ordersOnDay.reduce((s, o) => s + o.amount, 0),
      };
    });

    // Build 24-hour series (00:00 - 23:59) in CAT
    const hours = Array.from({ length: 24 }, (_, h) =>
      h === 23 ? '23:59' : `${String(h).padStart(2, '0')}:00`
    );
    const computedHourly = hours.map((hourLabel, hIdx) => {
      const inHour = inPeriod.filter((o) => {
        const shifted = new Date(o.createdAt).getTime() + CAT_OFFSET_MS;
        return new Date(shifted).getUTCHours() === hIdx;
      });
      return {
        hour: hourLabel,
        iniciados: inHour.length,
        aprovados: inHour.filter((o) => o.status === 'APPROVED').length,
      };
    });

    const computedTransactions: Transaction[] = inPeriod.slice(0, 6).map((o) => ({
      id: o.id,
      reference: o.reference,
      amount: o.amount,
      status: o.status,
      productName: o.productName,
      date: new Date(o.createdAt).toLocaleDateString('pt-MZ', {
        timeZone: 'Africa/Maputo',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      method: o.method || 'MPESA',
    }));

    const metric: PeriodMetric = {
      salesCount: approvedInPeriod.length,
      revenue: revInPeriod,
      pendingCount: pendingInPeriod.length,
      expiredCount: expiredInPeriod.length,
      salesTrend: selectedPeriod === 'all' ? '+100.0%' : calcTrendStr(approvedInPeriod.length, approvedInPrev.length),
      revenueTrend: selectedPeriod === 'all' ? '+100.0%' : calcTrendStr(revInPeriod, revInPrev),
      pendingTrend: selectedPeriod === 'all' ? '+0.0%' : calcTrendStr(pendingInPeriod.length, pendingInPrev.length),
      vsLabel,
      expiredLabel,
      periodBadge,
      hourlyBadge,
      hourlyTitle,
      hourlySubtitle,
      barChartTitle,
      barChartSubtitle,
      lineChartTitle,
      lineChartSubtitle,
      hourlyData: computedHourly,
      barChartData: computedBarData,
      approvalsVsVolumeData: computedLineData,
      conversionRate: convRate,
      emolaTotal: emolaInPeriod,
      mpesaTotal: mpesaInPeriod,
      recentTransactions: computedTransactions,
    };

    return { metric, navigatorLabel, weekRangeStr };
  }, [ordersList, selectedPeriod, referenceDateStr, isCustomDateActive]);

  // Fallback period stats when not provided by server
  const fallbackPeriodStats: Record<PeriodKey, PeriodMetric> = {
    yesterday: {
      salesCount: 0,
      revenue: 0,
      pendingCount: 0,
      expiredCount: 0,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'vs. dia anterior',
      expiredLabel: 'ontem',
    },
    today: {
      salesCount: todaySalesCount,
      revenue: todayRevenue,
      pendingCount,
      expiredCount: lostCount,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'vs. ontem',
      expiredLabel: 'hoje',
    },
    week: {
      salesCount: weekSalesCount,
      revenue: weekRevenue,
      pendingCount,
      expiredCount: lostCount,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'vs. semana anterior',
      expiredLabel: 'na última semana',
    },
    month: {
      salesCount: monthSalesCount,
      revenue: monthRevenue,
      pendingCount,
      expiredCount: lostCount,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'vs. mês anterior',
      expiredLabel: 'no último mês',
    },
    year: {
      salesCount: approvedCount,
      revenue: totalRevenue,
      pendingCount,
      expiredCount: lostCount,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'vs. ano anterior',
      expiredLabel: 'no último ano',
    },
    all: {
      salesCount: approvedCount,
      revenue: totalRevenue,
      pendingCount,
      expiredCount: lostCount,
      salesTrend: '+0.0%',
      revenueTrend: '+0.0%',
      pendingTrend: '+0.0%',
      vsLabel: 'desde o início',
      expiredLabel: 'em todo o período',
    },
  };

  const baseStats = computedPeriodMetricOrFallback();
  function computedPeriodMetricOrFallback(): PeriodMetric {
    if (dynamicComputed.metric) {
      return dynamicComputed.metric;
    }
    return (periodStats || fallbackPeriodStats)[selectedPeriod];
  }

  const effectiveTotalRevenue = liveSummary?.totalApprovedRevenue ?? totalRevenue;
  const effectiveApprovedCount = liveSummary?.totalApprovedCount ?? approvedCount;
  const effectiveMonthRevenue = liveSummary?.monthRevenue ?? monthRevenue;

  const activeStats: PeriodMetric = isCustomDateActive || dynamicComputed.metric
    ? baseStats
    : {
        ...baseStats,
        salesCount:
          selectedPeriod === 'today'
            ? (liveSummary?.todaySalesCount ?? baseStats.salesCount)
            : selectedPeriod === 'yesterday'
            ? (liveSummary?.yesterdaySalesCount ?? baseStats.salesCount)
            : selectedPeriod === 'week'
            ? (liveSummary?.weekSalesCount ?? baseStats.salesCount)
            : selectedPeriod === 'month'
            ? (liveSummary?.monthSalesCount ?? baseStats.salesCount)
            : (effectiveApprovedCount ?? baseStats.salesCount),
        revenue:
          selectedPeriod === 'today'
            ? (liveSummary?.todayRevenue ?? baseStats.revenue)
            : selectedPeriod === 'yesterday'
            ? (liveSummary?.yesterdayRevenue ?? baseStats.revenue)
            : selectedPeriod === 'week'
            ? (liveSummary?.weekRevenue ?? baseStats.revenue)
            : selectedPeriod === 'month'
            ? (liveSummary?.monthRevenue ?? baseStats.revenue)
            : (effectiveTotalRevenue ?? baseStats.revenue),
        pendingCount:
          selectedPeriod === 'all' || selectedPeriod === 'year'
            ? (liveSummary?.pendingCount ?? baseStats.pendingCount)
            : baseStats.pendingCount,
        expiredCount:
          selectedPeriod === 'all' || selectedPeriod === 'year'
            ? (liveSummary?.expiredCount ?? baseStats.expiredCount)
            : baseStats.expiredCount,
      };

  const salesTitleMap: Record<PeriodKey, string> = {
    yesterday: 'Vendas de Ontem',
    today: isCustomDateActive ? `Vendas (${formatShiftedShortDate(Date.UTC(parseMozDateParts(referenceDateStr).year, parseMozDateParts(referenceDateStr).month, parseMozDateParts(referenceDateStr).day))})` : 'Vendas de Hoje',
    week: isCustomDateActive ? `Vendas (${dynamicComputed.weekRangeStr})` : 'Vendas na Semana',
    month: 'Vendas no Mês',
    year: 'Vendas no Ano',
    all: 'Total de Vendas',
  };

  const revenueTitleMap: Record<PeriodKey, string> = {
    yesterday: 'Faturamento de Ontem',
    today: isCustomDateActive ? `Faturamento (${formatShiftedShortDate(Date.UTC(parseMozDateParts(referenceDateStr).year, parseMozDateParts(referenceDateStr).month, parseMozDateParts(referenceDateStr).day))})` : 'Faturamento de Hoje',
    week: isCustomDateActive ? `Faturamento (${dynamicComputed.weekRangeStr})` : 'Faturamento Semanal',
    month: 'Faturamento Mensal',
    year: 'Faturamento Anual',
    all: 'Faturamento Total',
  };

  // Render individual Colored KPI Card (matching screenshot)
  const renderKpiCard = (id: string) => {
    switch (id) {
      case 'totalSales':
        return (
          <div
            key={id}
            className="otter-stat-card otter-stat-card--emerald otter-keep-colors p-5 sm:p-6 min-h-[168px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-medium text-white/95 tracking-tight">
                {salesTitleMap[selectedPeriod]}
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-[2px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
            </div>

            <div className="my-2">
              <span className="text-3xl sm:text-[32px] font-bold text-white tracking-tight leading-none">
                {activeStats.salesCount}
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span>{activeStats.salesTrend}</span>
              </div>
              <p className="text-[11px] text-white/80 font-normal">
                {activeStats.vsLabel}
              </p>
            </div>
          </div>
        );

      case 'totalRevenue':
        return (
          <div
            key={id}
            className="otter-stat-card otter-stat-card--emerald otter-keep-colors p-5 sm:p-6 min-h-[168px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-medium text-white/95 tracking-tight">
                {revenueTitleMap[selectedPeriod]}
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-[2px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m-4-3.5c1.3 1.2 3.5 1.5 5.5 1.1 2-.4 3.2-1.8 3-3.5-.2-1.6-1.5-2.6-3.7-3.1l-1.8-.4c-2-.5-3.3-1.4-3.3-3 0-1.7 1.5-3.1 3.8-3.3 2-.2 3.8.3 4.8 1.3" />
                </svg>
              </div>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-[30px] font-bold text-white tracking-tight leading-none">
                {formatMZN(activeStats.revenue)}
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span>{activeStats.revenueTrend}</span>
              </div>
              <p className="text-[11px] text-white/80 font-normal">
                {activeStats.vsLabel}
              </p>
            </div>
          </div>
        );

      case 'pendingSales':
        return (
          <Link
            key={id}
            href="/dashboard/payments?status=PENDING"
            className="otter-stat-card otter-stat-card--amber otter-keep-colors p-5 sm:p-6 min-h-[168px] flex flex-col justify-between block"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-medium text-white/95 tracking-tight">
                Vendas Pendentes
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-[2px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="my-2">
              <span className="text-3xl sm:text-[32px] font-bold text-white tracking-tight leading-none">
                {activeStats.pendingCount}
              </span>
            </div>

            <div className="space-y-0.5 pt-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                <svg className="w-3.5 h-3.5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                <span>{activeStats.pendingTrend}</span>
              </div>
              <p className="text-[11px] text-white/80 font-normal">
                aguardando pagamento
              </p>
            </div>
          </Link>
        );

      case 'expiredSales':
        return (
          <div
            key={id}
            className="otter-stat-card otter-stat-card--crimson otter-keep-colors p-5 sm:p-6 min-h-[168px] flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-medium text-white/95 tracking-tight">
                Vendas Expiradas
              </span>
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0 backdrop-blur-[2px]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
            </div>

            <div className="my-2">
              <span className="text-3xl sm:text-[32px] font-bold text-white tracking-tight leading-none">
                {activeStats.expiredCount}
              </span>
            </div>

            <div className="pt-4">
              <p className="text-[11px] text-white/80 font-normal">
                {activeStats.expiredLabel}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const animKey = `${selectedPeriod}-${referenceDateStr}`;

  // Render Master Blocks based on order
  const renderBlock = (block: DashboardBlock) => {
    if (!block.visible) return null;

    switch (block.type) {
      case 'kpis':
        const visibleKpis = kpis.filter((k) => k.visible);
        if (visibleKpis.length === 0) return null;

        const currentMilestone = getNextMilestone(effectiveTotalRevenue);
        const remainingForAward = Math.max(0, currentMilestone.target - effectiveTotalRevenue);
        const awardProgressPercent = formatProgressPercent(effectiveTotalRevenue, currentMilestone.target);

        return (
          <div key={block.id} className="space-y-4 w-full max-w-full min-w-0">
            {/* BARRA DE PERÍODO + NAVEGADOR DE SEMANA/DATA SINCRONIZADO & PRÓXIMA CONQUISTA */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 w-full max-w-full min-w-0">
              <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto max-w-full min-w-0">
                <div
                  className={`flex items-center gap-0.5 p-1 rounded-xl border w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar ${
                    isLight
                      ? 'bg-[#ECEAF6] border-[#DFDCF0]'
                      : 'bg-[#0B0911] border-[#1E1B26]'
                  }`}
                >
                  {PERIOD_OPTIONS.map((opt) => {
                    const active = selectedPeriod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(opt.id);
                          if (opt.id === 'today' || opt.id === 'yesterday') {
                            setReferenceDateStr(todayMozStr);
                          }
                        }}
                        className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                          active
                            ? 'otter-keep-colors bg-white text-[#0F172A] font-semibold shadow-sm'
                            : isLight
                              ? 'text-[#475569] hover:text-[#0F172A] font-medium'
                              : 'text-[#94A3B8] hover:text-white font-medium'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {/* Navegador de Semana / Data (Seg – Dom) */}
                <div
                  className={`flex items-center gap-1 p-1 rounded-xl border text-xs shrink-0 ${
                    isLight
                      ? 'bg-[#ECEAF6] border-[#DFDCF0] text-[#0F172A]'
                      : 'bg-[#0B0911] border-[#1E1B26] text-[#F8FAFC]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => shiftPeriodDate(-1)}
                    title="Semana / Período Anterior"
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      isLight
                        ? 'hover:bg-white text-[#475569] hover:text-[#0F172A]'
                        : 'hover:bg-[#1A1625] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    ‹
                  </button>

                  <label
                    className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] sm:text-xs font-semibold cursor-pointer transition-colors ${
                      isCustomDateActive
                        ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
                        : isLight
                        ? 'hover:bg-white text-[#0F172A]'
                        : 'hover:bg-[#1A1625] text-[#F8FAFC]'
                    }`}
                    title="Clique para escolher uma data ou semana específica"
                  >
                    <svg className="w-3.5 h-3.5 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <span className="whitespace-nowrap">{dynamicComputed.navigatorLabel}</span>
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={referenceDateStr}
                      max={todayMozStr}
                      onChange={(e) => handleDatePick(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => shiftPeriodDate(1)}
                    disabled={!isCustomDateActive && selectedPeriod !== 'yesterday'}
                    title="Próxima Semana / Período"
                    className={`px-2 py-1 rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                      isLight
                        ? 'hover:bg-white text-[#475569] hover:text-[#0F172A]'
                        : 'hover:bg-[#1A1625] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    ›
                  </button>

                  {isCustomDateActive && (
                    <button
                      type="button"
                      onClick={resetToCurrentDate}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-violet-600 text-white hover:bg-violet-500 transition-colors cursor-pointer"
                      title="Voltar para a semana/data atual"
                    >
                      Atual
                    </button>
                  )}
                </div>
              </div>

              {/* Atalho compacto da Próxima Conquista da Otterfy */}
              <Link
                href="/dashboard/awards"
                className="otter-widget-card rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full xl:w-auto max-w-full min-w-0 group"
                title="Clique para ver os marcos e placas oficiais"
              >
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                <div className="text-xs flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
                  <span className="text-[#94A3B8] font-medium truncate">
                    Próxima Conquista ({currentMilestone.level}):
                  </span>
                  <span className="font-mono font-bold text-violet-400 whitespace-nowrap">
                    Faltam {formatMZN(remainingForAward)}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                    ({awardProgressPercent})
                  </span>
                </div>
                <span className="text-xs text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                  →
                </span>
              </Link>
            </div>

            {/* OS 4 WIDGETS PRINCIPAIS COM AS CORES DO PRINT (Total de Vendas, Receita Total, Vendas Pendentes, Vendas Expiradas) */}
            <div key={`kpis-${animKey}`} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 otter-chart-animate">
              {visibleKpis.map((k) => renderKpiCard(k.id))}
            </div>
          </div>
        );

      case 'hourly': {
        const isDefaultToday = selectedPeriod === 'today' && !isCustomDateActive;
        const isDefaultYesterday = selectedPeriod === 'yesterday' && !isCustomDateActive;
        const liveHourly = isDefaultYesterday
          ? liveHourlyYesterday
          : isDefaultToday
          ? liveHourlyToday
          : null;
        const syncedHourly = liveHourly || activeStats.hourlyData || hourlyData;
        const hourlyBadge =
          activeStats.hourlyBadge || (isDefaultYesterday ? 'Ontem (24 Horas)' : 'Hoje (24 Horas)');
        return (
          <div key={block.id} className="w-full max-w-full min-w-0">
            <HourlyCartsLineChart
              data={syncedHourly}
              title={activeStats.hourlyTitle || 'Fluxo por Horário do Dia (00:00 – 23:59)'}
              subtitle={activeStats.hourlySubtitle}
              badgeLabel={hourlyBadge}
              animationKey={`hourly-${animKey}`}
            />
          </div>
        );
      }

      case 'dailyCharts': {
        const syncedBarData = activeStats.barChartData || weeklyData;
        const syncedLineData = activeStats.approvalsVsVolumeData || approvalsVsVolumeData;
        return (
          <div key={block.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-full min-w-0">
            <WeeklySalesBarChart
              data={syncedBarData}
              title={activeStats.barChartTitle || 'Vendas da Semana (Seg – Dom)'}
              subtitle={activeStats.barChartSubtitle || 'Vendas aprovadas de Segunda a Domingo'}
              badgeLabel={activeStats.periodBadge || 'Seg – Dom'}
              animationKey={`bar-${animKey}`}
            />
            <ApprovalsVsVolumeLineChart
              data={syncedLineData}
              title={activeStats.lineChartTitle || 'Carrinhos Aprovados vs Total (Seg – Dom)'}
              subtitle={activeStats.lineChartSubtitle || 'Volume de Segunda a Domingo em Meticais'}
              badgeLabel={activeStats.periodBadge || 'Seg – Dom'}
              animationKey={`line-${animKey}`}
            />
          </div>
        );
      }

      case 'conversion': {
        const syncedBarData = activeStats.barChartData || weeklyData;
        const syncedConvRate =
          activeStats.conversionRate !== undefined ? activeStats.conversionRate : conversionRate;
        const syncedEmola =
          activeStats.emolaTotal !== undefined ? activeStats.emolaTotal : emolaTotal;
        const syncedMpesa =
          activeStats.mpesaTotal !== undefined ? activeStats.mpesaTotal : mpesaTotal;
        return (
          <div key={block.id} className="w-full max-w-full min-w-0">
            <ConversionAndMethods
              conversionRate={syncedConvRate}
              emolaAmount={syncedEmola}
              mpesaAmount={syncedMpesa}
              sparklineData={syncedBarData?.map((w) => ({ val: w.vendas }))}
              periodLabel={activeStats.expiredLabel || 'nesta semana'}
              animationKey={`conv-${animKey}`}
            />
          </div>
        );
      }

      case 'transactions': {
        const syncedTransactions = activeStats.recentTransactions || recentTransactions;
        return (
          <div key={block.id} className="w-full max-w-full min-w-0">
            <CensoredTransactionsTable transactions={syncedTransactions} />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full min-w-0">

      {/* Render All Blocks In The Order Arranged By The User */}
      <div className="space-y-8">
        {blocks.map((block) => renderBlock(block))}
      </div>

      {/* Modal: Editar Dashboard (Realocar Blocos, Gráficos Primeiro, etc.) */}
      {customizingOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors animate-fadeIn ${
          isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm'
        }`}>
          <div 
            className={`rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 border transition-colors ${
              isLight
                ? 'bg-white border-[#E2E8F0] text-[#0F172A]'
                : 'bg-[#121016] border-[#1E1B26] text-[#F8FAFC]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${
              isLight ? 'border-[#E2E8F0]' : 'border-[#1E1B26]'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-500 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                    Personalizar Dashboard
                  </h3>
                  <p className={`text-xs ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                    Arraste para realocar blocos ou coloque os gráficos no topo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomizingOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer border ${
                  isLight
                    ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
                    : 'bg-[#1A1820] text-[#94A3B8] hover:text-[#F8FAFC] border-transparent'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Tabs: Ordem das Seções vs. Cards KPIs */}
            <div className={`flex items-center gap-2 p-1 rounded-xl border ${
              isLight ? 'bg-[#F8F7FC] border-[#E2E8F0]' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}>
              <button
                type="button"
                onClick={() => setActiveTab('blocks')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'blocks'
                    ? 'bg-violet-600 text-white shadow-md'
                    : isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                1. Ordem das Seções (Gráficos, KPIs, etc.)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('kpis')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'kpis'
                    ? 'bg-violet-600 text-white shadow-md'
                    : isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                2. Cards de Indicadores (KPIs)
              </button>
            </div>

            {/* TAB 1: BLOCKS REORDERING */}
            {activeTab === 'blocks' && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                <p className={`text-xs mb-2 ${isLight ? 'text-[#64748B]' : 'text-[#64748B]'}`}>
                  Dica: Se quiser ver os gráficos primeiro, arraste o <strong className={isLight ? 'text-[#0F172A]' : 'text-white'}>Gráfico 24h</strong> ou os <strong className={isLight ? 'text-[#0F172A]' : 'text-white'}>Gráficos Diários</strong> para a 1ª posição!
                </p>
                {blocks.map((b, index) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => handleBlockDragStart(e, index)}
                    onDragOver={(e) => handleBlockDragOver(e, index)}
                    onDragEnd={handleBlockDragEnd}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      draggedBlockIndex === index
                        ? isLight
                          ? 'border-violet-500 bg-violet-50 shadow-md'
                          : 'border-violet-500 bg-violet-950/20 shadow-lg'
                        : isLight
                          ? 'bg-[#F8F7FC] border-[#E2E8F0] hover:border-violet-400'
                          : 'bg-[#0F0E14] border-[#1E1B26] hover:border-[#2E283A]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span 
                        className={`cursor-grab active:cursor-grabbing p-1 ${
                          isLight ? 'text-[#94A3B8] hover:text-[#0F172A]' : 'text-[#64748B] hover:text-[#F8FAFC]'
                        }`}
                        title="Arraste para mover"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                        </svg>
                      </span>

                      <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                        #{index + 1}
                      </span>

                      <span className={`text-sm font-medium truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                        {b.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveBlockUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                          isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#64748B] hover:text-[#F8FAFC]'
                        }`}
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveBlockDown(index)}
                        disabled={index === blocks.length - 1}
                        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                          isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#64748B] hover:text-[#F8FAFC]'
                        }`}
                        title="Mover para baixo"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlock(b.id)}
                        className={`ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          b.visible
                            ? isLight
                              ? 'bg-violet-100 text-violet-800 border-violet-300'
                              : 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                            : isLight
                              ? 'bg-[#E2E8F0] text-[#64748B] border-transparent'
                              : 'bg-[#1E1B26] text-[#64748B] border-transparent'
                        }`}
                      >
                        {b.visible ? 'Visível' : 'Oculto'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: INDIVIDUAL KPIS REORDERING */}
            {activeTab === 'kpis' && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                <p className={`text-xs mb-2 ${isLight ? 'text-[#64748B]' : 'text-[#64748B]'}`}>
                  Ative, oculte ou ordene os cartões numéricos individuais:
                </p>
                {kpis.map((k, index) => (
                  <div
                    key={k.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isLight
                        ? 'bg-[#F8F7FC] border-[#E2E8F0] hover:border-violet-400'
                        : 'bg-[#0F0E14] border-[#1E1B26] hover:border-[#2E283A]'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
                        #{index + 1}
                      </span>
                      <span className={`text-sm font-medium truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                        {k.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => moveKpiUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                          isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#64748B] hover:text-[#F8FAFC]'
                        }`}
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveKpiDown(index)}
                        disabled={index === kpis.length - 1}
                        className={`p-1 rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer ${
                          isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#64748B] hover:text-[#F8FAFC]'
                        }`}
                        title="Mover para baixo"
                      >
                        ↓
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleKpi(k.id)}
                        className={`ml-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          k.visible
                            ? isLight
                              ? 'bg-violet-100 text-violet-800 border-violet-300'
                              : 'bg-violet-600/10 text-violet-400 border-violet-500/20'
                            : isLight
                              ? 'bg-[#E2E8F0] text-[#64748B] border-transparent'
                              : 'bg-[#1E1B26] text-[#64748B] border-transparent'
                        }`}
                      >
                        {k.visible ? 'Ativo' : 'Oculto'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Footer */}
            <div className={`flex items-center justify-between pt-3 border-t ${
              isLight ? 'border-[#E2E8F0]' : 'border-[#1E1B26]'
            }`}>
              <button
                type="button"
                onClick={resetAll}
                className={`text-xs font-semibold cursor-pointer ${
                  isLight ? 'text-[#64748B] hover:text-[#0F172A]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Restaurar Padrão
              </button>
              <button
                type="button"
                onClick={() => setCustomizingOpen(false)}
                className="laser-button px-5 py-2 text-sm font-semibold text-white rounded-xl cursor-pointer"
              >
                Concluir & Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Awards Modal for complete inspection */}
      <AwardsModal
        isOpen={awardsModalOpen}
        onClose={() => setAwardsModalOpen(false)}
        currentRevenue={effectiveTotalRevenue}
      />
    </div>
  );
}
