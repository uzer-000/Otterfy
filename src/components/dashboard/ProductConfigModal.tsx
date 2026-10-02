'use client';

import React, { useState, useEffect } from 'react';
import ImageDropzone from '@/components/ui/ImageDropzone';
import { ZENOFY_PRICE_TIERS } from '@/lib/zenofyPrices';

export interface ProductConfigData {
  id: string;
  name: string;
  tracking?: {
    metaPixelId?: string;
    metaApiToken?: string;
    tiktokPixelId?: string;
    tiktokAccessToken?: string;
    googleAnalyticsId?: string;
    googleAdsId?: string;
    googleAdsLabel?: string;
    utmifyPixelId?: string;
    utmifyToken?: string;
    gtmId?: string;
  };
  checkoutSettings?: {
    coupons?: Array<{ code: string; discountPercent: number }>;
    orderBump?: {
      enabled: boolean;
      title: string;
      price: number;
      description?: string;
    };
    customCheckout?: {
      enabled?: boolean;
      themeColor?: string;
      guaranteeDays?: number;
      urgencyTimer?: boolean;
      timerMinutes?: number;
      timerText?: string;
      bannerUrl?: string;
      zenofyProductId?: string;
    };
    whatsappSupport?: {
      enabled: boolean;
      phone: string;
      message?: string;
    };
  };
  automation?: {
    webhookUrl?: string;
    webhookEvents?: string[];
    cartRecoveryEmail?: boolean;
    cartRecoveryWhatsapp?: boolean;
  };
}

interface Props {
  product: ProductConfigData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: ProductConfigData) => void;
  initialSubview?: ModalSubview;
}

export type ModalSubview = 
  | null
  | 'meta'
  | 'tiktok'
  | 'google_analytics'
  | 'google_ads'
  | 'utmify'
  | 'gtm'
  | 'coupons'
  | 'order_bump'
  | 'custom_checkout'
  | 'whatsapp'
  | 'webhook'
  | 'cart_recovery';

