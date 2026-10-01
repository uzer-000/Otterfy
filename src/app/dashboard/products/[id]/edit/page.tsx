'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductConfigModal, { ModalSubview } from '@/components/dashboard/ProductConfigModal';
import { formatMZN } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

type TabType = 'details' | 'config';

function EditProductContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // If query ?tab=details, start on details; otherwise default to 'config' (Step 3: Nova integração)
  const initialTab = searchParams.get('tab') === 'details' ? 'details' : 'config';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [category, setCategory] = useState('Curso Online');
  const [fullProduct, setFullProduct] = useState<any>(null);

  // Modal integration states
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [modalSubview, setModalSubview] = useState<ModalSubview>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('Configurações salvas com sucesso!');

  // Form data for Step 2: Dados do Produto
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${resolvedParams.id}`);
        if (res.ok) {
          const data = await res.json();
          setFullProduct(data);
          setFormData({
            name: data.name || '',
            description: data.description || '',
            price: data.price !== undefined ? String(data.price) : '',
            imageUrl: data.imageUrl || '',
          });
          setStatus(data.status || 'ACTIVE');
          setCategory(data.category || 'Curso Online');
        }
      } catch (err) {
        console.error('Erro ao carregar produto:', err);
      } finally {
        setFetching(false);
      }
    }
    loadProduct();
  }, [resolvedParams.id]);

  const handleOpenIntegration = (subview: ModalSubview) => {
    setModalSubview(subview);
    setIsConfigOpen(true);
  };

  const handleProductConfigSaved = (updated: any) => {
    setFullProduct(updated);
    setToastMessage('Integração salva e ativa com sucesso!');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleSaveDetails = async (e: React.FormEvent, proceedToConfig = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        status,
        category,
      };

      const res = await fetch(`/api/products/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        setFullProduct(updated);
        setToastMessage('Dados do produto atualizados!');
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);

        if (proceedToConfig) {
          setActiveTab('config');
        }
      } else {
        alert('Erro ao salvar produto.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center text-[#94A3B8] animate-fadeIn">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium">A carregar configurações do produto...</p>
      </div>
    );
  }

  const tracking = fullProduct?.tracking || {};
  const checkoutSettings = fullProduct?.checkoutSettings || {};
  const automation = fullProduct?.automation || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Toast Feedback */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-emerald-500/50 shadow-2xl text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">{toastMessage}</span>
          <button onClick={() => setSaveSuccess(false)} className="ml-2 text-[#94A3B8] hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Stepper Breadcrumbs as requested in Print 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1B26] pb-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#64748B] mb-1.5">
            <Link href="/dashboard/products/new" className="hover:text-white transition-colors">
              1. Tipo
            </Link>
            <span className="text-[#332E3F]">›</span>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'details' ? 'text-violet-400 font-bold' : 'hover:text-white'
              }`}
            >
              2. Produto
            </button>
            <span className="text-[#332E3F]">›</span>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`transition-colors cursor-pointer ${
                activeTab === 'config' ? 'text-violet-400 font-bold' : 'hover:text-white'
              }`}
            >
              3. Configurar
            </button>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              {activeTab === 'config' ? 'Nova integração' : 'Editar Produto'}
            </h1>
            <span className="text-sm font-semibold text-[#64748B]">
              {activeTab === 'config' ? '— Escolha o tipo de integração' : '— Informações gerais e valores'}
            </span>
          </div>
        </div>

        {/* Product context pill & Live checkout shortcut */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-[#121016] border border-[#1E1B26] flex items-center gap-2 text-xs">
            <span className="font-bold text-white truncate max-w-[150px]">{fullProduct?.name || 'Produto'}</span>
            <span className="text-[#64748B]">|</span>
            <span className="font-mono text-violet-400 font-semibold">{formatMZN(fullProduct?.price || 0)}</span>
          </div>

          <a
            href={`/pay/${resolvedParams.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-[#16131F] hover:bg-[#1E1B26] border border-[#2A2636] hover:border-violet-500/50 text-[#F8FAFC] font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Abrir checkout ao vivo deste produto"
          >
            <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Ver Checkout</span>
          </a>

          {/* Quick tab switcher pill */}
          <div className="flex bg-[#121016] border border-[#1E1B26] rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              2. Produto
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              3. Configurar
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: STEP 3 - NOVA INTEGRAÇÃO (EXACT MATCH FOR PRINT 2 IN OTTERFY THEME) */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
        <div className="space-y-8 animate-fadeIn">
          {/* SECTION 1: Rastreamento e conversões */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-[#F8FAFC] tracking-tight">Rastreamento e conversões</h2>
              <span className="text-xs text-[#64748B]">— Pixels, analytics e atribuição de vendas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Meta */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('meta')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.metaPixelId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Meta</span>
              </button>

              {/* TikTok */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('tiktok')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.tiktokPixelId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">TikTok</span>
              </button>

              {/* Google Analytics */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('google_analytics')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.googleAnalyticsId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Google Analytics</span>
              </button>

              {/* Google Ads */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('google_ads')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.googleAdsId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 5-6" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Google Ads</span>
              </button>

              {/* UTMify */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('utmify')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.utmifyPixelId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 mb-2.5 flex items-center justify-center border border-[#1E1B26] group-hover:border-violet-500/50 shadow-sm transition-all">
                  <img src="/logos/utmify.png" alt="Utmify" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">UTMify</span>
              </button>

              {/* Google Tag Manager */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('gtm')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {tracking.gtmId ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Google Tag Manager</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: Vendas e checkout */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-[#F8FAFC] tracking-tight">Vendas e checkout</h2>
              <span className="text-xs text-[#64748B]">— Aumente as vendas com ofertas e personalização</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Cupons de desconto */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('coupons')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {checkoutSettings.coupons && checkoutSettings.coupons.length > 0 ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                    {checkoutSettings.coupons.length} {checkoutSettings.coupons.length === 1 ? 'cupom' : 'cupons'}
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Cupons de desconto</span>
              </button>

              {/* Order bump */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('order_bump')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {checkoutSettings.orderBump?.enabled ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Order bump</span>
              </button>

              {/* Checkout personalizado (Banner, Timer de Escassez & Garantia) */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('custom_checkout')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {(checkoutSettings.customCheckout?.bannerUrl || checkoutSettings.customCheckout?.urgencyTimer !== false) ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    Personalizado
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Checkout personalizado</span>
              </button>

              {/* WhatsApp chat */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('whatsapp')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {checkoutSettings.whatsappSupport?.phone ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">WhatsApp chat</span>
              </button>
            </div>
          </div>

          {/* SECTION 3: Automação */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-[#F8FAFC] tracking-tight">Automação</h2>
              <span className="text-xs text-[#64748B]">— Conecte ferramentas externas e fluxos automáticos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Webhook */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('webhook')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {automation.webhookUrl ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Ativo ({automation.webhookEvents?.length || 1} {automation.webhookEvents?.length === 1 ? 'evento' : 'eventos'})
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Webhook</span>
              </button>

              {/* Recuperação de carrinho */}
              <button
                type="button"
                onClick={() => handleOpenIntegration('cart_recovery')}
                className="group relative p-5 rounded-2xl bg-[#121016] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[115px]"
              >
                {automation.cartRecoveryEmail !== false ? (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 text-[10px] text-[#64748B] group-hover:text-violet-400 transition-colors">
                    Configurar
                  </span>
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Recuperação de carrinho</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: STEP 2 - DADOS DO PRODUTO (NAME, PRICE, COVER, DESCRIPTION)        */}
      {/* ========================================================================= */}
      {activeTab === 'details' && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 sm:p-8 shadow-2xl animate-fadeIn">
          <form onSubmit={(e) => handleSaveDetails(e, false)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Capa do produto preview */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                  Capa do Produto
                </label>
                <div className="w-full aspect-square rounded-2xl bg-[#0F0E14] border-2 border-dashed border-[#1E1B26] overflow-hidden flex flex-col items-center justify-center relative p-3">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Preview da capa"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#64748B] block">Sem imagem de capa</span>
                    </div>
                  )}
                </div>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full mt-3 bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none transition-colors"
                  placeholder="https://exemplo.com/capa.png"
                />
              </div>

              {/* Informações detalhadas */}
              <div className="md:col-span-2 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Nome do Produto <span className="text-violet-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-[#F8FAFC] focus:outline-none text-sm font-semibold transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                      Preço em Meticais (MZN) <span className="text-violet-400">*</span>
                    </label>
                    <div className="flex rounded-xl bg-[#0F0E14] border border-[#1E1B26] focus-within:border-violet-500 overflow-hidden transition-colors">
                      <span className="px-3.5 py-2.5 bg-[#16131F] text-xs font-mono font-bold text-[#94A3B8] border-r border-[#1E1B26] flex items-center">
                        MZN
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-transparent px-3 py-2 text-[#F8FAFC] focus:outline-none font-mono font-bold text-sm"
                        placeholder="1500.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                      Categoria do Produto
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] text-xs focus:outline-none transition-colors"
                    >
                      <option value="Curso Online">Curso Online</option>
                      <option value="SoftwareSaaS">Software / SaaS</option>
                      <option value="E-book">E-book / Material Digital</option>
                      <option value="Mentoria">Mentoria / Consultoria</option>
                      <option value="Evento">Ingresso / Evento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Descrição do Produto
                  </label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-[#F8FAFC] text-xs focus:outline-none transition-colors resize-none"
                    placeholder="Descreva seu produto ou os benefícios principais da oferta..."
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs text-[#94A3B8]">Status do Produto:</span>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-[#16131F] text-[#94A3B8] border-[#1E1B26]'
                    }`}
                  >
                    {status === 'ACTIVE' ? '● Produto Ativo' : '○ Produto Inativo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions for Tab Details */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-[#1E1B26] flex-wrap">
              <Link
                href="/dashboard/products"
                className="px-5 py-2.5 bg-[#0F0E14] hover:bg-[#16131F] border border-[#1E1B26] text-[#94A3B8] hover:text-white font-semibold text-xs rounded-xl transition-colors"
              >
                ← Voltar à Lista
              </Link>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-[#2A2636] hover:border-violet-500 text-xs font-semibold text-white bg-[#16131F] hover:bg-[#1C1826] transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSaveDetails(e, true)}
                  className="laser-button px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <span>Avançar para Integrações (Passo 3)</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Integration Configuration Drawer / Modal */}
      {isConfigOpen && fullProduct && (
        <ProductConfigModal
          product={fullProduct}
          isOpen={isConfigOpen}
          initialSubview={modalSubview}
          onClose={() => {
            setIsConfigOpen(false);
            setModalSubview(null);
          }}
          onSaved={handleProductConfigSaved}
        />
      )}
    </div>
  );
}

export default function EditProductPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#94A3B8]">Carregando produto...</div>}>
      <EditProductContent {...props} />
    </Suspense>
  );
}
