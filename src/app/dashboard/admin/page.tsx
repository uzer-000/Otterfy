'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
type ProductApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'BLOCKED_BLACK';

interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarImage: string | null;
  isAdmin: boolean;
  approvalStatus: UserApprovalStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
  productsCount: number;
  approvedSalesCount: number;
  totalRevenueMzn: number;
  salesTodayCount: number;
  revenueTodayMzn: number;
}

interface RecentOrderSnippet {
  id: string;
  amount: number;
  status: string;
  customerName: string;
  customerPhone: string;
  method: string;
  createdAt: string;
}

interface AdminProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  moderationStatus: ProductApprovalStatus;
  moderationReason: string;
  moderatedAt: string;
  contentDeliveryType: string;
  contentUrl: string;
  materials: Array<{ name: string; type: string; url?: string }>;
  checkoutUrl: string;
  seller: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  salesTodayCount: number;
  revenueTodayMzn: number;
  pendingTodayCount: number;
  totalSalesCount: number;
  totalRevenueMzn: number;
  isSellingToday: boolean;
  lastSaleAt: string | null;
  recentOrders: RecentOrderSnippet[];
  createdAt: string;
  updatedAt: string;
}

interface AdminSummary {
  pendingUsersCount: number;
  approvedUsersCount: number;
  blockedUsersCount: number;
  totalUsersCount: number;
  pendingProductsCount: number;
  approvedProductsCount: number;
  blockedBlackProductsCount: number;
  totalProductsCount: number;
  sellingTodayProductsCount: number;
  salesTodayCount: number;
  revenueTodayMzn: number;
  totalSalesCount: number;
  totalRevenueMzn: number;
}

