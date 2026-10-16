'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatMZN } from '@/lib/utils';

interface CouponEntry {
  id: string;
  code: string;
  discountPercent: number;
  discountType?: 'PERCENT' | 'FIXED';
  fixedAmount?: number;
  active: boolean;
  productId: string;
  productName: string;
  maxUses?: number;
  usedCount?: number;
  expiresAt?: string;
}

export default function CouponsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('15');
  const [targetProductId, setTargetProductId] = useState('ALL');
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const list = await res.json();
        setProducts(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      console.error('Erro ao carregar produtos para cupons:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Flatten all coupons across all products
  const allCoupons = useMemo<CouponEntry[]>(() => {
    const list: CouponEntry[] = [];
    for (const p of products) {
      const coupons = p.checkoutSettings?.coupons || [];
      for (const c of coupons) {
        list.push({
          id: `${p.id}::${c.code}`,
          code: c.code,
          discountPercent: Number(c.discountPercent) || 0,
          discountType: c.discountType || 'PERCENT',
          fixedAmount: Number(c.fixedAmount) || 0,
          active: c.active !== false,
          productId: p.id,
          productName: p.name,
          maxUses: c.maxUses || 100,
          usedCount: c.usedCount || 0,
          expiresAt: c.expiresAt || '',
        });
      }
    }
    return list;
  }, [products]);

  const filteredCoupons = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return allCoupons;
    return allCoupons.filter(
      (c) => c.code.toLowerCase().includes(q) || c.productName.toLowerCase().includes(q)
    );
  }, [allCoupons, searchFilter]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const numVal = Number(discountValue);
    if (!cleanCode || isNaN(numVal) || numVal <= 0) return;

    const targetProducts =
      targetProductId === 'ALL'
        ? products
        : products.filter((p) => p.id === targetProductId);

    if (targetProducts.length === 0) {
      showToast('Crie pelo menos um produto antes de adicionar um cupom.');
      return;
    }

    setSaving(true);
    try {
      for (const prod of targetProducts) {
        const existingCoupons = prod.checkoutSettings?.coupons || [];
        const filtered = existingCoupons.filter((c: any) => c.code !== cleanCode);
        const pct =
          discountType === 'PERCENT'
            ? Math.min(95, Math.max(1, numVal))
            : prod.price > 0
            ? Math.min(95, Math.max(1, Math.round((numVal / prod.price) * 100)))
            : 10;

        const newCouponObj = {
          code: cleanCode,
          discountPercent: pct,
          discountType,
          fixedAmount: discountType === 'FIXED' ? numVal : 0,
          active: true,
          maxUses: Number(maxUses) || 100,
          usedCount: 0,
          expiresAt: expiresAt || '',
        };

        const updatedSettings = {
          ...(prod.checkoutSettings || {}),
          coupons: [newCouponObj, ...filtered],
        };

        await fetch(`/api/products/${prod.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutSettings: updatedSettings }),
        });
      }

      await fetchProducts();
      setModalOpen(false);
      setCode('');
      setDiscountValue('15');
      showToast(`Cupom ${cleanCode} criado e sincronizado com o checkout!`);
    } catch (err) {
      console.error('Erro ao salvar cupom:', err);
      showToast('Erro ao salvar cupom.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCoupon = async (entry: CouponEntry) => {
    const prod = products.find((p) => p.id === entry.productId);
    if (!prod) return;

    const updatedCoupons = (prod.checkoutSettings?.coupons || []).map((c: any) =>
      c.code === entry.code ? { ...c, active: !entry.active } : c
    );

    await fetch(`/api/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutSettings: {
          ...(prod.checkoutSettings || {}),
          coupons: updatedCoupons,
        },
      }),
    });

    await fetchProducts();
    showToast(`Cupom ${entry.code} ${!entry.active ? 'ativado' : 'desativado'}!`);
  };

  const handleDeleteCoupon = async (entry: CouponEntry) => {
    const prod = products.find((p) => p.id === entry.productId);
    if (!prod) return;

    const updatedCoupons = (prod.checkoutSettings?.coupons || []).filter(
      (c: any) => c.code !== entry.code
    );

    await fetch(`/api/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutSettings: {
          ...(prod.checkoutSettings || {}),
          coupons: updatedCoupons,
        },
      }),
    });

    await fetchProducts();
    showToast(`Cupom ${entry.code} removido de ${entry.productName}.`);
  };

  const copyCheckoutWithCoupon = (entry: CouponEntry) => {
    const url = `${window.location.origin}/pay/${entry.productId}?coupon=${encodeURIComponent(entry.code)}`;
    navigator.clipboard.writeText(url);
    showToast(`Link com cupom ${entry.code} copiado!`);
  };

  const activeCouponsCount = allCoupons.filter((c) => c.active).length;

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-16 animate-fadeIn">
      {toast && (
        <div
          role="status"
          className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} aria-label="Fechar notificação" className="ml-2 text-[#94A3B8] hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.85}>
              <circle cx="12" cy="12" r="9" />
              <path d="m15 9-6 6" />
              <path d="M9 9h.01" />
              <path d="M15 15h.01" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              Cupons de Desconto
            </h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Crie códigos promocionais com desconto percentual ou fixo em Meticais sincronizados em tempo real com o checkout
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="laser-button px-5 py-2.5 rounded-xl text-xs font-bold text-white cursor-pointer self-start sm:self-auto"
        >
          + Criar Novo Cupom
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Cupons Ativos no Checkout
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{activeCouponsCount}</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">De {allCoupons.length} configurados</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Produtos com Cupom Habilitado
          </span>
          <p className="text-2xl font-black text-violet-400 mt-2 font-mono">
            {new Set(allCoupons.map((c) => c.productId)).size}
          </p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">De {products.length} produtos cadastrados</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Aplicação Automática via URL
          </span>
          <p className="text-lg font-black text-[#F8FAFC] mt-2 font-mono">?coupon=CODIGO</p>
          <span className="text-[11px] text-[#94A3B8] mt-1 block">Suportado em todos os links de checkout</span>
        </div>
      </div>

      {/* Filter & Table */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 px-6 border-b border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F0E14]">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Lista de Cupons Promocionais</h2>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar por código ou produto..."
            className="w-full sm:w-72 bg-[#121016] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3.5 py-1.5 text-xs text-[#F8FAFC] focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-[#94A3B8]">A carregar cupons...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center font-bold">
              %
            </div>
            <p className="text-sm font-bold text-[#F8FAFC]">Nenhum cupom cadastrado</p>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
              Crie cupons como <code className="text-violet-300">BEMVINDO10</code> ou <code className="text-violet-300">OFERTA20</code> para aumentar a conversão no checkout.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="laser-button px-5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer"
            >
              Criar Primeiro Cupom
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F0E14] text-[#94A3B8] border-b border-[#1E1B26] uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3.5 px-6">Código</th>
                  <th className="py-3.5 px-6">Desconto</th>
                  <th className="py-3.5 px-6">Produto Vinculado</th>
                  <th className="py-3.5 px-6">Validade / Limite</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
                {filteredCoupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1A1820]/50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-lg bg-violet-600/15 border border-violet-500/30 text-violet-300 font-mono font-bold">
                        {c.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-400">
                      {c.discountType === 'FIXED' && c.fixedAmount
                        ? `${formatMZN(c.fixedAmount)} (${c.discountPercent}%)`
                        : `${c.discountPercent}% OFF`}
                    </td>
                    <td className="py-4 px-6 font-medium text-[#F8FAFC]">{c.productName}</td>
                    <td className="py-4 px-6 text-[#94A3B8]">
                      {c.expiresAt ? `Expira em ${c.expiresAt}` : 'Sem data limite'} • Máx. {c.maxUses || 100} usos
                    </td>
                    <td className="py-4 px-6">
                      <button
                        type="button"
                        onClick={() => handleToggleCoupon(c)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                          c.active
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-[#1E1B26] border-transparent text-[#94A3B8]'
                        }`}
                      >
                        {c.active ? '● Ativo' : '○ Inativo'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => copyCheckoutWithCoupon(c)}
                        className="px-3 py-1.5 rounded-xl bg-[#0F0E14] hover:bg-[#1A1820] border border-[#1E1B26] text-[#F8FAFC] font-semibold cursor-pointer"
                      >
                        Copiar Link c/ Cupom
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(c)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 font-semibold cursor-pointer"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-md p-6 space-y-5 text-[#F8FAFC] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <div>
                <h3 className="text-base font-bold">Criar Cupom de Desconto</h3>
                <p className="text-xs text-[#94A3B8]">Funciona imediatamente na página de checkout</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar janela"
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Código do Cupom *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex: BEMVINDO15"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] font-mono uppercase focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Desconto</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2.5 text-[#F8FAFC]"
                  >
                    <option value="PERCENT">Percentual (%)</option>
                    <option value="FIXED">Valor Fixo (MT)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    Valor ({discountType === 'PERCENT' ? '%' : 'MT'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={discountType === 'PERCENT' ? '95' : '100000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2.5 text-[#F8FAFC] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Aplicar ao Produto</label>
                <select
                  value={targetProductId}
                  onChange={(e) => setTargetProductId(e.target.value)}
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3 py-2.5 text-[#F8FAFC]"
                >
                  <option value="ALL">Todos os Produtos ({products.length})</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatMZN(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Limite de Usos</label>
                  <input
                    type="number"
                    min="1"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2 text-[#F8FAFC] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Data de Expiração</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] rounded-xl px-3.5 py-2 text-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1E1B26]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E1B26] text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="laser-button px-5 py-2 rounded-xl font-bold text-white cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'A guardar...' : 'Salvar Cupom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
