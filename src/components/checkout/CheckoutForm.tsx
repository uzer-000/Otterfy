'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatMZN } from '@/lib/utils';

interface Props {
  productId: string;
  productName: string;
  price: number;
  productImageUrl?: string | null;
  productDescription?: string | null;
  tracking?: {
    metaPixelId?: string;
    metaApiToken?: string;
    utmifyPixelId?: string;
    utmifyToken?: string;
  };
  checkoutSettings?: {
    coupons?: Array<{ code: string; discountPercent: number }>;
    orderBump?: {
      enabled: boolean;
      title: string;
      price: number;
      description?: string;
      productId?: string;
    };
    extraOffers?: Array<{
      id?: string;
      productId?: string;
      title: string;
      price: number;
      description?: string;
    }>;
    postPurchase?: {
      upsellUrl?: string;
      downsellUrl?: string;
    };
    upsellUrl?: string;
    downsellUrl?: string;
    customCheckout?: {
      enabled?: boolean;
      themeColor?: string;
      guaranteeDays?: number;
      urgencyTimer?: boolean;
      timerMinutes?: number;
      timerText?: string;
      bannerUrl?: string;
    };
    whatsappSupport?: {
      enabled: boolean;
      phone: string;
      message?: string;
    };
  };
}

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

const MOZAMBIQUE_PROVINCES = [
  'Maputo Cidade',
  'Maputo Província (Matola)',
  'Gaza (Xai-Xai)',
  'Inhambane',
  'Sofala (Beira)',
  'Manica (Chimoio)',
  'Tete',
  'Zambézia (Quelimane)',
  'Nampula',
  'Cabo Delgado (Pemba)',
  'Niassa (Lichinga)',
];

const MOZAMBIQUE_BUYERS = [
  'Edson M.',
  'Kátia S.',
  'Mauro C.',
  'Sheila N.',
  'Yuran M.',
  'Celso T.',
  'Dércia L.',
  'Hélio J.',
  'Nilza A.',
  'Dércio F.',
  'Tânia B.',
  'Ivandro P.',
  'Sónia R.',
  'Gerson V.',
  'Mércia C.',
  'Nelson U.',
];

