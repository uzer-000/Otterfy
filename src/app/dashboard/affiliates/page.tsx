'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Percent,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  TrendingUp,
  UserCheck,
  UserPlus,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Product } from '@/lib/db';

interface AffiliatePartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  refCode: string;
  commissionPercent: number;
  salesCount: number;
  totalGeneratedMzn: number;
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
}

const DEFAULT_PARTNERS: AffiliatePartner[] = [
  {
    id: 'af-1',
    name: 'Carlos Mabunda',
    email: 'carlos.media@mz.co',
    phone: '84 910 2231',
    refCode: 'CARLOSMZ',
    commissionPercent: 40,
    salesCount: 18,
    totalGeneratedMzn: 35820,
    status: 'ACTIVE',
    joinedAt: '2025-01-15',
  },
  {
    id: 'af-2',
    name: 'Nilza Chissano',
    email: 'nilza.afiliada@gmail.com',
    phone: '86 412 8890',
    refCode: 'NILZA40',
    commissionPercent: 40,
    salesCount: 11,
    totalGeneratedMzn: 21890,
    status: 'ACTIVE',
    joinedAt: '2025-02-02',
  },
  {
    id: 'af-3',
    name: 'Edson Macuácua',
    email: 'edson.trafego@outlook.com',
    phone: '84 553 1920',
    refCode: 'EDSONADS',
    commissionPercent: 35,
    salesCount: 0,
    totalGeneratedMzn: 0,
    status: 'PENDING',
    joinedAt: '2025-02-20',
  },
];

const STORAGE_KEY = 'otterfy_producer_affiliates_v1';

