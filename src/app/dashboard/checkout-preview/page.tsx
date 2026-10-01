'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import CheckoutUrgencyTimer from '@/components/checkout/CheckoutUrgencyTimer';
import { formatMZN } from '@/lib/utils';

export default function CheckoutPreviewPage() {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('prod_1');
  const [loading, setLoading] = useState(true);

  // Demo fallback product
  const defaultProduct = {
    id: 'demo',
    name: 'Formação Expert em Vendas Digitais & Tráfego',
    price: 1500,
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    description: 'Acesso completo ao método passo a passo com funis automáticos, roteiros validados de WhatsApp e estratégias para o mercado moçambicano.',
    status: 'ACTIVE',
    tracking: {
      metaPixelId: '123456789012345',
      utmifyPixelId: 'utm_px_991823',
    },
    checkoutSettings: {
      coupons: [
        { code: 'VIP15', discountPercent: 15 },
        { code: 'OTTER20', discountPercent: 20 },
      ],
      orderBump: {
        enabled: true,
        title: 'Pack de Modelos Editáveis + Resumos VIP',
        price: 250,
        description: 'Receba modelos prontos para copiar e colar diretamente no seu negócio.',
      },
      customCheckout: {
        enabled: true,
        bannerUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
        urgencyTimer: true,
        timerMinutes: 6,
        timerText: '⚡ Esta oferta especial e bônus expiram em:',
        guaranteeDays: 7,
      },
      whatsappSupport: {
        enabled: true,
        phone: '+258841234567',
        message: 'Olá! Estou com uma dúvida no checkout.',
      },
    },
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setProducts(list);
            setSelectedProductId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const activeProduct = products.find((p) => p.id === selectedProductId) || defaultProduct;

  const bannerUrl = activeProduct?.checkoutSettings?.customCheckout?.bannerUrl || defaultProduct.checkoutSettings.customCheckout.bannerUrl;
  const isUrgencyTimerEnabled = activeProduct?.checkoutSettings?.customCheckout?.urgencyTimer !== false;
  const timerMinutes = activeProduct?.checkoutSettings?.customCheckout?.timerMinutes || 6;
  const timerText = activeProduct?.checkoutSettings?.customCheckout?.timerText || '⚡ Esta oferta especial e bônus expiram em:';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fadeIn">
      {/* Top Banner Notice for API & Ready Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-950/60 via-[#16131F] to-violet-950/60 border border-violet-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 text-violet-400 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F8FAFC]">
              Aba de Exemplo do Checkout Oficial da Otterfy
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Este é o modelo final que os seus clientes visualizam. Está pronto para receber sua API e documentação de pagamentos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/pay/${activeProduct.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="laser-button px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Testar em Nova Aba</span>
          </a>
        </div>
      </div>

      {/* Controls Bar: Device View & Product Selector */}
      <div className="p-4 rounded-2xl bg-[#121016] border border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Product Picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#94A3B8] whitespace-nowrap">Produto em exibição:</span>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-[#F8FAFC] font-semibold focus:outline-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatMZN(p.price)})
              </option>
            ))}
            <option value="demo">Produto Demonstração (Completo com Bump e Banner)</option>
          </select>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-[#0F0E14] p-1 rounded-xl border border-[#1E1B26]">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === 'desktop'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
            </svg>
            <span>Desktop (2 Colunas)</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              deviceMode === 'mobile'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
            </svg>
            <span>Mobile (Smartphone)</span>
          </button>
        </div>
      </div>

      {/* Simulator Container */}
      <div className="w-full flex justify-center py-4">
        <div
          className={`transition-all duration-300 ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[420px] rounded-[40px] border-8 border-[#1A1820] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-4 bg-[#0A090E]'
              : 'w-full max-w-5xl rounded-3xl border border-[#1E1B26] p-6 sm:p-8 bg-[#0A090E] shadow-2xl'
          }`}
        >
          <div className="space-y-6">
            {/* Banner */}
            {bannerUrl && (
              <div className="w-full rounded-2xl overflow-hidden border border-[#1E1B26] shadow-xl bg-[#121016]">
                <img
                  src={bannerUrl}
                  alt="Banner do Checkout"
                  className="w-full h-auto max-h-48 object-cover"
                />
              </div>
            )}

            {/* Urgency Scarcity Timer */}
            {isUrgencyTimerEnabled && (
              <CheckoutUrgencyTimer
                productId={activeProduct.id}
                timerMinutes={timerMinutes}
                timerText={timerText}
              />
            )}

            {/* Full Unified Checkout (Holding the Product & Form) */}
            <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8]">Carregando formulário de checkout...</div>}>
              <CheckoutForm
                productId={activeProduct.id}
                productName={activeProduct.name}
                price={activeProduct.price}
                productImageUrl={activeProduct.imageUrl}
                productDescription={activeProduct.description}
                tracking={activeProduct.tracking}
                checkoutSettings={activeProduct.checkoutSettings}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
