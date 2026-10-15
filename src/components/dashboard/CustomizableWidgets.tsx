'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import KPICard from './KPICard';
import WeeklySalesBarChart from './WeeklySalesBarChart';
import ApprovalsVsVolumeLineChart from './ApprovalsVsVolumeLineChart';
import HourlyCartsLineChart from './HourlyCartsLineChart';
import ConversionAndMethods from './ConversionAndMethods';
import CensoredTransactionsTable from './CensoredTransactionsTable';
import AwardsModal from './AwardsModal';
import { formatMZN } from '@/lib/utils';

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
  { id: 'hourly', label: 'Gráfico 24h: Fluxo por Horário (00:00 - 23:59)', visible: true, type: 'hourly' },
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
}: CustomizableWidgetsProps) {
  const [blocks, setBlocks] = useState<DashboardBlock[]>(DEFAULT_BLOCKS);
  const [kpis, setKpis] = useState<KpiItem[]>(DEFAULT_KPIS);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('week');
  const [customizingOpen, setCustomizingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'blocks' | 'kpis'>('blocks');
  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [draggedKpiIndex, setDraggedKpiIndex] = useState<number | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);

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
      const current = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
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

  const activeStats = (periodStats || fallbackPeriodStats)[selectedPeriod];

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
                Total de Vendas
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
                Receita Total
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

  // Render Master Blocks based on order
  const renderBlock = (block: DashboardBlock) => {
    if (!block.visible) return null;

    switch (block.type) {
      case 'kpis':
        const visibleKpis = kpis.filter((k) => k.visible);
        if (visibleKpis.length === 0) return null;

        const currentMilestone = getNextMilestone(totalRevenue);
        const remainingForAward = Math.max(0, currentMilestone.target - totalRevenue);
        const awardProgressPercent = Math.min(100, Math.round((totalRevenue / currentMilestone.target) * 100));

        return (
          <div key={block.id} className="space-y-4 w-full max-w-full min-w-0">
            {/* BARRA DE PERÍODO (Ontem, Hoje, Semana, Mês, Ano, Tudo + Calendário) & PRÓXIMA CONQUISTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full min-w-0">
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
                      onClick={() => setSelectedPeriod(opt.id)}
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
                <button
                  type="button"
                  onClick={() => {
                    const idx = PERIOD_OPTIONS.findIndex((p) => p.id === selectedPeriod);
                    const next = PERIOD_OPTIONS[(idx + 1) % PERIOD_OPTIONS.length];
                    setSelectedPeriod(next.id);
                  }}
                  title="Alternar período"
                  className={`px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isLight
                      ? 'text-[#475569] hover:text-[#0F172A]'
                      : 'text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </button>
              </div>

              {/* Atalho compacto da Próxima Conquista da Otterfy */}
              <Link
                href="/dashboard/awards"
                className="otter-widget-card rounded-xl px-3.5 py-2 flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto max-w-full min-w-0 group"
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
                    ({awardProgressPercent}%)
                  </span>
                </div>
                <span className="text-xs text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                  →
                </span>
              </Link>
            </div>

            {/* OS 4 WIDGETS PRINCIPAIS COM AS CORES DO PRINT (Total de Vendas, Receita Total, Vendas Pendentes, Vendas Expiradas) */}
            <div key={`kpis-${selectedPeriod}`} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 otter-chart-animate">
              {visibleKpis.map((k) => renderKpiCard(k.id))}
            </div>
          </div>
        );

      case 'hourly': {
        const syncedHourly = activeStats.hourlyData || hourlyData;
        return (
          <div key={block.id} className="w-full max-w-full min-w-0">
            <HourlyCartsLineChart
              data={syncedHourly}
              title={activeStats.hourlyTitle || 'Fluxo por Horário (00:00 – 23:59)'}
              subtitle={activeStats.hourlySubtitle}
              badgeLabel={activeStats.periodBadge || 'Período Selecionado'}
              animationKey={selectedPeriod}
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
              title={activeStats.barChartTitle || 'Vendas no Período'}
              subtitle={activeStats.barChartSubtitle || 'Evolução das vendas aprovadas'}
              badgeLabel={activeStats.periodBadge || 'Semana Atual'}
              animationKey={selectedPeriod}
            />
            <ApprovalsVsVolumeLineChart
              data={syncedLineData}
              title={activeStats.lineChartTitle || 'Carrinhos Aprovados vs Total'}
              subtitle={activeStats.lineChartSubtitle || 'Evolução financeira em Meticais'}
              badgeLabel={activeStats.periodBadge || '7 Dias'}
              animationKey={selectedPeriod}
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
              animationKey={selectedPeriod}
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
        currentRevenue={totalRevenue}
      />
    </div>
  );
}