export default function ProductConfigModal({ product, isOpen, onClose, onSaved, initialSubview = null }: Props) {
  const [activeItem, setActiveItem] = useState<ModalSubview>(initialSubview);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubview !== undefined) {
      setActiveItem(initialSubview);
    }
  }, [initialSubview, isOpen]);

  // Form states initialized from product
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaApiToken, setMetaApiToken] = useState('');
  const [tiktokPixelId, setTiktokPixelId] = useState('');
  const [tiktokAccessToken, setTiktokAccessToken] = useState('');
  const [gaId, setGaId] = useState('');
  const [gAdsId, setGAdsId] = useState('');
  const [gAdsLabel, setGAdsLabel] = useState('');
  const [utmifyPixelId, setUtmifyPixelId] = useState('');
  const [utmifyToken, setUtmifyToken] = useState('');
  const [gtmId, setGtmId] = useState('');

  // Checkout settings
  const [coupons, setCoupons] = useState<Array<{ code: string; discountPercent: number }>>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');

  const [orderBumpEnabled, setOrderBumpEnabled] = useState(false);
  const [orderBumpTitle, setOrderBumpTitle] = useState('');
  const [orderBumpPrice, setOrderBumpPrice] = useState('99');
  const [orderBumpDesc, setOrderBumpDesc] = useState('');

  const [customGuarantee, setCustomGuarantee] = useState(7);
  const [customTimer, setCustomTimer] = useState(true);
  const [customBannerUrl, setCustomBannerUrl] = useState('');
  const [timerMinutes, setTimerMinutes] = useState(6);
  const [timerText, setTimerText] = useState('Esta oferta especial termina em:');
  const [zenofyProductId, setZenofyProductId] = useState('');

  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappMsg, setWhatsappMsg] = useState('Olá! Preciso de ajuda com o pedido.');

  // Automation
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['order.approved']);
  const [recoveryEmail, setRecoveryEmail] = useState(true);
  const [recoveryWhatsapp, setRecoveryWhatsapp] = useState(true);

  useEffect(() => {
    if (product) {
      setMetaPixelId(product.tracking?.metaPixelId || '');
      setMetaApiToken(product.tracking?.metaApiToken || '');
      setTiktokPixelId(product.tracking?.tiktokPixelId || '');
      setTiktokAccessToken(product.tracking?.tiktokAccessToken || '');
      setGaId(product.tracking?.googleAnalyticsId || '');
      setGAdsId(product.tracking?.googleAdsId || '');
      setGAdsLabel(product.tracking?.googleAdsLabel || '');
      setUtmifyPixelId(product.tracking?.utmifyPixelId || '');
      setUtmifyToken(product.tracking?.utmifyToken || '');
      setGtmId(product.tracking?.gtmId || '');

      setCoupons(product.checkoutSettings?.coupons || []);
      setOrderBumpEnabled(product.checkoutSettings?.orderBump?.enabled || false);
      setOrderBumpTitle(product.checkoutSettings?.orderBump?.title || 'Acesso VIP Vitalício + Comunidade');
      setOrderBumpPrice(String(product.checkoutSettings?.orderBump?.price || 99));
      setOrderBumpDesc(product.checkoutSettings?.orderBump?.description || 'Adicione acesso VIP exclusivo por uma fração do valor.');

      setCustomGuarantee(product.checkoutSettings?.customCheckout?.guaranteeDays || 7);
      setCustomTimer(product.checkoutSettings?.customCheckout?.urgencyTimer ?? true);
      setCustomBannerUrl(product.checkoutSettings?.customCheckout?.bannerUrl || '');
      setTimerMinutes(product.checkoutSettings?.customCheckout?.timerMinutes || 6);
      setTimerText(product.checkoutSettings?.customCheckout?.timerText || 'Esta oferta especial termina em:');
      setZenofyProductId(product.checkoutSettings?.customCheckout?.zenofyProductId || '');

      setWhatsappPhone(product.checkoutSettings?.whatsappSupport?.phone || '');
      setWhatsappMsg(product.checkoutSettings?.whatsappSupport?.message || 'Olá! Preciso de ajuda com o pedido.');

      setWebhookUrl(product.automation?.webhookUrl || '');
      setWebhookEvents(product.automation?.webhookEvents || ['order.approved']);
      setRecoveryEmail(product.automation?.cartRecoveryEmail ?? true);
      setRecoveryWhatsapp(product.automation?.cartRecoveryWhatsapp ?? true);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveSubitem = async () => {
    setSaving(true);
    try {
      const payload = {
        tracking: {
          metaPixelId,
          metaApiToken,
          tiktokPixelId,
          tiktokAccessToken,
          googleAnalyticsId: gaId,
          googleAdsId: gAdsId,
          googleAdsLabel: gAdsLabel,
          utmifyPixelId,
          utmifyToken,
          gtmId,
        },
        checkoutSettings: {
          coupons,
          orderBump: {
            enabled: orderBumpEnabled,
            title: orderBumpTitle,
            price: parseFloat(orderBumpPrice) || 0,
            description: orderBumpDesc,
          },
          customCheckout: {
            enabled: true,
            guaranteeDays: customGuarantee,
            urgencyTimer: customTimer,
            timerMinutes: Number(timerMinutes) || 6,
            timerText: timerText || 'Esta oferta especial termina em:',
            bannerUrl: customBannerUrl || '',
            zenofyProductId: zenofyProductId || undefined,
          },
          whatsappSupport: {
            enabled: !!whatsappPhone,
            phone: whatsappPhone,
            message: whatsappMsg,
          },
        },
        automation: {
          webhookUrl,
          webhookEvents,
          cartRecoveryEmail: recoveryEmail,
          cartRecoveryWhatsapp: recoveryWhatsapp,
        },
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        showToastMsg('Configurações salvas com sucesso!');
        if (onSaved) onSaved(updated);
        setActiveItem(null);
      } else {
        alert('Erro ao salvar configurações.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const addCoupon = () => {
    if (!newCouponCode) return;
    const discount = parseFloat(newCouponDiscount) || 10;
    setCoupons([...coupons, { code: newCouponCode.trim().toUpperCase(), discountPercent: discount }]);
    setNewCouponCode('');
  };

  const removeCoupon = (index: number) => {
    setCoupons(coupons.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header with Stepper breadcrumbs as shown in Print 2 */}
        <div className="p-5 sm:p-6 border-b border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0F0E14]">
          <div>
            <div className="flex items-center gap-3 text-xs font-semibold text-[#64748B] mb-1.5">
              <span>1. Tipo</span>
              <span className="text-[#332E3F]">›</span>
              <span>2. Produto</span>
              <span className="text-[#332E3F]">›</span>
              <span className="text-violet-400 font-bold">3. Configurar</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Configurações de {product.name}
            </h2>
            <span className="text-xs font-mono text-[#94A3B8]">ID: #{product.id}</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {toast && (
              <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-fadeIn">
                ✓ {toast}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1A1820] hover:bg-[#231F2E] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
              title="Fechar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Body with Print 2 sections in Otterfy Theme Lines */}
        <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1 bg-[#121016]">
          {/* SECTION 1: Rastreamento e conversões */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Rastreamento e conversões</h3>
              <p className="text-xs text-[#94A3B8]">Pixels, analytics e atribuição de vendas</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Meta */}
              <button
                type="button"
                onClick={() => setActiveItem('meta')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {metaPixelId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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
                onClick={() => setActiveItem('tiktok')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {tiktokPixelId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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
                onClick={() => setActiveItem('google_analytics')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {gaId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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
                onClick={() => setActiveItem('google_ads')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {gAdsId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12l3 3 5-6" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Google Ads</span>
              </button>

              {/* Utmify */}
              <button
                type="button"
                onClick={() => setActiveItem('utmify')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {utmifyPixelId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 mb-2.5 flex items-center justify-center border border-[#1E1B26] group-hover:border-violet-500/50 shadow-sm transition-all">
                  <img src="/logos/utmify.png" alt="Utmify" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Utmify</span>
              </button>

              {/* Google Tag Manager */}
              <button
                type="button"
                onClick={() => setActiveItem('gtm')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {gtmId && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Vendas e checkout</h3>
              <p className="text-xs text-[#94A3B8]">Aumente as vendas com ofertas e personalização</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Cupons de desconto */}
              <button
                type="button"
                onClick={() => setActiveItem('coupons')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {coupons.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                    {coupons.length}
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
                onClick={() => setActiveItem('order_bump')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {orderBumpEnabled && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Order bump</span>
              </button>

              {/* Checkout personalizado */}
              <button
                type="button"
                onClick={() => setActiveItem('custom_checkout')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
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
                onClick={() => setActiveItem('whatsapp')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {whatsappPhone && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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
            <div>
              <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Automação</h3>
              <p className="text-xs text-[#94A3B8]">Ligue a sistemas externos</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Webhook */}
              <button
                type="button"
                onClick={() => setActiveItem('webhook')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {webhookUrl && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                )}
                <div className="text-[#94A3B8] group-hover:text-violet-400 transition-colors mb-2.5">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-[#F8FAFC] group-hover:text-violet-300">Webhook</span>
              </button>

              {/* Recuperação de carrinho por e-mail */}
              <button
                type="button"
                onClick={() => setActiveItem('cart_recovery')}
                className="group relative p-5 rounded-2xl bg-[#0F0E14] hover:bg-[#181522] border border-[#1E1B26] hover:border-violet-500/50 hover:shadow-[0_0_15px_rgba(124,58,237,0.12)] transition-all flex flex-col items-center justify-center text-center cursor-pointer min-h-[110px]"
              >
                {recoveryEmail && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
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

        {/* Modal Footer in Otterfy Theme Lines */}
        <div className="p-4 sm:p-5 border-t border-[#1E1B26] bg-[#0F0E14] flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">
            As alterações são salvas diretamente no banco e aplicadas instantaneamente no checkout deste produto.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="laser-button px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer shadow-md"
          >
            Concluir
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL / DRAWER FOR SELECTED CONFIGURATION IN OTTERFY LINES            */}
      {/* ========================================================================= */}
      {activeItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <div className="flex items-center gap-2.5">
                {activeItem === 'utmify' && (
                  <div className="w-6 h-6 rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <img src="/logos/utmify.png" alt="Utmify" className="w-full h-full object-cover" />
                  </div>
                )}
                <h4 className="text-base font-bold text-[#F8FAFC]">
                {activeItem === 'meta' && 'Configurar Meta Pixel & CAPI'}
                {activeItem === 'tiktok' && 'Configurar TikTok Pixel'}
                {activeItem === 'google_analytics' && 'Configurar Google Analytics 4'}
                {activeItem === 'google_ads' && 'Configurar Google Ads'}
                {activeItem === 'utmify' && 'Configurar Utmify'}
                {activeItem === 'gtm' && 'Configurar Google Tag Manager'}
                {activeItem === 'coupons' && 'Cupons de Desconto'}
                {activeItem === 'order_bump' && 'Configurar Order Bump'}
                {activeItem === 'custom_checkout' && 'Personalizar Checkout'}
                {activeItem === 'whatsapp' && 'Suporte via WhatsApp'}
                {activeItem === 'webhook' && 'Webhook para este Produto'}
                {activeItem === 'cart_recovery' && 'Recuperação de Carrinho'}
              </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="text-[#64748B] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Inputs based on active subitem */}
            {activeItem === 'meta' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">ID do Pixel Meta</label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="Ex: 123456789012345"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                  <p className="text-[11px] text-[#64748B] mt-1">Dispara PageView, InitiateCheckout e Purchase automaticamente.</p>
                </div>
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">Token da API de Conversões (CAPI Token)</label>
                  <textarea
                    rows={3}
                    value={metaApiToken}
                    onChange={(e) => setMetaApiToken(e.target.value)}
                    placeholder="EAAG... (Gera atribuição precisa mesmo com bloqueadores de anúncio)"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono text-[11px] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'tiktok' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">ID do Pixel TikTok</label>
                  <input
                    type="text"
                    value={tiktokPixelId}
                    onChange={(e) => setTiktokPixelId(e.target.value)}
                    placeholder="Ex: C8XXXXXXXXXXXXXXXX"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">Access Token TikTok</label>
                  <input
                    type="text"
                    value={tiktokAccessToken}
                    onChange={(e) => setTiktokAccessToken(e.target.value)}
                    placeholder="Token da API de Eventos do TikTok"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono text-[11px] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'google_analytics' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">ID de Medição do GA4 (Measurement ID)</label>
                  <input
                    type="text"
                    value={gaId}
                    onChange={(e) => setGaId(e.target.value)}
                    placeholder="Ex: G-XXXXXXXXXX"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'google_ads' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">ID de Conversão do Google Ads</label>
                  <input
                    type="text"
                    value={gAdsId}
                    onChange={(e) => setGAdsId(e.target.value)}
                    placeholder="Ex: AW-XXXXXXXXXX"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">Rótulo de Conversão (Label)</label>
                  <input
                    type="text"
                    value={gAdsLabel}
                    onChange={(e) => setGAdsLabel(e.target.value)}
                    placeholder="Ex: abCD123-efG"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'utmify' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">Pixel ID Utmify</label>
                  <input
                    type="text"
                    value={utmifyPixelId}
                    onChange={(e) => setUtmifyPixelId(e.target.value)}
                    placeholder="Ex: utm_px_xxxxxxxx"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">Token de API Utmify</label>
                  <input
                    type="text"
                    value={utmifyToken}
                    onChange={(e) => setUtmifyToken(e.target.value)}
                    placeholder="Token fornecido no dashboard da Utmify"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'gtm' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#F8FAFC] font-semibold mb-1">ID do Contêiner Google Tag Manager</label>
                  <input
                    type="text"
                    value={gtmId}
                    onChange={(e) => setGtmId(e.target.value)}
                    placeholder="Ex: GTM-XXXXXXX"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2.5 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'coupons' && (
              <div className="space-y-4 text-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value)}
                    placeholder="CÓDIGO (Ex: PROMO15)"
                    className="flex-1 bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono uppercase focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                    placeholder="% Off"
                    className="w-20 bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCoupon}
                    className="laser-button px-3 py-2 rounded-xl text-white font-bold"
                  >
                    + Criar
                  </button>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {coupons.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
                      <span className="font-mono font-bold text-violet-400">{c.code}</span>
                      <span className="text-[#94A3B8]">{c.discountPercent}% OFF</span>
                      <button type="button" onClick={() => removeCoupon(i)} className="text-red-400 hover:underline">Excluir</button>
                    </div>
                  ))}
                  {coupons.length === 0 && (
                    <p className="text-[#64748B] text-center py-3">Nenhum cupom ativo para este produto.</p>
                  )}
                </div>
              </div>
            )}

            {activeItem === 'order_bump' && (
              <div className="space-y-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#F8FAFC] font-semibold">
                  <input
                    type="checkbox"
                    checked={orderBumpEnabled}
                    onChange={(e) => setOrderBumpEnabled(e.target.checked)}
                    className="rounded border-[#1E1B26] text-violet-600 focus:ring-0"
                  />
                  <span>Ativar Order Bump no checkout deste produto</span>
                </label>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Título da Oferta</label>
                  <input
                    type="text"
                    value={orderBumpTitle}
                    onChange={(e) => setOrderBumpTitle(e.target.value)}
                    placeholder="Ex: Acesso VIP Vitalício + Grupo Exclusivo"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Valor Adicional (MZN)</label>
                  <input
                    type="number"
                    value={orderBumpPrice}
                    onChange={(e) => setOrderBumpPrice(e.target.value)}
                    placeholder="99.00"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Texto de Chamada</label>
                  <textarea
                    rows={2}
                    value={orderBumpDesc}
                    onChange={(e) => setOrderBumpDesc(e.target.value)}
                    placeholder="Marque a caixinha acima para incluir esta oferta especial!"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'custom_checkout' && (
              <div className="space-y-4 text-xs">
                {/* Banner Customization */}
                <div className="space-y-2 pb-4 border-b border-[#1E1B26]">
                  <label className="block text-[#F8FAFC] font-semibold">
                    Banner de Topo do Checkout
                  </label>
                  <p className="text-[11px] text-[#94A3B8]">
                    Personalize o visual exibindo um banner oficial acima do formulário de checkout. Arraste ou clique para carregar.
                  </p>
                  <ImageDropzone
                    value={customBannerUrl}
                    onChange={(url) => setCustomBannerUrl(url)}
                    onRemove={() => setCustomBannerUrl('')}
                    label="Banner do Checkout"
                    sublabel="Arraste ou clique para selecionar do computador (proporção retangular)"
                    aspectRatio="banner"
                  />
                </div>

                {/* Scarcity Urgency Timer */}
                <div className="space-y-3 pb-4 border-b border-[#1E1B26]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#F8FAFC] font-semibold block">Cronômetro de Escassez / Urgência</span>
                      <span className="text-[11px] text-[#94A3B8]">Aumenta a conversão gerando senso de oportunidade imediata</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomTimer(!customTimer)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        customTimer ? 'bg-violet-600' : 'bg-[#1E1B26]'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          customTimer ? 'left-6' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {customTimer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[#94A3B8] font-semibold mb-1">Duração do Timer (Minutos)</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={timerMinutes}
                          onChange={(e) => setTimerMinutes(parseInt(e.target.value) || 6)}
                          className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[#94A3B8] font-semibold mb-1">Texto de Chamada do Timer</label>
                        <input
                          type="text"
                          value={timerText}
                          onChange={(e) => setTimerText(e.target.value)}
                          placeholder="Esta oferta especial termina em:"
                          className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Guarantee days */}
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Selo de Garantia Incondicional</label>
                  <select
                    value={customGuarantee}
                    onChange={(e) => setCustomGuarantee(parseInt(e.target.value))}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] focus:outline-none"
                  >
                    <option value={7}>Garantia de 7 Dias</option>
                    <option value={14}>Garantia de 14 Dias</option>
                    <option value={30}>Garantia de 30 Dias</option>
                  </select>
                </div>

                {/* Zenofy Gateway Product ID */}
                <div className="space-y-2 pt-3 border-t border-[#1E1B26]">
                  <div className="flex items-center justify-between">
                    <label className="block text-[#F8FAFC] font-semibold">
                      ID do Produto na Zenofy (M-Pesa / e-Mola)
                    </label>
                    <span className="text-[10px] text-violet-400 font-mono bg-violet-600/10 px-2 py-0.5 rounded-lg border border-violet-500/20">
                      Integração Zenofy
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    Vincule a um produto específico do seu painel Zenofy ou deixe em branco para usar a chave padrão ativa.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {ZENOFY_PRICE_TIERS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setZenofyProductId(item.id)}
                        className={`p-2 rounded-xl border text-center transition-all text-[11px] font-medium cursor-pointer ${
                          zenofyProductId === item.id
                            ? 'border-violet-500 bg-violet-600/25 text-white font-bold shadow-[0_0_15px_rgba(124,58,237,0.3)] ring-1 ring-violet-500'
                            : 'border-[#1E1B26] bg-[#0E0C13] text-[#94A3B8] hover:border-violet-500/50 hover:bg-[#14121B]'
                        }`}
                      >
                        <span className="block text-violet-300 font-bold">{item.label}</span>
                        <span className="block text-[9px] text-[#64748B] truncate font-mono">{item.id.substring(0, 8)}...</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={zenofyProductId}
                    onChange={(e) => setZenofyProductId(e.target.value)}
                    placeholder="Ou digite outro ID da Zenofy: 6a14cb656c431b52f6375dc2"
                    className="w-full mt-1 bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'whatsapp' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Número do WhatsApp com DDI (+258...)</label>
                  <input
                    type="text"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="+258 84 123 4567"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">Mensagem Inicial</label>
                  <input
                    type="text"
                    value={whatsappMsg}
                    onChange={(e) => setWhatsappMsg(e.target.value)}
                    placeholder="Olá! Preciso de ajuda para concluir minha compra."
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {activeItem === 'webhook' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#94A3B8] font-semibold mb-1">URL de Destino do Webhook</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://sua-api.com/webhooks/otterfy"
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-3 py-2 text-[#F8FAFC] font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[#94A3B8] font-semibold mb-2">Eventos Notificados</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['order.created', 'order.approved', 'order.refunded', 'order.declined'].map((ev) => (
                      <label key={ev} className="flex items-center gap-2 text-[#F8FAFC]">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(ev)}
                          onChange={(e) => {
                            if (e.target.checked) setWebhookEvents([...webhookEvents, ev]);
                            else setWebhookEvents(webhookEvents.filter(x => x !== ev));
                          }}
                          className="rounded border-[#1E1B26] text-violet-600"
                        />
                        <span className="font-mono text-[11px]">{ev}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeItem === 'cart_recovery' && (
              <div className="space-y-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-[#F8FAFC] font-semibold">
                  <input
                    type="checkbox"
                    checked={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.checked)}
                    className="rounded border-[#1E1B26] text-violet-600"
                  />
                  <span>Recuperação automática por E-mail após 15 minutos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[#F8FAFC] font-semibold">
                  <input
                    type="checkbox"
                    checked={recoveryWhatsapp}
                    onChange={(e) => setRecoveryWhatsapp(e.target.checked)}
                    className="rounded border-[#1E1B26] text-violet-600"
                  />
                  <span>Disparo de lembrete por WhatsApp para números +258</span>
                </label>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E1B26]">
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveSubitem}
                className="laser-button px-5 py-2.5 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'A Guardar...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