export default function CheckoutForm({
  productId,
  productName,
  price,
  productImageUrl,
  productDescription,
  tracking,
  checkoutSettings,
}: Props) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'form' | 'submitting' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // iPhone-style Social Proof Notification State (5s wait -> 3s visible -> 5s wait -> repeat)
  const [liveSalePopup, setLiveSalePopup] = useState<{
    visible: boolean;
    buyer: string;
    province: string;
    method: 'M-Pesa' | 'e-Mola';
  }>({
    visible: false,
    buyer: MOZAMBIQUE_BUYERS[0],
    province: MOZAMBIQUE_PROVINCES[0],
    method: 'M-Pesa',
  });

  useEffect(() => {
    let showTimer: NodeJS.Timeout;
    let hideTimer: NodeJS.Timeout;
    let cancelled = false;
    let lastBuyerIdx = -1;
    let lastProvinceIdx = -1;

    const scheduleNextNotification = () => {
      // Wait 5 seconds before showing the next notification
      showTimer = setTimeout(() => {
        if (cancelled) return;

        let buyerIdx = Math.floor(Math.random() * MOZAMBIQUE_BUYERS.length);
        if (buyerIdx === lastBuyerIdx) buyerIdx = (buyerIdx + 1) % MOZAMBIQUE_BUYERS.length;
        lastBuyerIdx = buyerIdx;

        let provIdx = Math.floor(Math.random() * MOZAMBIQUE_PROVINCES.length);
        if (provIdx === lastProvinceIdx) provIdx = (provIdx + 1) % MOZAMBIQUE_PROVINCES.length;
        lastProvinceIdx = provIdx;

        const method = Math.random() > 0.45 ? 'M-Pesa' : 'e-Mola';

        setLiveSalePopup({
          visible: true,
          buyer: MOZAMBIQUE_BUYERS[buyerIdx],
          province: MOZAMBIQUE_PROVINCES[provIdx],
          method,
        });

        // Stay visible for 3 seconds, then hide and wait another 5 seconds
        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setLiveSalePopup((prev) => ({ ...prev, visible: false }));
          scheduleNextNotification();
        }, 3000);
      }, 5000);
    };

    scheduleNextNotification();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // ORDER BUMP / OFERTAS EXTRA NO CHECKOUT (só aparece se o vendedor tiver configurado no produto)
  const configuredExtraOffers = (checkoutSettings?.extraOffers || []).filter(
    (offer) => offer && offer.title?.trim() && Number(offer.price) > 0
  );
  const availableBumpOffers: Array<{
    key: string;
    title: string;
    price: number;
    description?: string;
  }> =
    configuredExtraOffers.length > 0
      ? configuredExtraOffers.map((o, idx) => ({
          key: o.id || o.productId || `bump_${idx}`,
          title: o.title.trim(),
          price: Number(o.price) || 0,
          description: o.description?.trim(),
        }))
      : checkoutSettings?.orderBump?.enabled === true &&
        checkoutSettings?.orderBump?.title?.trim() &&
        Number(checkoutSettings?.orderBump?.price) > 0
      ? [
          {
            key: 'default_bump',
            title: checkoutSettings.orderBump.title.trim(),
            price: Number(checkoutSettings.orderBump.price) || 0,
            description: checkoutSettings.orderBump.description?.trim(),
          },
        ]
      : [];

  const isOrderBumpAvailable = availableBumpOffers.length > 0;
  const [selectedBumpKeys, setSelectedBumpKeys] = useState<string[]>([]);

  const toggleBumpOffer = (key: string) => {
    setSelectedBumpKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectedOffers = availableBumpOffers.filter((o) => selectedBumpKeys.includes(o.key));
  const includeOrderBump = selectedOffers.length > 0;
  const orderBumpPrice = selectedOffers.reduce((sum, o) => sum + o.price, 0);
  const orderBumpTitle = selectedOffers.map((o) => o.title).join(' + ');

  // CUPONS DE DESCONTO (via URL ?cupom=...)
  const urlCoupon = searchParams.get('cupom') || searchParams.get('coupon');
  const [appliedCoupon] = useState<{ code: string; discountPercent: number } | null>(() => {
    if (!urlCoupon) return null;
    const clean = urlCoupon.trim().toUpperCase();
    const availableCoupons = checkoutSettings?.coupons || [];
    return availableCoupons.find((c) => c.code.toUpperCase() === clean) || null;
  });

  // VALIDATION ERRORS
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // CALCULATIONS
  const bumpValue = includeOrderBump && isOrderBumpAvailable ? orderBumpPrice : 0;
  const rawSubtotal = price + bumpValue;
  const discountAmount = appliedCoupon ? Math.round((rawSubtotal * appliedCoupon.discountPercent) / 100) : 0;
  const totalCalculatedPrice = Math.max(1, rawSubtotal - discountAmount);

  // UTMs & Affiliate
  const affiliateRef = searchParams.get('ref') || undefined;
  const utmParams = {
    source: searchParams.get('utm_source') || undefined,
    medium: searchParams.get('utm_medium') || undefined,
    campaign: searchParams.get('utm_campaign') || undefined,
    content: searchParams.get('utm_content') || undefined,
    term: searchParams.get('utm_term') || undefined,
  };

  // InitiateCheckout Pixel
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: productName,
          content_ids: [productId],
          value: totalCalculatedPrice,
          currency: 'MZN',
        });
      }
    } catch {
      // ignore
    }
  }, [productName, productId, totalCalculatedPrice]);

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (name.trim().length < 2) {
      errors.name = 'Por favor, insira o seu nome completo';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 9 || !cleanPhone.startsWith('8')) {
      errors.phone = 'Número inválido. Deve ter 9 dígitos (ex: 84 / 85 / 86 / 87 XXX XXXX)';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setErrorMessage('');

    const cleanPhone = phone.replace(/\D/g, '');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: name.trim(),
          customerPhone: `+258${cleanPhone}`,
          customerEmail: email.trim() || undefined,
          hasOrderBump: includeOrderBump,
          orderBumpTitle: includeOrderBump ? orderBumpTitle : undefined,
          orderBumpPrice: includeOrderBump ? orderBumpPrice : 0,
          couponCode: appliedCoupon?.code,
          discountAmount: discountAmount,
          affiliateRef,
          utmParams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      // Track Purchase in Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_name: productName,
          content_ids: [productId],
          value: totalCalculatedPrice,
          currency: 'MZN',
        });
      }

      const configuredUpsellUrl =
        data.upsellUrl ||
        checkoutSettings?.postPurchase?.upsellUrl?.trim() ||
        checkoutSettings?.upsellUrl?.trim();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (configuredUpsellUrl && /^https?:\/\//i.test(configuredUpsellUrl)) {
        window.location.href = configuredUpsellUrl;
      } else {
        window.location.href = `/pay/success?orderId=${data.orderId || 'DEMO-OK'}&amount=${totalCalculatedPrice}`;
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Ocorreu um erro ao conectar com o serviço de pagamento.');
    }
  };

  const whatsappPhone = checkoutSettings?.whatsappSupport?.phone;
  const whatsappMsg = encodeURIComponent(
    checkoutSettings?.whatsappSupport?.message || `Olá! Preciso de ajuda com a compra de ${productName}`
  );

  if (status === 'error') {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-8 text-center max-w-md mx-auto shadow-xl animate-fadeIn">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Erro no pagamento</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{errorMessage}</p>
        <button
          onClick={() => setStatus('form')}
          className="otter-keep-colors w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* NOTIFICAÇÃO POP-UP ESTILO IPHONE (A CADA 5s, VISÍVEL POR 3s)              */}
      {/* ========================================================================= */}
      <div
        aria-live="polite"
        className={`fixed top-3.5 left-1/2 -translate-x-1/2 z-[9992] w-[calc(100%-24px)] max-w-[395px] pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          liveSalePopup.visible
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 -translate-y-8 scale-95'
        }`}
      >
        <div className="otter-keep-colors bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_18px_42px_-8px_rgba(15,23,42,0.22),0_4px_14px_-2px_rgba(15,23,42,0.08)] rounded-[22px] px-3.5 py-2.5 flex items-center gap-3">
          {/* Bandeira de Moçambique Full no Quadrado */}
          <div className="w-10 h-10 rounded-[12px] overflow-hidden shadow-sm shrink-0 border border-black/[0.08] relative bg-slate-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mozambique-flag.png"
              alt="Bandeira de Moçambique"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Conteúdo da Notificação iPhone */}
          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 truncate">
                Compra Confirmada • {liveSalePopup.province}
              </span>
              <span className="text-[10px] font-medium text-gray-400 shrink-0">
                agora
              </span>
            </div>
            <p className="text-[12.5px] font-medium text-gray-800 leading-snug line-clamp-2 mt-0.5">
              <strong className="font-bold text-gray-950">{liveSalePopup.buyer}</strong> de{' '}
              <strong className="font-semibold text-gray-900">{liveSalePopup.province}</strong> adquiriu{' '}
              <strong className="font-bold text-[#059669]">{productName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD PRINCIPAL DO CHECKOUT (LAYOUT ORIGINAL MODERNIZADO E PROFISSIONAL)    */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[480px] mx-auto bg-white rounded-[28px] border border-slate-200/85 shadow-[0_16px_44px_-12px_rgba(15,23,42,0.09),0_4px_14px_-4px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Top subtle emerald accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669]" />

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
          {/* ========================================================================= */}
          {/* 1. TOP HEADER: COMPRA SEGURA & MOÇAMBIQUE                                 */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-xs font-bold text-[#047857]">
              <svg
                className="w-3.5 h-3.5 text-[#059669] shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Compra segura</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/75 text-xs font-semibold text-slate-600">
              <span className="text-sm leading-none select-none">🇲🇿</span>
              <span>Moçambique</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. PRODUCT INFO: THUMBNAIL + TITLE + PRICE                                */}
          {/* ========================================================================= */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#059669]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md mb-1">
                Acesso Imediato
              </span>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                {productName}
              </h1>
              <p className="text-base sm:text-lg font-black text-[#059669] mt-0.5 tracking-tight">
                {formatMZN(price)}
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. INPUT FIELDS (SIMPLES E DIRETO)                                        */}
          {/* ========================================================================= */}
          <div className="space-y-3.5 pt-0.5">
            {/* Nome completo */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full bg-slate-50/60 hover:bg-white focus:bg-white border ${
                  validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#059669]'
                } rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}
                placeholder="Digite o seu nome completo"
                required
              />
              {validationErrors.name && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Email <span className="text-slate-400 font-normal text-xs">(para receber o acesso)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 focus:border-[#059669] rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                placeholder="seu@email.com"
              />
            </div>

            {/* Número do WhatsApp */}
            <div>
              <label htmlFor="phone" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Número de Telefone / WhatsApp (M-Pesa ou e-Mola)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-500 select-none flex items-center gap-1 pr-2 border-r border-slate-200">
                  <span>🇲🇿</span>
                  <span>+258</span>
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  className={`w-full bg-slate-50/60 hover:bg-white focus:bg-white border ${
                    validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#059669]'
                  } rounded-xl pl-[78px] pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/15 transition-all font-semibold tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}
                  placeholder="84 / 85 / 86 / 87 XXX XXXX"
                  required
                />
              </div>
              {validationErrors.phone && (
                <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.phone}</p>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. ORDER BUMP / OFERTAS EXTRA NO CHECKOUT (SE HABILITADO)                 */}
          {/* ========================================================================= */}
          {isOrderBumpAvailable && (
            <div className="space-y-2.5">
              {availableBumpOffers.map((offer) => {
                const isSelected = selectedBumpKeys.includes(offer.key);
                return (
                  <div
                    key={offer.key}
                    onClick={() => toggleBumpOffer(offer.key)}
                    className={`border-2 border-dashed rounded-2xl p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isSelected
                        ? 'border-[#059669] bg-emerald-50/70 shadow-sm'
                        : 'border-emerald-400/80 bg-emerald-50/25 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center text-[#059669] shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      </div>

                      <div className="min-w-0">
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mb-0.5">
                          ⚡ Oferta Especial Opcional
                        </span>
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight truncate">
                          {offer.title}
                        </h4>
                        {offer.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {offer.description}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm font-bold text-[#059669] mt-0.5">
                          + {formatMZN(offer.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-1 shrink-0 pl-1">
                      <div
                        className={`otter-keep-colors w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[#059669] bg-[#059669] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. SUMMARY ROW (NOME DO PRODUTO ... TOTAL MT)                            */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between text-sm sm:text-base px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-800">
            <span className="font-semibold text-slate-700 truncate pr-2 text-xs sm:text-sm">
              {productName}
              {includeOrderBump && isOrderBumpAvailable && (
                <span className="text-xs text-slate-500 block font-normal">
                  + {orderBumpTitle}
                </span>
              )}
            </span>
            <span className="font-black text-slate-950 whitespace-nowrap text-base sm:text-lg">
              {formatMZN(totalCalculatedPrice)}
            </span>
          </div>

          {/* ========================================================================= */}
          {/* 6. CTA BUTTON ("Continuar" COM ANIMAÇÃO DE ATENÇÃO)                       */}
          {/* ========================================================================= */}
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="otter-keep-colors checkout-cta-attention w-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] hover:from-[#047857] hover:to-[#059669] active:scale-[0.99] disabled:opacity-75 text-white font-extrabold text-base sm:text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {status === 'submitting' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Aguarde...</span>
              </span>
            ) : (
              <>
                <span>Continuar</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>

          {/* ========================================================================= */}
          {/* 7. TRUST BADGE: PAGAMENTO SEGURO E CRIPTOGRAFADO                           */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium pt-0.5">
            <svg className="w-3.5 h-3.5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Pagamento seguro e criptografado • M-Pesa & e-Mola</span>
          </div>

          {/* WhatsApp Support (se configurado) */}
          {whatsappPhone && (
            <div className="text-center pt-0.5">
              <a
                href={`https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <span>Dúvidas? Fale no WhatsApp</span>
              </a>
            </div>
          )}
        </form>

        {/* Overlay de Processamento Seguro durante submissão do checkout */}
        {status === 'submitting' && (
          <div
            className="fixed inset-0 z-[9995] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn select-none"
            role="status"
            aria-live="polite"
            aria-label="Processando pagamento..."
          >
            <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-4" />
              <h4 className="text-base font-bold text-gray-900">Gerando Pagamento</h4>
              <p className="text-xs text-gray-500 mt-1.5 max-w-[260px] leading-relaxed">
                Conectando com segurança ao gateway (M-Pesa / e-Mola)...
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
