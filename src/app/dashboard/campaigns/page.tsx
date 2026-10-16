'use client';

import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  ShoppingCart,
  Link2,
  Copy,
  Check,
  MessageCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Product, Transaction, normalizeTransactions } from '@/lib/db';

export default function CampaignsAndAbandonedCartsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [utmSource, setUtmSource] = useState('facebook');
  const [utmMedium, setUtmMedium] = useState('cpc');
  const [utmCampaign, setUtmCampaign] = useState('lancamento_mz');
  const [utmCoupon, setUtmCoupon] = useState('');
  const [copiedUtm, setCopiedUtm] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setSelectedProductId(data[0].id);
        }
      })
      .catch(console.error);

    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        setOrders(normalizeTransactions(data));
      })
      .catch(console.error);
  }, []);

  const abandonedOrders = orders.filter((o) => o.status !== 'PAID');
  const recoverableValue = abandonedOrders.reduce((acc, o) => acc + o.amount, 0);

  const buildUtmUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://otterfy.com';
    const prodId = selectedProductId || products[0]?.id || '1';
    const params = new URLSearchParams();
    if (utmSource.trim()) params.set('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.set('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.set('utm_campaign', utmCampaign.trim());
    if (utmCoupon.trim()) params.set('coupon', utmCoupon.trim().toUpperCase());
    return `${origin}/pay/${prodId}?${params.toString()}`;
  };

  const copyUtmLink = () => {
    navigator.clipboard.writeText(buildUtmUrl());
    setCopiedUtm(true);
    setTimeout(() => setCopiedUtm(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Megaphone className="w-3.5 h-3.5" />
            Recuperação de Vendas & Rastreamento UTM
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Campanhas UTM & Carrinhos Abandonados</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Recupere clientes que não confirmaram o PIN do M-Pesa/e-Mola e gere links parametrizados para Facebook Ads, TikTok Ads e Google Ads.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e]">
            <span>Pedidos Pendentes / Abandonados</span>
            <ShoppingCart className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{abandonedOrders.length}</div>
          <p className="text-[11px] text-amber-300 mt-1">Prontos para recuperação 1-clique no WhatsApp</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e]">
            <span>Receita Recuperável Estimada</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {recoverableValue.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-400">MT</span>
          </div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Pedidos não concluídos</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="flex items-center justify-between text-xs text-[#8b8b9e]">
            <span>Rastreamento UTM + Cupom</span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">100% Compatível</div>
          <p className="text-[11px] text-[#8b8b9e] mt-1">Meta Pixel, TikTok & Utmify</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Abandoned Carts Recovery Queue */}
        <div className="lg:col-span-7 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white">
            Fila de Recuperação de Carrinhos ({abandonedOrders.length})
          </h2>

          {abandonedOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#8b8b9e]">
              Excelente! Todos os pedidos recentes foram pagos e concluídos.
            </div>
          ) : (
            <div className="space-y-3">
              {abandonedOrders.slice(0, 10).map((order) => {
                const prod = products.find((p) => p.id === order.productId);
                const cleanPhone = order.customerPhone.replace(/\D/g, '');
                const waPhone = cleanPhone.startsWith('258') ? cleanPhone : `258${cleanPhone}`;
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const recoveryLink = `${origin}/pay/${order.productId}`;
                const waMsg = encodeURIComponent(
                  `Olá! Notámos que iniciou a compra de *${prod?.name || 'nosso produto'}* (${order.amount.toLocaleString('pt-MZ')} MT) via ${order.gateway}, mas o pagamento ficou pendente.\n\nConclua em segundos aqui: ${recoveryLink}`
                );

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {prod?.name || `Produto #${order.productId}`} •{' '}
                        <span className="text-emerald-400">{order.amount.toLocaleString('pt-MZ')} MT</span>
                      </div>
                      <div className="text-[11px] text-[#8b8b9e] mt-0.5">
                        Cliente: {order.customerPhone} • Gateway: {order.gateway} • Status: {order.status}
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/${waPhone}?text=${waMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Recuperar no WhatsApp
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: UTM Campaign Link Builder */}
        <div className="lg:col-span-5 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-400" />
            Gerador de Links de Campanha (UTM)
          </h2>

          <div className="space-y-3">
            <div>
              <label htmlFor="utm-prod" className="block text-xs font-semibold text-white mb-1">
                Produto da Campanha
              </label>
              <select
                id="utm-prod"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.price.toLocaleString('pt-MZ')} MT)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="utm-source" className="block text-xs font-semibold text-white mb-1">
                  utm_source (Origem)
                </label>
                <input
                  id="utm-source"
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="facebook, tiktok, ig"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white font-mono"
                />
              </div>

              <div>
                <label htmlFor="utm-medium" className="block text-xs font-semibold text-white mb-1">
                  utm_medium (Mídia)
                </label>
                <input
                  id="utm-medium"
                  type="text"
                  value={utmMedium}
                  onChange={(e) => setUtmMedium(e.target.value)}
                  placeholder="cpc, stories, bio"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="utm-campaign" className="block text-xs font-semibold text-white mb-1">
                  utm_campaign
                </label>
                <input
                  id="utm-campaign"
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white font-mono"
                />
              </div>

              <div>
                <label htmlFor="utm-coupon" className="block text-xs font-semibold text-white mb-1">
                  Cupom Embutido (?coupon=)
                </label>
                <input
                  id="utm-coupon"
                  type="text"
                  placeholder="Opcional"
                  value={utmCoupon}
                  onChange={(e) => setUtmCoupon(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white font-mono uppercase"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-[11px] font-mono text-emerald-400 break-all">
              {buildUtmUrl()}
            </div>

            <button
              type="button"
              onClick={copyUtmLink}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              {copiedUtm ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedUtm ? 'URL de Campanha Copiada!' : 'Copiar Link Rastreável UTM'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