export default function AdminControlPage() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [products, setProducts] = useState<AdminProductItem[]>([]);

  const [activeTab, setActiveTab] = useState<'selling' | 'accounts' | 'review'>('selling');
  const [searchQuery, setSearchQuery] = useState('');
  const [sellingFilter, setSellingFilter] = useState<'ALL' | 'SELLING_TODAY' | 'NOT_SELLING' | 'BLOCKED'>('ALL');
  const [userFilter, setUserFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED'>('ALL');
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'BLOCKED_BLACK'>('ALL');

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Modal de inspeção profunda de produto
  const [inspectedProduct, setInspectedProduct] = useState<AdminProductItem | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdminData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/admin', { cache: 'no-store' });
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      setSummary(data.summary || null);
      setUsers(Array.isArray(data.users) ? data.users : []);
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch {
      // ignore transient network error
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminData(false);
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchAdminData(true);
      }
    }, 60000); // 60s interval with visibility guard to prevent database drainage
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  const handleUpdateUserStatus = async (
    user: AdminUserItem,
    nextStatus: UserApprovalStatus
  ) => {
    setActionLoadingId(`user-${user.id}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user_status',
          userId: user.id,
          email: user.email,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao atualizar conta.', 'error');
        return;
      }

      if (nextStatus === 'APPROVED') {
        showToast(`Conta de ${user.name} (${user.email}) APROVADA! Login liberado.`);
      } else if (nextStatus === 'BLOCKED' || nextStatus === 'REJECTED') {
        showToast(`Conta de ${user.name} bloqueada/recusada.`, 'warning');
      } else {
        showToast(`Conta de ${user.name} colocada em revisão.`, 'warning');
      }
      await fetchAdminData(true);
    } catch {
      showToast('Erro de conexão ao atualizar conta.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateProductStatus = async (
    product: AdminProductItem,
    nextStatus: ProductApprovalStatus,
    customReason?: string,
    customPrice?: number
  ) => {
    setActionLoadingId(`prod-${product.id}`);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_product_status',
          productId: product.id,
          moderationStatus: nextStatus,
          reason: customReason !== undefined ? customReason : product.moderationReason,
          ...(customPrice !== undefined && customPrice > 0 ? { price: customPrice } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erro ao moderar produto.', 'error');
        return;
      }

      if (nextStatus === 'APPROVED') {
        showToast(`Produto "${product.name}" APROVADO e checkout liberado!`);
      } else if (nextStatus === 'BLOCKED_BLACK') {
        showToast(
          `Produto "${product.name}" BLOQUEADO (Black)! Checkout desativado imediatamente.`,
          'warning'
        );
      } else if (nextStatus === 'REJECTED') {
        showToast(`Produto "${product.name}" rejeitado e desativado.`, 'warning');
      } else {
        showToast(`Produto "${product.name}" colocado em revisão.`, 'warning');
      }

      await fetchAdminData(true);
      if (inspectedProduct && inspectedProduct.id === product.id) {
        setInspectedProduct(null);
      }
    } catch {
      showToast('Erro ao atualizar produto.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openInspectModal = (prod: AdminProductItem) => {
    setInspectedProduct(prod);
    setEditPrice(String(prod.price));
    setEditReason(prod.moderationReason || '');
  };

  // Filtered lists
  const filteredProductsSelling = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (sellingFilter === 'SELLING_TODAY' && !p.isSellingToday) return false;
      if (sellingFilter === 'NOT_SELLING' && p.isSellingToday) return false;
      if (
        sellingFilter === 'BLOCKED' &&
        p.moderationStatus !== 'BLOCKED_BLACK' &&
        p.moderationStatus !== 'REJECTED'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.seller.name.toLowerCase().includes(q) ||
        p.seller.email.toLowerCase().includes(q)
      );
    });
  }, [products, sellingFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      if (userFilter === 'PENDING' && u.approvalStatus !== 'PENDING') return false;
      if (userFilter === 'APPROVED' && u.approvalStatus !== 'APPROVED') return false;
      if (
        userFilter === 'BLOCKED' &&
        u.approvalStatus !== 'BLOCKED' &&
        u.approvalStatus !== 'REJECTED'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    });
  }, [users, userFilter, searchQuery]);

  const filteredReviewProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      if (reviewFilter === 'PENDING' && p.moderationStatus !== 'PENDING') return false;
      if (reviewFilter === 'APPROVED' && p.moderationStatus !== 'APPROVED') return false;
      if (
        reviewFilter === 'BLOCKED_BLACK' &&
        p.moderationStatus !== 'BLOCKED_BLACK' &&
        p.moderationStatus !== 'REJECTED'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.seller.name.toLowerCase().includes(q) ||
        p.seller.email.toLowerCase().includes(q)
      );
    });
  }, [products, reviewFilter, searchQuery]);

  if (forbidden) {
    return (
      <div className="max-w-lg mx-auto my-20 p-8 rounded-3xl bg-white dark:bg-[#121016] border border-red-500/30 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-2xl font-bold">
          🔒
        </div>
        <h1 className="text-xl font-black text-slate-900 dark:text-white">
          Acesso Exclusivo do Administrador
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Esta área é restrita exclusivamente ao proprietário da plataforma Otterfy.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 text-sm font-bold transition-all ${
            toast.type === 'error'
              ? 'bg-red-950 text-red-100 border-red-500/50'
              : toast.type === 'warning'
              ? 'bg-amber-950 text-amber-100 border-amber-500/50'
              : 'bg-[#121016] text-white border-emerald-500/50'
          }`}
        >
          <span>
            {toast.type === 'error' ? '⚠️' : toast.type === 'warning' ? '🛡️' : '✓'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* HEADER DO PAINEL ADMIN                                                */}
      {/* ===================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-600/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 text-[11px] font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Controle Master • Exclusivo Admin (Pedro Hill)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Central de Comando & Moderação Otterfy
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            Aprove novas contas, monitore quais produtos estão a vender hoje em tempo real e bloqueie ofertas Black com 1 clique.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchAdminData(false)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#1A1822] hover:bg-violet-50 dark:hover:bg-[#231F2E] border border-slate-200 dark:border-[#2A2636] text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Atualizar Radar</span>
          </button>
          <Link
            href="/dashboard/products/new"
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span>+ Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* KPIS DE COMANDO                                                       */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Contas em Revisão */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('accounts');
            setUserFilter('PENDING');
          }}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] hover:border-amber-500/50 transition-all shadow-sm space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Contas em Revisão
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {summary?.pendingUsersCount ?? 0} pendente(s)
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.totalUsersCount ?? 0}{' '}
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              contas totais
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary?.approvedUsersCount ?? 0} aprovadas • {summary?.blockedUsersCount ?? 0} bloqueadas
          </p>
        </button>

        {/* Card 2: Produtos Vendendo Hoje */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('selling');
            setSellingFilter('SELLING_TODAY');
          }}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] hover:border-emerald-500/50 transition-all shadow-sm space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Produtos a Vender Hoje
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              🔥 {summary?.sellingTodayProductsCount ?? 0} em alta
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {formatMZN(summary?.revenueTodayMzn ?? 0)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary?.salesTodayCount ?? 0} venda(s) aprovada(s) hoje na plataforma
          </p>
        </button>

        {/* Card 3: Moderação de Produtos & Anti-Black */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('review');
            setReviewFilter('ALL');
          }}
          className="text-left p-5 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] hover:border-violet-500/50 transition-all shadow-sm space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Produtos & Anti-Black
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
              🚫 {summary?.blockedBlackProductsCount ?? 0} bloqueado(s)
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {summary?.approvedProductsCount ?? 0}{' '}
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              ativos de {summary?.totalProductsCount ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary?.pendingProductsCount ?? 0} aguardando revisão do Admin
          </p>
        </button>

        {/* Card 4: Volume Total da Plataforma */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Faturamento Acumulado
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30">
              Total Geral
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatMZN(summary?.totalRevenueMzn ?? 0)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {summary?.totalSalesCount ?? 0} vendas aprovadas no histórico
          </p>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BARRA DE NAVEGAÇÃO DE ABAS + BUSCA GLOBAL                             */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#1E1B26] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('selling')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'selling'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#1A1822] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#231F2E]'
            }`}
          >
            <span>📈</span>
            <span>Produtos Vendendo & Controle</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/20 text-white">
              {products.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'accounts'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#1A1822] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#231F2E]'
            }`}
          >
            <span>👤</span>
            <span>Contas Cadastradas (Revisão)</span>
            {(summary?.pendingUsersCount ?? 0) > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-black font-black">
                {summary?.pendingUsersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'review'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#1A1822] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#231F2E]'
            }`}
          >
            <span>🛡️</span>
            <span>Revisão de Produtos & Anti-Black</span>
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto, vendedor, email ou ID..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#262232] text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-violet-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
            🔍
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: RADAR DE PRODUTOS VENDENDO HOJE & CONTROLE                     */}
      {/* ===================================================================== */}
      {activeTab === 'selling' && (
        <div className="bg-white dark:bg-[#121016] rounded-2xl border border-slate-200 dark:border-[#1E1B26] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Radar de Produtos: Vendendo Hoje vs. Sem Vendas
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identifique imediatamente quais produtos estão a escalar hoje e desative ofertas Black com 1 clique se necessário.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: `Todos (${products.length})` },
                  {
                    id: 'SELLING_TODAY',
                    label: `🔥 Vendendo Hoje (${products.filter((p) => p.isSellingToday).length})`,
                  },
                  {
                    id: 'NOT_SELLING',
                    label: `💤 Sem Vendas Hoje (${products.filter((p) => !p.isSellingToday).length})`,
                  },
                  {
                    id: 'BLOCKED',
                    label: `🚫 Bloqueados / Black (${
                      products.filter(
                        (p) =>
                          p.moderationStatus === 'BLOCKED_BLACK' ||
                          p.moderationStatus === 'REJECTED'
                      ).length
                    })`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSellingFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    sellingFilter === f.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1B1824] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#252131]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              A carregar radar de produtos...
            </div>
          ) : filteredProductsSelling.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Nenhum produto encontrado para este filtro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1E1B26] bg-slate-50/80 dark:bg-[#0D0B12] text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Produto</th>
                    <th className="py-3.5 px-4">Vendedor</th>
                    <th className="py-3.5 px-4">Preço Checkout</th>
                    <th className="py-3.5 px-4">Status Hoje</th>
                    <th className="py-3.5 px-4">Vendas Hoje</th>
                    <th className="py-3.5 px-4">Acumulado Total</th>
                    <th className="py-3.5 px-4">Moderação</th>
                    <th className="py-3.5 px-4 text-right">Ações do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E1B26] text-xs sm:text-sm">
                  {filteredProductsSelling.map((prod) => {
                    const isBusy = actionLoadingId === `prod-${prod.id}`;
                    const isBlack =
                      prod.moderationStatus === 'BLOCKED_BLACK' ||
                      prod.moderationStatus === 'REJECTED';
                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-slate-50/90 dark:hover:bg-[#171420]/60 transition-colors"
                      >
                        {/* Produto */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center overflow-hidden shrink-0 font-bold text-violet-600 dark:text-violet-300 text-xs">
                              {prod.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>📦</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Link
                                  href={`/pay/${prod.id}`}
                                  target="_blank"
                                  className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                  Ver Checkout ↗
                                </Link>
                                <span className="text-[10px] font-mono text-slate-400">
                                  #{prod.id.slice(-6)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vendedor */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {prod.seller.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {prod.seller.email}
                          </p>
                        </td>

                        {/* Preço */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatMZN(prod.price)}
                        </td>

                        {/* Status de Venda Hoje */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prod.isSellingToday ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                              <span>🔥 Vendendo Hoje</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-[#1B1824] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2A2636]">
                              <span>Sem vendas hoje</span>
                            </span>
                          )}
                          {prod.pendingTodayCount > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                              ⚡ {prod.pendingTodayCount} checkout(s) iniciado(s) hoje
                            </p>
                          )}
                        </td>

                        {/* Vendas Hoje */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p
                            className={`font-extrabold ${
                              prod.salesTodayCount > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {formatMZN(prod.revenueTodayMzn)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {prod.salesTodayCount} venda(s) hoje
                          </p>
                        </td>

                        {/* Acumulado Total */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatMZN(prod.totalRevenueMzn)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {prod.totalSalesCount} venda(s) no total
                          </p>
                        </td>

                        {/* Moderação */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {prod.moderationStatus === 'APPROVED' && prod.status === 'ACTIVE' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              ✓ Aprovado (Ativo)
                            </span>
                          ) : prod.moderationStatus === 'BLOCKED_BLACK' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              🚫 Bloqueado (Black)
                            </span>
                          ) : prod.moderationStatus === 'REJECTED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              ✕ Rejeitado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              ⏳ Em Revisão
                            </span>
                          )}
                        </td>

                        {/* Ações do Admin */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openInspectModal(prod)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1B1824] hover:bg-violet-50 dark:hover:bg-[#262235] border border-slate-200 dark:border-[#2C273A] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer transition-colors"
                              title="Inspecionar detalhes, vendas e entregável"
                            >
                              🔍 Inspecionar
                            </button>

                            {isBlack || prod.status !== 'ACTIVE' ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleUpdateProductStatus(prod, 'APPROVED')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                              >
                                ✓ Aprovar / Ativar
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleUpdateProductStatus(
                                    prod,
                                    'BLOCKED_BLACK',
                                    'Bloqueado pelo Admin por violação de políticas (Produto Black).'
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                                title="Desativar imediatamente o checkout deste produto"
                              >
                                🚫 Bloquear (Black)
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: CONTAS CADASTRADAS & APROVAÇÃO DE LOGIN                        */}
      {/* ===================================================================== */}
      {activeTab === 'accounts' && (
        <div className="bg-white dark:bg-[#121016] rounded-2xl border border-slate-200 dark:border-[#1E1B26] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Contas Cadastradas & Controle de Acesso ao Login
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Todas as contas novas entram em Revisão. Elas só conseguem fazer login depois que você clicar em Aprovar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: `Todas (${users.length})` },
                  {
                    id: 'PENDING',
                    label: `⏳ Em Revisão (${users.filter((u) => u.approvalStatus === 'PENDING').length})`,
                  },
                  {
                    id: 'APPROVED',
                    label: `✓ Aprovadas (${users.filter((u) => u.approvalStatus === 'APPROVED').length})`,
                  },
                  {
                    id: 'BLOCKED',
                    label: `🚫 Bloqueadas (${
                      users.filter(
                        (u) => u.approvalStatus === 'BLOCKED' || u.approvalStatus === 'REJECTED'
                      ).length
                    })`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setUserFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    userFilter === f.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1B1824] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#252131]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              A carregar contas cadastradas...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Nenhuma conta encontrada para este filtro.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1E1B26] bg-slate-50/80 dark:bg-[#0D0B12] text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4">Utilizador / Produtor</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4">Data de Cadastro</th>
                    <th className="py-3.5 px-4">Produtos & Vendas</th>
                    <th className="py-3.5 px-4">Status de Acesso</th>
                    <th className="py-3.5 px-4 text-right">Decisão do Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1E1B26] text-xs sm:text-sm">
                  {filteredUsers.map((u) => {
                    const isBusy = actionLoadingId === `user-${u.id}`;
                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/90 dark:hover:bg-[#171420]/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center font-black text-violet-700 dark:text-violet-300 text-xs overflow-hidden shrink-0">
                              {u.avatarImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={u.avatarImage}
                                  alt={u.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>
                                  {u.name
                                    .split(' ')
                                    .map((part) => part[0])
                                    .slice(0, 2)
                                    .join('')
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {u.name}
                                </span>
                                {u.isAdmin && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-600 text-white">
                                    ADMIN MASTER
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {u.phone}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap text-xs">
                          {new Date(u.createdAt).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {u.productsCount} produto(s) • {u.approvedSalesCount} venda(s)
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Total: {formatMZN(u.totalRevenueMzn)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {u.approvalStatus === 'APPROVED' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              ✓ Aprovado (Login Ativo)
                            </span>
                          ) : u.approvalStatus === 'PENDING' ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              ⏳ Em Revisão (Aguardando Admin)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                              🚫 Bloqueado / Recusado
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {u.isAdmin ? (
                            <span className="text-xs font-bold text-slate-400">
                              Conta Principal
                            </span>
                          ) : (
                            <div className="inline-flex items-center justify-end gap-1.5">
                              {u.approvalStatus !== 'APPROVED' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateUserStatus(u, 'APPROVED')}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
                                >
                                  ✓ Aprovar Conta
                                </button>
                              )}
                              {u.approvalStatus !== 'PENDING' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateUserStatus(u, 'PENDING')}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  ⏳ Em Revisão
                                </button>
                              )}
                              {u.approvalStatus !== 'BLOCKED' && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleUpdateUserStatus(u, 'BLOCKED')}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                                >
                                  🚫 Bloquear
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: REVISÃO DE PRODUTOS SUBMETIDOS & BLOQUEIO ANTI-BLACK           */}
      {/* ===================================================================== */}
      {activeTab === 'review' && (
        <div className="bg-white dark:bg-[#121016] rounded-2xl border border-slate-200 dark:border-[#1E1B26] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                Produtos Submetidos para Revisão & Auditoria Anti-Black
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analise a oferta, descrição, entregável e checkout. Se identificar um produto Black ou fraudulento, bloqueie imediatamente.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'ALL', label: `Todos (${products.length})` },
                  {
                    id: 'PENDING',
                    label: `⏳ Em Revisão (${
                      products.filter((p) => p.moderationStatus === 'PENDING').length
                    })`,
                  },
                  {
                    id: 'APPROVED',
                    label: `✓ Aprovados (${
                      products.filter((p) => p.moderationStatus === 'APPROVED').length
                    })`,
                  },
                  {
                    id: 'BLOCKED_BLACK',
                    label: `🚫 Bloqueados / Black (${
                      products.filter(
                        (p) =>
                          p.moderationStatus === 'BLOCKED_BLACK' ||
                          p.moderationStatus === 'REJECTED'
                      ).length
                    })`,
                  },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setReviewFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reviewFilter === f.id
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-[#1B1824] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#252131]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReviewProducts.map((prod) => {
              const isBusy = actionLoadingId === `prod-${prod.id}`;
              return (
                <div
                  key={prod.id}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#242031] flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm">
                          {prod.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>📦</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Por <strong>{prod.seller.name}</strong> ({prod.seller.email})
                          </p>
                        </div>
                      </div>

                      <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatMZN(prod.price)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {prod.description || 'Sem descrição detalhada informada pelo produtor.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#16131F] border border-slate-200 dark:border-[#262235] text-slate-700 dark:text-slate-300 font-semibold">
                        Vendas Hoje: <strong>{prod.salesTodayCount}</strong> ({formatMZN(prod.revenueTodayMzn)})
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#16131F] border border-slate-200 dark:border-[#262235] text-slate-700 dark:text-slate-300 font-semibold">
                        Total: <strong>{prod.totalSalesCount}</strong> ({formatMZN(prod.totalRevenueMzn)})
                      </span>
                      <Link
                        href={`/pay/${prod.id}`}
                        target="_blank"
                        className="px-2.5 py-1 rounded-lg bg-violet-600/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold hover:underline"
                      >
                        Abrir Checkout ↗
                      </Link>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-[#221E2E] flex flex-wrap items-center justify-between gap-2">
                    <div>
                      {prod.moderationStatus === 'APPROVED' && prod.status === 'ACTIVE' ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ✓ Produto Aprovado & Ativo
                        </span>
                      ) : prod.moderationStatus === 'BLOCKED_BLACK' ? (
                        <span className="text-xs font-bold text-red-600 dark:text-red-400">
                          🚫 Bloqueado (Oferta Black)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          ⏳ Em Revisão / Pausado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openInspectModal(prod)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#191622] border border-slate-200 dark:border-[#2C273A] text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Detalhes
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUpdateProductStatus(prod, 'APPROVED')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        ✓ Aprovar
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleUpdateProductStatus(
                            prod,
                            'BLOCKED_BLACK',
                            'Produto bloqueado pelo Admin (Oferta Black).'
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        🚫 Bloquear Black
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL DE INSPEÇÃO E CONTROLE TOTAL DO PRODUTO                         */}
      {/* ===================================================================== */}
      {inspectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-[#121016] border border-slate-200 dark:border-[#242031] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl text-slate-900 dark:text-white">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#221E2E]">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  Inspeção do Administrador
                </span>
                <h3 className="text-xl font-black mt-0.5">{inspectedProduct.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vendedor: <strong>{inspectedProduct.seller.name}</strong> ({inspectedProduct.seller.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedProduct(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1B1824] text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#221E2E]">
                <span className="text-[11px] text-slate-500 block">Vendas Hoje</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatMZN(inspectedProduct.revenueTodayMzn)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {inspectedProduct.salesTodayCount} aprovada(s) hoje
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#221E2E]">
                <span className="text-[11px] text-slate-500 block">Faturamento Total</span>
                <span className="text-lg font-black">
                  {formatMZN(inspectedProduct.totalRevenueMzn)}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {inspectedProduct.totalSalesCount} venda(s) totais
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#221E2E]">
                <span className="text-[11px] text-slate-500 block">Link Público</span>
                <Link
                  href={`/pay/${inspectedProduct.id}`}
                  target="_blank"
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline block mt-1"
                >
                  /pay/{inspectedProduct.id} ↗
                </Link>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Status DB: {inspectedProduct.status}
                </span>
              </div>
            </div>

            {/* Ajuste rápido de preço ou motivo de moderação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Preço do Produto (MZN)
                </label>
                <input
                  type="number"
                  min={1}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#262235] text-sm font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Nota / Motivo da Moderação
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Ex: Produto Black / Violação de termos"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#262235] text-sm"
                />
              </div>
            </div>

            {/* Últimos pedidos deste produto */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Últimas Transações deste Produto
              </h4>
              {inspectedProduct.recentOrders.length === 0 ? (
                <p className="text-xs text-slate-500 py-3">
                  Nenhuma transação registada neste produto ainda.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {inspectedProduct.recentOrders.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0D0B12] border border-slate-200 dark:border-[#221E2E] text-xs"
                    >
                      <div>
                        <span className="font-bold">{o.customerName}</span>{' '}
                        <span className="text-slate-500 font-mono">({o.customerPhone})</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold">{formatMZN(o.amount)}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'APPROVED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-[#221E2E] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInspectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1B1824] text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateProductStatus(
                      inspectedProduct,
                      'PENDING',
                      editReason,
                      Number(editPrice) || inspectedProduct.price
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold cursor-pointer"
                >
                  ⏳ Colocar em Revisão
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateProductStatus(
                      inspectedProduct,
                      'BLOCKED_BLACK',
                      editReason || 'Produto Black bloqueado pelo Admin.',
                      Number(editPrice) || inspectedProduct.price
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                >
                  🚫 Bloquear Produto Black
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateProductStatus(
                      inspectedProduct,
                      'APPROVED',
                      editReason,
                      Number(editPrice) || inspectedProduct.price
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  ✓ Salvar & Aprovar Produto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
