'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';
import HourlyCartsLineChart from '@/components/dashboard/HourlyCartsLineChart';
import WeeklySalesBarChart from '@/components/dashboard/WeeklySalesBarChart';
import ApprovalsVsVolumeLineChart from '@/components/dashboard/ApprovalsVsVolumeLineChart';

type PeriodOption = 'today' | '7d' | '30d' | 'month' | 'all';
type MetricTab = 'overview' | 'abandoned' | 'gateways' | 'salesHistory';

interface OrderItem {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'REFUNDED' | 'CHARGEBACK' | 'CANCELLED';
  createdAt: string;
  product?: {
    name: string;
    price: number;
  };
  transaction?: {
    id: string;
    method?: 'MPESA' | 'EMOLA' | null;
    status: string;
  } | null;
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<PeriodOption>('today');
  const [activeTab, setActiveTab] = useState<MetricTab>('overview');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load orders
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/payments');
        if (res.ok) {
          const json = await res.json();
          setOrders(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dados de métricas:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter orders by selected period
  const filteredByPeriodOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (period === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return orderDate >= startOfToday;
      }
      if (period === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      if (period === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }
      if (period === 'month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, period]);

  // Aggregated calculations based on period
  const approvedOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.status === 'APPROVED'), [filteredByPeriodOrders]);
  const pendingOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.status === 'PENDING'), [filteredByPeriodOrders]);
  const lostOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.status === 'DECLINED' || o.status === 'CANCELLED'), [filteredByPeriodOrders]);
  const refundOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.status === 'REFUNDED'), [filteredByPeriodOrders]);

  const approvedRevenue = useMemo(() => approvedOrders.reduce((sum, o) => sum + o.amount, 0), [approvedOrders]);
  const pendingAmount = useMemo(() => pendingOrders.reduce((sum, o) => sum + o.amount, 0), [pendingOrders]);
  const lostAmount = useMemo(() => lostOrders.reduce((sum, o) => sum + o.amount, 0), [lostOrders]);
  const refundsAmount = useMemo(() => refundOrders.reduce((sum, o) => sum + o.amount, 0), [refundOrders]);

  const totalTransactionsCount = filteredByPeriodOrders.length;
  const conversionRate = totalTransactionsCount > 0 ? ((approvedOrders.length / totalTransactionsCount) * 100).toFixed(1) : '0';

  // Gateway stats
  const mpesaOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.transaction?.method === 'MPESA'), [filteredByPeriodOrders]);
  const emolaOrders = useMemo(() => filteredByPeriodOrders.filter((o) => o.transaction?.method === 'EMOLA'), [filteredByPeriodOrders]);

  const mpesaApproved = useMemo(() => mpesaOrders.filter((o) => o.status === 'APPROVED'), [mpesaOrders]);
  const emolaApproved = useMemo(() => emolaOrders.filter((o) => o.status === 'APPROVED'), [emolaOrders]);

  const mpesaRevenue = useMemo(() => mpesaApproved.reduce((sum, o) => sum + o.amount, 0), [mpesaApproved]);
  const emolaRevenue = useMemo(() => emolaApproved.reduce((sum, o) => sum + o.amount, 0), [emolaApproved]);

  const mpesaConvRate = mpesaOrders.length > 0 ? ((mpesaApproved.length / mpesaOrders.length) * 100).toFixed(1) : '0';
  const emolaConvRate = emolaOrders.length > 0 ? ((emolaApproved.length / emolaOrders.length) * 100).toFixed(1) : '0';

  const hourlyData = useMemo(() => {
    const hours = [
      '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00', '23:59'
    ];

    return hours.map((hour, index) => {
      const ordersInHour = filteredByPeriodOrders.filter((o) => {
        const h = new Date(o.createdAt).getHours();
        return h === index;
      });
      return {
        hour,
        iniciados: ordersInHour.length,
        aprovados: ordersInHour.filter((o) => o.status === 'APPROVED').length,
      };
    });
  }, [filteredByPeriodOrders]);

  // Abandoned carts recovery handler
  const handleRecoverWhatsApp = (order: OrderItem) => {
    const rawPhone = order.customerPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('258') ? rawPhone : `258${rawPhone}`;
    const prodName = order.product?.name || 'seu produto';
    const checkoutUrl = `${window.location.origin}/pay/${order.productId}`;
    const text = encodeURIComponent(
      `Olá, ${order.customerName}! Notamos que iniciou o pedido do "${prodName}" na Otterfy mas não concluiu. Pode finalizar seu pagamento com segurança através do link: ${checkoutUrl}. Precisa de ajuda com M-Pesa ou e-Mola?`
    );
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`, '_blank');
  };

  const handleCopyCheckout = (productId: string) => {
    const url = `${window.location.origin}/pay/${productId}`;
    navigator.clipboard.writeText(url);
    showToast('Link do produto copiado para a área de transferência!');
  };

  // Sales history filter
  const salesHistoryList = useMemo(() => {
    return filteredByPeriodOrders.filter((o) => {
      const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const matchGateway = gatewayFilter === 'ALL' || o.transaction?.method === gatewayFilter;
      const matchSearch =
        searchTerm === '' ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm) ||
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.product?.name && o.product.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchStatus && matchGateway && matchSearch;
    });
  }, [filteredByPeriodOrders, statusFilter, gatewayFilter, searchTerm]);

  const periodLabels: Record<PeriodOption, string> = {
    today: 'Hoje (24 Horas)',
    '7d': 'Últimos 7 Dias',
    '30d': 'Últimos 30 Dias',
    month: 'Este Mês',
    all: 'Todo o Período',
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-ping" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header: Title, Description & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Métricas & Relatórios</h1>
              <p className="text-[#94A3B8] text-sm mt-0.5">Análise aprofundada de tráfego, conversões, gateways e carrinhos</p>
            </div>
          </div>
        </div>

        {/* Period Selector Buttons */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#121016] border border-[#1E1B26] self-start md:self-auto overflow-x-auto">
          {(['today', '7d', '30d', 'month', 'all'] as PeriodOption[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                period === p
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A1820]'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1E1B26] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-violet-600/15 border border-violet-500/30 text-violet-300'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121016]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-13.5 18v-2.25z" />
          </svg>
          <span>Visão Geral & Gráficos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('abandoned')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'abandoned'
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121016]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>Carrinhos Abandonados</span>
          {pendingOrders.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateways')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'gateways'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121016]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <span>Performance por Gateway</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('salesHistory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'salesHistory'
              ? 'bg-violet-600/15 border border-violet-500/30 text-violet-300'
              : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121016]'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span>Histórico de Vendas</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: VISÃO GERAL & GRÁFICO 24H COM WIDGETS POR BAIXO         */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Quick Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
              <span className="text-xs font-semibold text-[#94A3B8]">Faturamento Aprovado ({periodLabels[period]})</span>
              <p className="text-3xl font-black text-[#F8FAFC] mt-2 font-mono tracking-tight text-emerald-400">
                {formatMZN(approvedRevenue)}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#94A3B8] border-t border-[#1E1B26] pt-3">
                <span className="text-emerald-400 font-bold">{approvedOrders.length} vendas concluídas</span>
                <span>• {periodLabels[period]}</span>
              </div>
            </div>

            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
              <span className="text-xs font-semibold text-[#94A3B8]">Taxa de Conversão Global</span>
              <p className="text-3xl font-black text-violet-400 mt-2 font-mono tracking-tight">
                {conversionRate}%
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#94A3B8] border-t border-[#1E1B26] pt-3">
                <span>{approvedOrders.length} aprovadas de {totalTransactionsCount} iniciadas</span>
              </div>
            </div>

            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
              <span className="text-xs font-semibold text-[#94A3B8]">Ticket Médio ({periodLabels[period]})</span>
              <p className="text-3xl font-black text-[#F8FAFC] mt-2 font-mono tracking-tight">
                {formatMZN(approvedOrders.length > 0 ? Math.round(approvedRevenue / approvedOrders.length) : 0)}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-[#94A3B8] border-t border-[#1E1B26] pt-3">
                <span>Média por pedido aprovado</span>
              </div>
            </div>
          </div>

          {/* O GRÁFICO DE 24 HORAS COM AS LINHAS DE HOJE E DETALHES */}
          <div className="w-full">
            <HourlyCartsLineChart
              data={hourlyData}
              title={`Fluxo por Horário (${periodLabels[period]})`}
              badgeLabel={periodLabels[period]}
            />
          </div>

          {/* OS WIDGETS COLOCADOS EXATAMENTE POR BAIXO DO GRÁFICO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">
                Resumo de Transações do Gráfico ({periodLabels[period]})
              </h3>
              <span className="text-[11px] text-[#64748B]">Atualização em tempo real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 1. Vendas Pendentes */}
              <div 
                onClick={() => setActiveTab('abandoned')}
                className="bg-[#121016] border border-[#1E1B26] hover:border-amber-500/40 transition-all rounded-2xl p-6 relative overflow-hidden group cursor-pointer shadow-sm"
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
                  <span>{pendingOrders.length} leads para recuperar</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    Ver na aba <span>→</span>
                  </span>
                </div>
              </div>

              {/* 2. Vendas Perdidas */}
              <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#94A3B8] text-sm font-semibold">Vendas Perdidas</h3>
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-3xl font-black text-[#F8FAFC] tracking-tight text-red-400">
                    {formatMZN(lostAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
                  <span>{lostOrders.length} pedidos recusados</span>
                  <span className="text-red-400 font-semibold">Recuperável</span>
                </div>
              </div>

              {/* 3. Reembolsos */}
              <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
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
                  <span>{refundOrders.length} solicitações</span>
                  <span className="text-emerald-400 font-semibold">0.0% estorno</span>
                </div>
              </div>

              {/* 4. Total de Transações */}
              <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#94A3B8] text-sm font-semibold">Total de Transações</h3>
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-3xl font-black text-[#F8FAFC] tracking-tight">
                    {totalTransactionsCount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-[#1E1B26]/80 text-[#94A3B8]">
                  <span>{approvedOrders.length} aprovadas</span>
                  <span className="text-violet-400 font-semibold">{conversionRate}% conv.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Diários Complementares */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            <WeeklySalesBarChart />
            <ApprovalsVsVolumeLineChart />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CARRINHOS ABANDONADOS                                    */}
      {/* ============================================================== */}
      {activeTab === 'abandoned' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Cards for Abandoned Carts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6">
              <span className="text-xs font-semibold text-[#94A3B8]">Total de Carrinhos Abandonados</span>
              <p className="text-3xl font-black text-amber-400 mt-2 font-mono">
                {pendingOrders.length}
              </p>
              <p className="text-xs text-[#64748B] mt-2">Leads que inseriram telefone e pararam no pagamento</p>
            </div>

            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6">
              <span className="text-xs font-semibold text-[#94A3B8]">Potencial Recuperável</span>
              <p className="text-3xl font-black text-[#F8FAFC] mt-2 font-mono">
                {formatMZN(pendingAmount)}
              </p>
              <p className="text-xs text-[#64748B] mt-2">Valor bruto pendente de confirmação</p>
            </div>

            <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6">
              <span className="text-xs font-semibold text-[#94A3B8]">Taxa de Abandono</span>
              <p className="text-3xl font-black text-violet-400 mt-2 font-mono">
                {totalTransactionsCount > 0 ? ((pendingOrders.length / totalTransactionsCount) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-[#64748B] mt-2">Do total de {totalTransactionsCount} checkouts iniciados</p>
            </div>
          </div>

          {/* List of Abandoned Carts */}
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#F8FAFC]">Leads para Recuperação de Vendas</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Clique no botão do WhatsApp para enviar uma mensagem personalizada de fechamento
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold self-start sm:self-auto">
                {pendingOrders.length} carrinhos pendentes
              </span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-16 text-center text-[#94A3B8] space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-3">
                  ✓
                </div>
                <p className="font-bold text-[#F8FAFC]">Nenhum carrinho abandonado no período selecionado</p>
                <p className="text-xs text-[#64748B]">Todos os checkouts iniciados foram concluídos ou não há pendências.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F0E14] text-[#94A3B8] border-b border-[#1E1B26] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Cliente / Contato</th>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Método Pretendido</th>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4 text-right">Ação Direta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
                    {pendingOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#1A1820]/60 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-[#F8FAFC]">{order.customerName}</div>
                          <div className="text-[11px] text-violet-400 font-mono mt-0.5 flex items-center gap-1">
                            <svg className="w-3 h-3 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{order.customerPhone}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-[#F8FAFC]">{order.product?.name || 'Produto Otterfy'}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">ID: {order.id}</div>
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-amber-400">
                          {formatMZN(order.amount)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            order.transaction?.method === 'EMOLA'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {order.transaction?.method || 'M-Pesa'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-[#94A3B8]">
                          {new Date(order.createdAt).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleRecoverWhatsApp(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-sm"
                            title="Abrir WhatsApp para recuperação direta com mensagem pré-formatada"
                          >
                            <span>WhatsApp</span>
                            <span>→</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCheckout(order.productId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-[#0F0E14] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                            title="Copiar link do checkout deste produto"
                          >
                            Copiar Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: PERFORMANCE POR GATEWAY                                  */}
      {/* ============================================================== */}
      {activeTab === 'gateways' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Dual Gateway Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MPESA CARD */}
            <div className="bg-[#121016] border border-red-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center font-black text-red-400">
                    M
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">M-Pesa (Vodacom)</h3>
                    <p className="text-xs text-[#94A3B8]">Carteira Móvel Moçambique (+258 84 / 85)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Operacional
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
                <div>
                  <span className="text-[11px] text-[#94A3B8] block">Faturamento Aprovado</span>
                  <span className="text-2xl font-black text-[#F8FAFC] font-mono">{formatMZN(mpesaRevenue)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94A3B8] block">Vendas Aprovadas</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{mpesaApproved.length}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#94A3B8]">
                <div className="flex justify-between py-1 border-b border-[#1E1B26]">
                  <span>Total de Tentativas:</span>
                  <span className="font-bold text-[#F8FAFC]">{mpesaOrders.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1E1B26]">
                  <span>Taxa de Conversão:</span>
                  <span className="font-bold text-violet-400">{mpesaConvRate}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tempo Médio de Confirmação:</span>
                  <span className="font-bold text-emerald-400">~ 2.1s via USSD Push</span>
                </div>
              </div>
            </div>

            {/* EMOLA CARD */}
            <div className="bg-[#121016] border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600/15 border border-orange-500/30 flex items-center justify-center font-black text-orange-400">
                    E
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#F8FAFC]">e-Mola (Movitel)</h3>
                    <p className="text-xs text-[#94A3B8]">Carteira Móvel Moçambique (+258 86 / 87)</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Operacional
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 p-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
                <div>
                  <span className="text-[11px] text-[#94A3B8] block">Faturamento Aprovado</span>
                  <span className="text-2xl font-black text-[#F8FAFC] font-mono">{formatMZN(emolaRevenue)}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#94A3B8] block">Vendas Aprovadas</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">{emolaApproved.length}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#94A3B8]">
                <div className="flex justify-between py-1 border-b border-[#1E1B26]">
                  <span>Total de Tentativas:</span>
                  <span className="font-bold text-[#F8FAFC]">{emolaOrders.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1E1B26]">
                  <span>Taxa de Conversão:</span>
                  <span className="font-bold text-violet-400">{emolaConvRate}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tempo Médio de Confirmação:</span>
                  <span className="font-bold text-emerald-400">~ 1.8s via USSD Push</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Breakdown Table */}
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#F8FAFC]">Comparativo Detalhado de Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F0E14] text-[#94A3B8] border-b border-[#1E1B26] uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Gateway</th>
                    <th className="py-3 px-4">Operadora</th>
                    <th className="py-3 px-4">Moeda</th>
                    <th className="py-3 px-4">Total Pedidos</th>
                    <th className="py-3 px-4">Aprovados</th>
                    <th className="py-3 px-4">Conversão</th>
                    <th className="py-3 px-4 text-right">Volume Aprovado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
                  <tr className="hover:bg-[#1A1820]/60">
                    <td className="py-4 px-4 font-bold text-red-400">MPESA</td>
                    <td className="py-4 px-4 text-[#94A3B8]">Vodacom Moçambique</td>
                    <td className="py-4 px-4"><span className="px-2 py-0.5 rounded bg-violet-600/10 text-violet-400 font-mono text-[10px] font-bold">MZN</span></td>
                    <td className="py-4 px-4 font-mono">{mpesaOrders.length}</td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">{mpesaApproved.length}</td>
                    <td className="py-4 px-4 font-mono text-violet-400 font-bold">{mpesaConvRate}%</td>
                    <td className="py-4 px-4 text-right font-mono font-black text-emerald-400">{formatMZN(mpesaRevenue)}</td>
                  </tr>
                  <tr className="hover:bg-[#1A1820]/60">
                    <td className="py-4 px-4 font-bold text-orange-400">EMOLA</td>
                    <td className="py-4 px-4 text-[#94A3B8]">Movitel Moçambique</td>
                    <td className="py-4 px-4"><span className="px-2 py-0.5 rounded bg-violet-600/10 text-violet-400 font-mono text-[10px] font-bold">MZN</span></td>
                    <td className="py-4 px-4 font-mono">{emolaOrders.length}</td>
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400">{emolaApproved.length}</td>
                    <td className="py-4 px-4 font-mono text-violet-400 font-bold">{emolaConvRate}%</td>
                    <td className="py-4 px-4 text-right font-mono font-black text-emerald-400">{formatMZN(emolaRevenue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: HISTÓRICO DE VENDAS                                      */}
      {/* ============================================================== */}
      {activeTab === 'salesHistory' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121016] border border-[#1E1B26] p-4 rounded-2xl">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, tel ou ID..."
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] text-[#F8FAFC] text-xs font-medium rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-[#7C3AED]"
                />
                <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#0F0E14] border border-[#1E1B26] text-[#F8FAFC] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">Todos os Status</option>
                <option value="APPROVED">Aprovado</option>
                <option value="PENDING">Pendente</option>
                <option value="DECLINED">Recusado</option>
                <option value="REFUNDED">Reembolsado</option>
              </select>

              {/* Gateway Filter */}
              <select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value)}
                className="bg-[#0F0E14] border border-[#1E1B26] text-[#F8FAFC] text-xs font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-[#7C3AED]"
              >
                <option value="ALL">Todos os Gateways</option>
                <option value="MPESA">M-Pesa</option>
                <option value="EMOLA">e-Mola</option>
              </select>
            </div>

            <div className="text-xs text-[#94A3B8]">
              Mostrando <span className="font-bold text-[#F8FAFC]">{salesHistoryList.length}</span> transações
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
            {salesHistoryList.length === 0 ? (
              <div className="p-16 text-center text-[#94A3B8]">
                Nenhuma transação encontrada com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F0E14] text-[#94A3B8] border-b border-[#1E1B26] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">ID Transação</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Produto</th>
                      <th className="py-3 px-4">Método</th>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
                    {salesHistoryList.map((o) => (
                      <tr key={o.id} className="hover:bg-[#1A1820]/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-violet-400 font-bold">
                          {o.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#F8FAFC]">{o.customerName}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{o.customerPhone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#94A3B8]">
                          {o.product?.name || 'Produto Otterfy'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            o.transaction?.method === 'EMOLA'
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {o.transaction?.method || 'M-Pesa'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[#94A3B8]">
                          {new Date(o.createdAt).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            o.status === 'APPROVED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : o.status === 'PENDING'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : o.status === 'REFUNDED'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            {o.status === 'APPROVED' ? 'Aprovado' : o.status === 'PENDING' ? 'Pendente' : o.status === 'REFUNDED' ? 'Reembolsado' : 'Recusado'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-[#F8FAFC]">
                          {formatMZN(o.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