export default function ProducerAffiliatesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<AffiliatePartner[]>(DEFAULT_PARTNERS);
  const [productCommissions, setProductCommissions] = useState<Record<string, number>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRefCode, setNewRefCode] = useState('');
  const [newCommission, setNewCommission] = useState(40);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
          const comms: Record<string, number> = {};
          data.forEach((p: Product) => {
            comms[p.id] = 40;
          });
          setProductCommissions(comms);
        }
      })
      .catch(console.error);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPartners(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const savePartners = (next: AffiliatePartner[], msg?: string) => {
    setPartners(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    if (msg) {
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const approvePartner = (id: string) => {
    const next = partners.map((p) => (p.id === id ? { ...p, status: 'ACTIVE' as const } : p));
    savePartners(next, 'Afiliado aprovado com sucesso! O link ?ref= já está ativo.');
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newRefCode.trim()) return;
    const created: AffiliatePartner = {
      id: `af-${Date.now()}`,
      name: newName.trim(),
      email: `${newRefCode.toLowerCase()}@afiliado.mz`,
      phone: newPhone.trim() || '84 000 0000',
      refCode: newRefCode.trim().toUpperCase().replace(/\s+/g, ''),
      commissionPercent: Number(newCommission) || 30,
      salesCount: 0,
      totalGeneratedMzn: 0,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString().slice(0, 10),
    };
    savePartners([created, ...partners], `Afiliado ${created.name} adicionado com código ?ref=${created.refCode}!`);
    setNewName('');
    setNewPhone('');
    setNewRefCode('');
  };

  const copyRefLink = (refCode: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const firstProd = products[0]?.id || '1';
    navigator.clipboard.writeText(`${origin}/pay/${firstProd}?ref=${refCode}`);
    setCopiedCode(refCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalRevenue = partners.reduce((acc, p) => acc + p.totalGeneratedMzn, 0);
  const totalSales = partners.reduce((acc, p) => acc + p.salesCount, 0);
  const activeCount = partners.filter((p) => p.status === 'ACTIVE').length;
  const pendingCount = partners.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Programa de Afiliados & Co-Produção
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gestão de Afiliados (Produtor)</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Aprove parceiros, defina comissões automáticas por produto e rastreie vendas por link de referência (`?ref=`).
          </p>
        </div>

        <Link
          href="/dashboard/become-affiliate"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-bold text-white transition-all"
        >
          <ExternalLink className="w-4 h-4 text-emerald-400" />
          Ver Marketplace de Afiliação
        </Link>
      </div>

      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Afiliados Ativos</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeCount}</div>
          <p className="text-[11px] text-emerald-400 mt-1">{pendingCount} pendente(s) de aprovação</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Vendas por Afiliados</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalSales}</div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Rastreadas via Cookie 30 dias + ?ref=</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Receita Gerada (Afiliados)</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {totalRevenue.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-400">MT</span>
          </div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Split automático M-Pesa / e-Mola</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Janela de Atribuição</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">Último Clique (30d)</div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Padrão GGCheckout Attribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Affiliates Table */}
        <div className="lg:col-span-8 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">Parceiros & Pedidos de Afiliação</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] uppercase text-[#8b8b9e]">
                  <th className="py-3 pr-4">Afiliado</th>
                  <th className="py-3 px-3">Código (?ref=)</th>
                  <th className="py-3 px-3">Comissão</th>
                  <th className="py-3 px-3">Vendas / Receita</th>
                  <th className="py-3 pl-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-white/[0.01]">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-white">{partner.name}</div>
                      <div className="text-[11px] text-[#8b8b9e]">{partner.phone}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-1 rounded bg-[#0a0a0f] border border-white/[0.08] font-mono text-emerald-400">
                        ?ref={partner.refCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-white">{partner.commissionPercent}%</td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-white">{partner.salesCount} vendas</div>
                      <div className="text-[11px] text-emerald-400">
                        {partner.totalGeneratedMzn.toLocaleString('pt-MZ')} MT
                      </div>
                    </td>
                    <td className="py-3.5 pl-3 text-right">
                      {partner.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => approvePartner(partner.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Aprovar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => copyRefLink(partner.refCode)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold"
                        >
                          {copiedCode === partner.refCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#8b8b9e]" />
                              Copiar Link
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Invite Affiliate + Product Commission Rules */}
        <div className="lg:col-span-4 space-y-6">
          <form
            onSubmit={handleAddPartner}
            className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-5 space-y-4"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Cadastrar Novo Afiliado
            </h2>

            <div>
              <label htmlFor="af-name" className="block text-xs font-semibold text-white mb-1">
                Nome do Parceiro
              </label>
              <input
                id="af-name"
                type="text"
                required
                placeholder="Ex: Marta Guebuza"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
              />
            </div>

            <div>
              <label htmlFor="af-phone" className="block text-xs font-semibold text-white mb-1">
                Número M-Pesa / e-Mola (para Split)
              </label>
              <input
                id="af-phone"
                type="text"
                placeholder="Ex: 84 123 4567"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="af-code" className="block text-xs font-semibold text-white mb-1">
                  Código (?ref=)
                </label>
                <input
                  id="af-code"
                  type="text"
                  required
                  placeholder="MARTA40"
                  value={newRefCode}
                  onChange={(e) => setNewRefCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white font-mono uppercase"
                />
              </div>
              <div>
                <label htmlFor="af-comm" className="block text-xs font-semibold text-white mb-1">
                  Comissão (%)
                </label>
                <input
                  id="af-comm"
                  type="number"
                  min={5}
                  max={90}
                  value={newCommission}
                  onChange={(e) => setNewCommission(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              Ativar Afiliado e Gerar Link
            </button>
          </form>

          {/* Commission per Product */}
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              Comissão Padrão por Produto
            </h3>
            <div className="space-y-2.5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.05] text-xs"
                >
                  <span className="text-white font-medium truncate">{prod.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      aria-label={`Comissão para ${prod.name}`}
                      min={5}
                      max={90}
                      value={productCommissions[prod.id] ?? 40}
                      onChange={(e) =>
                        setProductCommissions({
                          ...productCommissions,
                          [prod.id]: Number(e.target.value),
                        })
                      }
                      className="w-14 px-2 py-1 rounded bg-[#11111a] border border-white/[0.1] text-right text-emerald-400 font-bold"
                    />
                    <span className="text-[#8b8b9e]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
