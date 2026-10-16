'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ShieldCheck,
  Search,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Star,
  Lock,
  Smartphone,
} from 'lucide-react';
import { Product } from '@/lib/db';

interface StoreConfig {
  storeName: string;
  slug: string;
  tagline: string;
  bio: string;
  accentColor: string;
  whatsappSupport: string;
  supportEmail: string;
  showVerifiedBadge: boolean;
  showSearchBar: boolean;
  showCategoryFilter: boolean;
  featuredProductIds: string[];
  hiddenProductIds: string[];
}

const DEFAULT_STORE_CONFIG: StoreConfig = {
  storeName: 'Otterfy Official Store',
  slug: 'otterfy-official',
  tagline: 'Produtos digitais, cursos e ferramentas com entrega imediata em Moçambique',
  bio: 'Pagamento 100% seguro via M-Pesa e e-Mola. Acesso enviado automaticamente por E-mail e WhatsApp logo após a confirmação.',
  accentColor: '#10b981',
  whatsappSupport: '258840000000',
  supportEmail: 'suporte@otterfy.com',
  showVerifiedBadge: true,
  showSearchBar: true,
  showCategoryFilter: true,
  featuredProductIds: [],
  hiddenProductIds: [],
};

const STORAGE_KEY = 'otterfy_storefront_config_v1';

export default function PublicStorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_STORE_CONFIG, ...JSON.parse(saved) });
      }
    } catch (e) {
      console.error(e);
    }

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setProducts(data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const visibleProducts = products
    .filter((p) => !config.hiddenProductIds.includes(p.id))
    .filter((p) => {
      if (filterMode === 'featured') {
        return config.featuredProductIds.includes(p.id);
      }
      return true;
    })
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const aFeat = config.featuredProductIds.includes(a.id) ? 1 : 0;
      const bFeat = config.featuredProductIds.includes(b.id) ? 1 : 0;
      return bFeat - aFeat;
    });

  return (
    <div className="min-h-screen bg-[#07070c] text-white flex flex-col">
      {/* Top Trust Bar */}
      <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-2 px-4 text-center text-xs text-emerald-300 font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          Ambiente 100% Seguro • Pagamento Instantâneo via M-Pesa e e-Mola • Entrega Imediata
        </span>
      </div>

      {/* Store Header */}
      <header className="border-b border-white/[0.06] bg-[#0b0b13]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-slate-950 shadow-lg"
                  style={{ backgroundColor: config.accentColor || '#10b981' }}
                >
                  <Store className="w-5 h-5" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {config.storeName}
                </h1>
                {config.showVerifiedBadge && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Loja Verificada
                  </span>
                )}
              </div>

              <p className="text-base font-medium text-slate-200">{config.tagline}</p>
              <p className="text-xs sm:text-sm text-[#8b8b9e] leading-relaxed">{config.bio}</p>
            </div>

            {config.whatsappSupport && (
              <div className="shrink-0">
                <a
                  href={`https://wa.me/${config.whatsappSupport.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Olá! Estou na vitrine ${config.storeName} e gostaria de tirar uma dúvida.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-bold text-white transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Falar com Suporte no WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Search & Filters */}
          {(config.showSearchBar || config.showCategoryFilter) && (
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {config.showSearchBar && (
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-[#8b8b9e] absolute left-3.5 top-3" />
                  <input
                    type="search"
                    aria-label="Pesquisar produtos na loja"
                    placeholder="Pesquisar produto, curso ou ferramenta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#11111a] border border-white/[0.08] text-sm text-white placeholder-[#8b8b9e] focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {config.showCategoryFilter && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterMode('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      filterMode === 'all'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-[#11111a] text-[#8b8b9e] hover:text-white border border-white/[0.06]'
                    }`}
                  >
                    Todos os Produtos ({products.filter((p) => !config.hiddenProductIds.includes(p.id)).length})
                  </button>
                  {config.featuredProductIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterMode('featured')}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        filterMode === 'featured'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-[#11111a] text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5" />
                      Em Destaque
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Catalog Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-[#11111a] border border-white/[0.06] animate-pulse p-6"
              />
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#11111a] border border-white/[0.06] rounded-2xl p-8">
            <ShoppingBag className="w-10 h-10 text-[#8b8b9e] mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white">Nenhum produto encontrado</h2>
            <p className="text-xs text-[#8b8b9e] mt-1">
              Tente ajustar os termos de pesquisa ou visualizar todos os produtos disponíveis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map((product) => {
              const isFeatured = config.featuredProductIds.includes(product.id);
              return (
                <article
                  key={product.id}
                  className={`rounded-2xl bg-[#11111a] border transition-all flex flex-col justify-between overflow-hidden group ${
                    isFeatured
                      ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                      : 'border-white/[0.07] hover:border-white/[0.15]'
                  }`}
                >
                  <div>
                    {/* Product Cover / Banner */}
                    <div className="h-44 bg-gradient-to-br from-emerald-500/20 via-[#151525] to-[#0a0a0f] relative flex items-center justify-center p-6 border-b border-white/[0.05]">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                          <Sparkles className="w-7 h-7 text-emerald-400" />
                        </div>
                      )}

                      {isFeatured && (
                        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 shadow">
                          <Star className="w-3 h-3 fill-current" />
                          Mais Vendido
                        </span>
                      )}

                      <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                        Entrega Imediata
                      </span>
                    </div>

                    {/* Product Body */}
                    <div className="p-5 space-y-2.5">
                      <h2 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {product.name}
                      </h2>
                      <p className="text-xs text-[#8b8b9e] line-clamp-3 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="p-5 pt-0 space-y-3">
                    <div className="pt-3 border-t border-white/[0.06] flex items-baseline justify-between">
                      <div>
                        <span className="text-[11px] text-[#8b8b9e] block">Valor à vista</span>
                        <span className="text-xl font-extrabold text-white">
                          {product.price.toLocaleString('pt-MZ')}{' '}
                          <span className="text-xs font-bold text-emerald-400">MT</span>
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#8b8b9e]">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        M-Pesa / e-Mola
                      </span>
                    </div>

                    <Link
                      href={`/pay/${product.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-slate-950 transition-all shadow-md hover:opacity-95"
                      style={{ backgroundColor: config.accentColor || '#10b981' }}
                    >
                      Comprar Agora
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#0a0a0f] py-8 px-4 text-xs text-[#8b8b9e]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Processado com segurança por <strong className="text-white">Otterfy Checkout Moçambique</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/terms" className="hover:text-white">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/refund" className="hover:text-white">
              Política de Reembolso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
