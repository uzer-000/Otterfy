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

const DEFAULT_BLOCKS: DashboardBlock[] = [
  { id: 'kpis', label: 'Indicadores Principais (KPIs)', visible: true, type: 'kpis' },
  { id: 'hourly', label: 'Gráfico 24h: Fluxo por Horário (00:00 - 23:59)', visible: true, type: 'hourly' },
  { id: 'dailyCharts', label: 'Gráficos Diários (Vendas por Dia & Carrinhos Aprovados vs Total)', visible: true, type: 'dailyCharts' },
  { id: 'conversion', label: 'Conversão & Métodos (eMola / M-Pesa)', visible: true, type: 'conversion' },
  { id: 'transactions', label: 'Últimas Transações (6 itens)', visible: true, type: 'transactions' },
];

const DEFAULT_KPIS: KpiItem[] = [
  { id: 'today', label: 'Vendas Hoje', visible: true },
  { id: 'week', label: 'Vendas Esta Semana', visible: true },
  { id: 'month', label: 'Vendas Este Mês', visible: true },
  { id: 'ticket', label: 'Valor Médio por Compra (Ticket Médio)', visible: true },
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
  weeklyData?: { day: string; vendas: number }[];
  approvalsVsVolumeData?: { date: string; aprovados: number; volume: number }[];
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
}: CustomizableWidgetsProps) {
  const [blocks, setBlocks] = useState<DashboardBlock[]>(DEFAULT_BLOCKS);
  const [kpis, setKpis] = useState<KpiItem[]>(DEFAULT_KPIS);
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

      const savedKpis = localStorage.getItem('otterfy-dashboard-kpis-v2');
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
    localStorage.setItem('otterfy-dashboard-kpis-v2', JSON.stringify(items));
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

  // Render individual KPI Card
  const renderKpiCard = (id: string) => {
    switch (id) {
      case 'today':
        return (
          <KPICard
            key={id}
            title="Hoje"
            revenue={todayRevenue}
            salesCount={todaySalesCount}
            percentChange={0}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        );

      case 'week':
        return (
          <KPICard
            key={id}
            title="Esta Semana"
            revenue={weekRevenue}
            salesCount={weekSalesCount}
            percentChange={0}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        );

      case 'month':
        return (
          <KPICard
            key={id}
            title="Este Mês"
            revenue={monthRevenue}
            salesCount={monthSalesCount}
            percentChange={0}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        );

      case 'pending':
        return (
          <Link
            key={id}
            href="/dashboard/payments?status=PENDING"
            className="bg-[#121016] border border-[#1E1B26] hover:border-amber-500/40 transition-all rounded-2xl p-6 relative overflow-hidden group block shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[#94A3B8] text-sm font-semibold group-hover:text-[#F8FAFC] transition-colors">
                  Vendas Pendentes
                </h3>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-black text-[#F8FAFC] tracking-tight group-hover:text-amber-400 transition-colors">
                {formatMZN(pendingAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
              <span>{pendingCount} leads para recuperar</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                Recuperar <span>→</span>
              </span>
            </div>
          </Link>
        );

      case 'lost':
        return (
          <div key={id} className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#94A3B8] text-sm font-semibold">Vendas Perdidas</h3>
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-black text-[#F8FAFC] tracking-tight">
                {formatMZN(lostAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
              <span>{lostCount} pedidos recusados</span>
              <span className="text-red-400 font-semibold">Recuperável</span>
            </div>
          </div>
        );

      case 'refunds':
        return (
          <div key={id} className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#94A3B8] text-sm font-semibold">Reembolsos</h3>
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-black text-[#F8FAFC] tracking-tight">
                {formatMZN(refundsAmount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
              <span>{refundsCount} solicitações</span>
              <span className="text-emerald-400 font-semibold">0.0% estorno</span>
            </div>
          </div>
        );

      case 'ticket':
        return (
          <div key={id} className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#94A3B8] text-sm font-semibold">Valor Médio por Compra</h3>
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div className="mb-3">
              <span className="text-3xl font-black text-[#F8FAFC] tracking-tight text-violet-400">
                {formatMZN(averageTicket)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
              <span>Ticket Médio por cliente</span>
              <span className="text-[#64748B] font-semibold">Sem alteração</span>
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
          <div key={block.id} className="space-y-6 w-full">
            {/* TRÊS CAIXAS NO TOPO:
                1) TOTAL DE VENDAS APROVADAS
                2) VOLUME TOTAL (TOTAL REVENUE)
                3) PRÓXIMA CONQUISTA / MARCO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Widget 1: Total de Vendas Aprovadas */}
              <div className="bg-[#121016] border border-[#1E1B26] hover:border-emerald-500/40 transition-all rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h3 className="text-[#94A3B8] text-xs font-extrabold uppercase tracking-wider group-hover:text-[#F8FAFC] transition-colors">
                      Total de Vendas Aprovadas
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-black">
                    ✓
                  </div>
                </div>

                <div className="my-2 flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tight font-mono">
                    {approvedCount}
                  </span>
                  <span className="text-sm font-semibold text-[#94A3B8]">
                    {approvedCount === 1 ? 'venda aprovada' : 'vendas aprovadas'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-[#1E1B26] text-[#94A3B8] mt-2">
                  <span>
                    Conversão: <strong className="text-emerald-400 font-mono font-bold">{conversionRate}%</strong>
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 100% liquidação
                  </span>
                </div>
              </div>

              {/* Widget 2: Volume Total (Total Revenue) */}
              <div className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/40 transition-all rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <h3 className="text-[#94A3B8] text-xs font-extrabold uppercase tracking-wider group-hover:text-[#F8FAFC] transition-colors">
                      Volume Total (Faturamento)
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-black font-mono">
                    MT
                  </div>
                </div>

                <div className="my-2 flex items-baseline gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-mono">
                    {formatMZN(totalRevenue)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-[#1E1B26] text-[#94A3B8] mt-2">
                  <span>
                    Ticket Médio: <strong className="text-violet-400 font-mono font-bold">{formatMZN(averageTicket)}</strong>
                  </span>
                  <span className="text-[#94A3B8]">
                    {approvedCount} {approvedCount === 1 ? 'transação' : 'transações'}
                  </span>
                </div>
              </div>

              {/* Widget 3: Próxima Conquista (Faltam quanto para o próximo prêmio) */}
              <div 
                onClick={() => setAwardsModalOpen(true)}
                className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/50 transition-all rounded-2xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-between cursor-pointer group md:col-span-2 lg:col-span-1"
                title="Clique para ver os marcos e placas oficiais"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
                    <h3 className="text-[#94A3B8] text-xs font-extrabold uppercase tracking-wider group-hover:text-[#F8FAFC] transition-colors">
                      Próxima Conquista: {currentMilestone.name}
                    </h3>
                  </div>
                  <span className="text-xs text-violet-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Ver Placas <span>→</span>
                  </span>
                </div>

                <div className="my-1 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                      Faltam exatamente:
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-violet-400 font-mono tracking-tight mt-0.5">
                      {formatMZN(remainingForAward)}
                    </div>
                  </div>
                  {currentMilestone.imageSrc && (
                    <div className="w-14 h-14 rounded-xl bg-[#171420] border border-[#2A2538] flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentMilestone.imageSrc}
                        alt={currentMilestone.name}
                        className={
                          currentMilestone.imageSrc.includes('50k')
                            ? "w-full h-full object-cover p-0 scale-125"
                            : "w-full h-full object-contain p-1"
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Barra de progresso decrescente para o prêmio */}
                <div className="space-y-1.5 pt-3 border-t border-[#1E1B26] mt-2">
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>Meta: {formatMZN(currentMilestone.target)}</span>
                    <span className="text-emerald-400 font-mono font-bold">{awardProgressPercent}% concluído</span>
                  </div>
                  <div className="w-full bg-[#0F0E14] h-2 rounded-full overflow-hidden border border-[#1E1B26]">
                    <div
                      className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 h-full transition-all duration-700 rounded-full"
                      style={{ width: `${awardProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SEGUNDA LINHA: OS 4 CARDS DE KPIS INDIVIDUAIS (Hoje, Esta Semana, Este Mês, Ticket Médio) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#64748B]">
                  Desempenho por Período
                </span>
                <span className="text-[11px] text-[#64748B]">
                  {visibleKpis.length} indicadores ativos
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleKpis.map((k) => renderKpiCard(k.id))}
              </div>
            </div>
          </div>
        );

      case 'hourly':
        return (
          <div key={block.id} className="w-full">
            <HourlyCartsLineChart data={hourlyData} />
          </div>
        );

      case 'dailyCharts':
        return (
          <div key={block.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <WeeklySalesBarChart data={weeklyData} />
            <ApprovalsVsVolumeLineChart data={approvalsVsVolumeData} />
          </div>
        );

      case 'conversion':
        return (
          <div key={block.id} className="w-full">
            <ConversionAndMethods
              conversionRate={conversionRate}
              emolaAmount={emolaTotal}
              mpesaAmount={mpesaTotal}
            />
          </div>
        );

      case 'transactions':
        return (
          <div key={block.id} className="w-full">
            <CensoredTransactionsTable transactions={recentTransactions} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Top Action Bar: Customizar & Reordenar Dashboard */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#94A3B8]">
            Painel Otterfy
          </span>
        </div>

        <button
          type="button"
          onClick={() => setCustomizingOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] hover:border-violet-500/40 text-[#94A3B8] hover:text-[#F8FAFC] transition-all cursor-pointer shadow-sm"
          title="Clique para realocar blocos, colocar gráficos primeiro e escolher indicadores"
        >
          <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          <span>Editar Layout da Dashboard</span>
        </button>
      </div>

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
