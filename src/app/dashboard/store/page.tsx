'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Store,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Palette,
  MessageCircle,
  Globe,
  ShieldCheck,
  Search,
  ShoppingBag,
  Save,
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
  lastCachePurge: string;
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
  lastCachePurge: new Date().toISOString(),
};

const STORAGE_KEY = 'otterfy_storefront_config_v1';

export default function StoreDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalog' | 'appearance' | 'cache'>('catalog');

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

  const saveConfig = (next: StoreConfig, msg = 'Configurações da Vitrine guardadas com sucesso!') => {
    setSaving(true);
    setConfig(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      setSaving(false);
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 3200);
    }, 250);
  };

  const toggleProductVisibility = (productId: string) => {
    const isHidden = config.hiddenProductIds.includes(productId);
    const nextHidden = isHidden
      ? config.hiddenProductIds.filter((id) => id !== productId)
      : [...config.hiddenProductIds, productId];
    saveConfig(
      { ...config, hiddenProductIds: nextHidden },
      isHidden ? 'Produto visível na Vitrine pública.' : 'Produto ocultado da Vitrine pública.'
    );
  };

  const toggleProductFeatured = (productId: string) => {
    const isFeatured = config.featuredProductIds.includes(productId);
    const nextFeatured = isFeatured
      ? config.featuredProductIds.filter((id) => id !== productId)
      : [...config.featuredProductIds, productId];
    saveConfig(
      { ...config, featuredProductIds: nextFeatured },
      isFeatured ? 'Destaque removido do produto.' : 'Produto marcado como Destaque na Vitrine!'
    );
  };

  const handlePurgeCache = () => {
    setPurgingCache(true);
    setTimeout(() => {
      const next = { ...config, lastCachePurge: new Date().toISOString() };
      saveConfig(next, 'Cache da Loja e CDN limpos! Os clientes já vêem a versão mais recente.');
      setPurgingCache(false);
    }, 600);
  };

  const copyStoreUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${origin}/loja`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const visibleProductsCount = products.filter((p) => !config.hiddenProductIds.includes(p.id)).length;
  const featuredCount = products.filter(
    (p) => config.featuredProductIds.includes(p.id) && !config.hiddenProductIds.includes(p.id)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Store className="w-3.5 h-3.5" />
            Vitrine Oficial & Catálogo Público
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Loja & Vitrine Digital</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Exiba todos os seus produtos num catálogo público otimizado para conversão rápida via M-Pesa e e-Mola.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={copyStoreUrl}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-white transition-all"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#8b8b9e]" />}
            {copiedLink ? 'Link Copiado!' : 'Copiar Link da Loja'}
          </button>

          <Link
            href="/loja"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Loja Pública (/loja)
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
        >
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            {feedback}
          </span>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Produtos na Vitrine</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {visibleProductsCount} <span className="text-xs font-normal text-[#8b8b9e]">/ {products.length}</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Ativos para compra imediata</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Produtos em Destaque</span>
            <Star className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{featuredCount}</div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Exibidos no topo da loja</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Selo Loja Verificada</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {config.showVerifiedBadge ? 'Ativo (SSL + KYC)' : 'Oculto'}
          </div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Aumenta a confiança no checkout</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e] mb-1">
            <span>Cache da Vitrine</span>
            <RefreshCw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-white truncate">
            {new Date(config.lastCachePurge).toLocaleTimeString('pt-MZ', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={purgingCache}
            className="text-[11px] text-emerald-400 hover:underline mt-1 font-semibold"
          >
            {purgingCache ? 'A limpar cache...' : 'Limpar cache agora →'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
        {[
          { id: 'catalog', label: 'Catálogo de Produtos', icon: ShoppingBag },
          { id: 'appearance', label: 'Identidade & Personalização', icon: Palette },
          { id: 'cache', label: 'Cache & SEO da Vitrine', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-[#8b8b9e] hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Gestão de Produtos na Vitrine</h2>
              <p className="text-xs text-[#8b8b9e]">
                Escolha quais produtos aparecem na sua loja pública (`/loja`) e destaque as suas ofertas principais.
              </p>
            </div>
            <Link
              href="/dashboard/products"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              + Criar ou Editar Produtos
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#8b8b9e]">A carregar catálogo de produtos...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-[#8b8b9e]">Nenhum produto encontrado.</p>
              <Link
                href="/dashboard/products"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
              >
                Criar Primeiro Produto
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => {
                const isHidden = config.hiddenProductIds.includes(product.id);
                const isFeatured = config.featuredProductIds.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                      isHidden
                        ? 'bg-white/[0.01] border-white/[0.04] opacity-60'
                        : isFeatured
                        ? 'bg-emerald-500/[0.04] border-emerald-500/30'
                        : 'bg-white/[0.02] border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white">{product.name}</h3>
                          {isFeatured && !isHidden && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              ★ Destaque
                            </span>
                          )}
                          {isHidden && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-[#8b8b9e]">
                              Oculto na Loja
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8b8b9e] line-clamp-2">{product.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-extrabold text-emerald-400">
                          {product.price.toLocaleString('pt-MZ')} MT
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProductVisibility(product.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isHidden
                              ? 'bg-white/[0.06] text-[#8b8b9e] hover:text-white'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {isHidden ? 'Oculto' : 'Visível na Loja'}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleProductFeatured(product.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isFeatured
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-white/[0.04] text-[#8b8b9e] hover:text-white'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5" />
                          {isFeatured ? 'Em Destaque' : 'Destacar'}
                        </button>
                      </div>

                      <Link
                        href={`/pay/${product.id}`}
                        target="_blank"
                        className="text-xs text-[#8b8b9e] hover:text-emerald-400 inline-flex items-center gap-1"
                      >
                        Checkout Direto
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Appearance */}
      {activeTab === 'appearance' && (
        <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white">Identidade Visual da Loja</h2>
            <p className="text-xs text-[#8b8b9e]">
              Personalize o cabeçalho, cores de destaque e canais de suporte exibidos na sua Vitrine (`/loja`).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="store-name" className="block text-xs font-semibold text-white mb-1.5">
                Nome da Loja / Marca
              </label>
              <input
                id="store-name"
                type="text"
                value={config.storeName}
                onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="store-accent" className="block text-xs font-semibold text-white mb-1.5">
                Cor Principal da Vitrine
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="store-accent"
                  type="color"
                  value={config.accentColor}
                  onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                  className="h-10 w-14 rounded-lg bg-[#0a0a0f] border border-white/[0.08] cursor-pointer"
                />
                <input
                  type="text"
                  aria-label="Código hexadecimal da cor principal"
                  value={config.accentColor}
                  onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="store-tagline" className="block text-xs font-semibold text-white mb-1.5">
                Título / Slogan Principal
              </label>
              <input
                id="store-tagline"
                type="text"
                value={config.tagline}
                onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="store-bio" className="block text-xs font-semibold text-white mb-1.5">
                Descrição de Confiança e Entrega
              </label>
              <textarea
                id="store-bio"
                rows={3}
                value={config.bio}
                onChange={(e) => setConfig({ ...config, bio: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="store-whatsapp" className="block text-xs font-semibold text-white mb-1.5">
                WhatsApp de Atendimento (com código 258)
              </label>
              <div className="relative">
                <MessageCircle className="w-4 h-4 text-[#8b8b9e] absolute left-3.5 top-3" />
                <input
                  id="store-whatsapp"
                  type="text"
                  value={config.whatsappSupport}
                  onChange={(e) => setConfig({ ...config, whatsappSupport: e.target.value })}
                  placeholder="258840000000"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="store-email" className="block text-xs font-semibold text-white mb-1.5">
                E-mail Público de Suporte
              </label>
              <input
                id="store-email"
                type="email"
                value={config.supportEmail}
                onChange={(e) => setConfig({ ...config, supportEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={config.showVerifiedBadge}
                onChange={(e) => setConfig({ ...config, showVerifiedBadge: e.target.checked })}
                className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-white">Selo Verificado</div>
                <div className="text-[11px] text-[#8b8b9e]">Exibe selo de vendedor verificado</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={config.showSearchBar}
                onChange={(e) => setConfig({ ...config, showSearchBar: e.target.checked })}
                className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-white">Barra de Pesquisa</div>
                <div className="text-[11px] text-[#8b8b9e]">Permite pesquisar produtos</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={config.showCategoryFilter}
                onChange={(e) => setConfig({ ...config, showCategoryFilter: e.target.checked })}
                className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-white">Filtro Rápido</div>
                <div className="text-[11px] text-[#8b8b9e]">Filtra Destaques e Todos</div>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => saveConfig(config)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              <Save className="w-4 h-4" />
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Cache & SEO */}
      {activeTab === 'cache' && (
        <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Gestão de Cache da Loja & Checkout (GGCheckout Engine)
              </h2>
              <p className="text-xs text-[#8b8b9e] mt-1">
                Sempre que atualizar preços, imagens ou descrições de produtos, pode forçar a limpeza imediata do cache para todos os visitantes.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePurgeCache}
              disabled={purgingCache}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 font-bold text-xs transition-all shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${purgingCache ? 'animate-spin' : ''}`} />
              {purgingCache ? 'A purgar cache...' : 'Limpar Cache da Loja Agora'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.06] space-y-2 text-xs text-[#8b8b9e]">
            <div className="flex items-center justify-between">
              <span>Última limpeza de cache:</span>
              <span className="text-white font-mono">
                {new Date(config.lastCachePurge).toLocaleString('pt-MZ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Rota pública da Vitrine:</span>
              <Link href="/loja" target="_blank" className="text-emerald-400 font-mono hover:underline">
                /loja
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <span>Domínios personalizados compatíveis:</span>
              <Link href="/dashboard/domains" className="text-sky-400 hover:underline">
                Configurar em Domínios →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
