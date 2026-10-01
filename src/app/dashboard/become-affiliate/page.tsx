'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

interface MarketplaceProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  commissionPercent: number;
  producer: string;
  rating: number;
  description: string;
  imageUrl?: string;
  isAffiliated: boolean;
}

const MARKETPLACE_PRODUCTS: MarketplaceProduct[] = [
  {
    id: 'prod_mkt_pro',
    name: 'Curso de Marketing Digital Pro & Tráfego Pago',
    category: 'Curso Online',
    price: 1500,
    commissionPercent: 40,
    producer: 'Academia Digital MZ',
    rating: 4.9,
    description: 'Aprenda a criar campanhas patrocinadas no Facebook/Instagram e vender todos os dias usando M-Pesa.',
    isAffiliated: false,
  },
  {
    id: 'prod_ebook_vendas',
    name: 'E-book Estratégias Secretas de Vendas M-Pesa 2026',
    category: 'E-book',
    price: 500,
    commissionPercent: 50,
    producer: 'Otterfy Creator Studio',
    rating: 5.0,
    description: 'Guia prático para faturar mais de 50.000 MT por mês com infoprodutos e e-commerce.',
    isAffiliated: true,
  },
  {
    id: 'prod_saas_crm',
    name: 'SaaS Sistema de Automação de WhatsApp Otterfy',
    category: 'SaaS & Ferramentas',
    price: 3500,
    commissionPercent: 30,
    producer: 'TechMoçambique Labs',
    rating: 4.8,
    description: 'Disparador automático de cobrança e mensagens com alta taxa de entrega e split de afiliados.',
    isAffiliated: false,
  },
  {
    id: 'prod_nutri_fit',
    name: 'Manual de Nutrição & Treino em Casa Moçambique',
    category: 'E-book',
    price: 750,
    commissionPercent: 45,
    producer: 'Vida Ativa Maputo',
    rating: 4.7,
    description: 'Plano alimentar baseado em alimentos acessíveis no mercado local moçambicano.',
    isAffiliated: false,
  },
];

export default function BecomeAffiliatePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>(MARKETPLACE_PRODUCTS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODOS');

  const handleAffiliateToggle = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAffiliated: true } : p))
    );
  };

  const copyAffiliateLink = (prodId: string) => {
    const link = `http://localhost:3000/pay/${prodId}?ref=MEULINK_${prodId.slice(0, 5).toUpperCase()}`;
    navigator.clipboard.writeText(link);
    setCopiedId(prodId);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase()) || p.description.toLowerCase().includes(searchFilter.toLowerCase());
    const matchCategory = selectedCategory === 'TODOS' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.651V9.35m0 0a3.001 3.001 0 003.75-.614A2.993 2.993 0 009 9.35c.667 0 1.29-.217 1.8-.585.51.368 1.133.585 1.8.585s1.29-.217 1.8-.585a2.993 2.993 0 001.8.585c.667 0 1.29-.217 1.8-.585a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l3.19 3.19a3.003 3.003 0 01-.62 4.72" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Mercado de Afiliação</h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Escolha os melhores produtos com alta comissão e fature em Meticais promovendo na sua rede
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/affiliates"
          className="px-4 py-2.5 rounded-xl border border-[#1E1B26] hover:border-violet-500/40 text-xs font-semibold text-[#94A3B8] hover:text-white transition-all self-start sm:self-auto flex items-center gap-2"
        >
          <span>← Voltar para Minhas Comissões</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#121016] border border-[#1E1B26] p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-96 relative">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Pesquisar produto ou produtor..."
            className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-[#64748B] focus:outline-none"
          />
          <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['TODOS', 'Curso Online', 'E-book', 'SaaS & Ferramentas'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'bg-[#0F0E14] border border-[#1E1B26] text-[#94A3B8] hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredProducts.map((p) => {
          const commissionValue = (p.price * p.commissionPercent) / 100;
          return (
            <div
              key={p.id}
              className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/40 rounded-3xl p-6 transition-all duration-200 shadow-xl flex flex-col justify-between group space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/15 border border-violet-500/25 text-violet-300">
                      {p.category}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-violet-300 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-[#64748B]">Produtor: <strong className="text-[#94A3B8]">{p.producer}</strong></p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Sua Comissão:</span>
                    <span className="text-xl font-black text-emerald-400">
                      {formatMZN(commissionValue)}
                    </span>
                    <span className="text-[10px] text-[#64748B] block">({p.commissionPercent}% por venda)</span>
                  </div>
                </div>

                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#1E1B26] flex items-center justify-between gap-3">
                <span className="text-xs text-[#94A3B8]">
                  Preço final: <strong className="text-white">{formatMZN(p.price)}</strong>
                </span>

                {p.isAffiliated ? (
                  <button
                    type="button"
                    onClick={() => copyAffiliateLink(p.id)}
                    className="laser-button px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>{copiedId === p.id ? '✓ Link Copiado!' : 'Copiar Link de Afiliado'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAffiliateToggle(p.id)}
                    className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Afiliar-se Agora (1-Clique)</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
