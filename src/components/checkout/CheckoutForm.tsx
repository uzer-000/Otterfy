'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatMZN } from '@/lib/utils';
import { PaymentMethodOptionCard } from '@/components/ui/PaymentMethodBadge';
import {
  BUSINESS_INFO,
  COOKIE_CONSENT_UPDATED_EVENT,
  hasMarketingConsent,
} from '@/lib/legal';

interface Props {
  productId: string;
  productName: string;
  price: number;
  productImageUrl?: string | null;
  checkoutSettings?: {
    coupons?: Array<{ code: string; discountPercent: number; active?: boolean }>;
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
    fbq?: (...args: unknown[]) => void;
  }
}

export default function CheckoutForm({
  productId,
  productName,
  price,
  productImageUrl,
  checkoutSettings,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'form' | 'submitting' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'EMOLA'>('MPESA');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingAllowed, setMarketingAllowed] = useState(false);

  // Sync marketing consent state from cookie banner
  useEffect(() => {
    const syncConsent = () => setMarketingAllowed(hasMarketingConsent());
    syncConsent();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
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

  // CUPONS DE DESCONTO (via URL ?cupom=... ou digitado pelo comprador)
  const activeProductCoupons = (checkoutSettings?.coupons || []).filter((c) => c.active !== false);
  const urlCoupon = searchParams.get('cupom') || searchParams.get('coupon');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(() => {
    if (!urlCoupon) return null;
    const clean = urlCoupon.trim().toUpperCase();
    return activeProductCoupons.find((c) => c.code.toUpperCase() === clean) || null;
  });
  const [couponInput, setCouponInput] = useState(urlCoupon || '');
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const handleApplyCouponCode = () => {
    const clean = couponInput.trim().toUpperCase();
    if (!clean) return;
    const found = activeProductCoupons.find((c) => c.code.toUpperCase() === clean);
    if (found) {
      setAppliedCoupon(found);
      setCouponFeedback(`Cupom ${found.code} aplicado (-${found.discountPercent}%)!`);
    } else {
      setCouponFeedback('Cupom inválido ou expirado para este produto.');
    }
  };

  // VALIDATION ERRORS
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // CALCULATIONS
  const bumpValue = includeOrderBump && isOrderBumpAvailable ? orderBumpPrice : 0;
  const rawSubtotal = price + bumpValue;
  const discountAmount = appliedCoupon ? Math.round((rawSubtotal * appliedCoupon.discountPercent) / 100) : 0;
  const totalCalculatedPrice = Math.max(1, rawSubtotal - discountAmount);

  // UTMs & Affiliate (UTMs only collected/forwarded when user consented to marketing cookies)
  const affiliateRef = searchParams.get('ref') || undefined;
  const utmParams = marketingAllowed
    ? {
        source: searchParams.get('utm_source') || undefined,
        medium: searchParams.get('utm_medium') || undefined,
        campaign: searchParams.get('utm_campaign') || undefined,
        content: searchParams.get('utm_content') || undefined,
        term: searchParams.get('utm_term') || undefined,
      }
    : undefined;

  // InitiateCheckout Pixel — strictly gated behind marketing consent
  useEffect(() => {
    if (!marketingAllowed) return;
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
  }, [marketingAllowed, productName, productId, totalCalculatedPrice]);

  const handlePhoneChange = (rawValue: string) => {
    const digits = rawValue.replace(/\D/g, '').slice(0, 9);
    setPhone(digits);
    if (digits.startsWith('84') || digits.startsWith('85')) {
      setPaymentMethod('MPESA');
    } else if (digits.startsWith('86') || digits.startsWith('87')) {
      setPaymentMethod('EMOLA');
    }
  };

  const validate = () => {
    const errors: { [key: string]: string } = {};

    if (name.trim().length < 2) {
      errors.name = 'Por favor, insira o seu nome completo.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^8[4567]\d{7}$/.test(cleanPhone)) {
      errors.phone = 'Número inválido. Insira 9 dígitos começando por 84, 85 (M-Pesa) ou 86, 87 (e-Mola).';
    }

    if (!acceptedTerms) {
      errors.acceptedTerms = 'Para concluir a compra, deve confirmar que leu e aceita os Termos, a Política de Privacidade e a Política de Reembolso.';
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
          paymentMethod,
          selectedBumpKeys,
          couponCode: appliedCoupon?.code,
          affiliateRef,
          acceptedTerms: true,
          marketingConsent: marketingAllowed,
          utmParams: marketingAllowed ? utmParams : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      // Track Purchase in Pixel only if marketing consent was granted
      if (marketingAllowed && typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Purchase', {
          content_name: productName,
          content_ids: [productId],
          value: totalCalculatedPrice,
          currency: 'MZN',
        });
      }

      const candidateUrl = data.checkoutUrl || (data.status === 'APPROVED' ? data.upsellUrl : undefined);
      if (candidateUrl && /^https?:\/\//i.test(candidateUrl)) {
        window.location.href = candidateUrl;
      } else {
        router.push(`/pay/success?ref=${encodeURIComponent(String(data.orderId || ''))}`);
      }
    } catch (error: unknown) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ocorreu um erro ao conectar com o serviço de pagamento.');
    }
  };

  const whatsappPhone = checkoutSettings?.whatsappSupport?.phone;
  const whatsappMsg = encodeURIComponent(
    checkoutSettings?.whatsappSupport?.message || `Olá! Preciso de ajuda com a compra de ${productName}`
  );
  const guaranteeDays = checkoutSettings?.customCheckout?.guaranteeDays || BUSINESS_INFO.refundPeriodDays;

  if (status === 'error') {
    return (
      <div
        role="alert"
        className="bg-white border border-gray-200 rounded-3xl p-8 text-center max-w-md mx-auto shadow-xl animate-fadeIn"
      >
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Não foi possível concluir o pagamento</h2>
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">{errorMessage}</p>
        <button
          type="button"
          onClick={() => setStatus('form')}
          className="otter-keep-colors w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
        >
          Voltar ao Formulário de Pagamento
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white rounded-[28px] border border-slate-200/85 shadow-[0_16px_44px_-12px_rgba(15,23,42,0.09),0_4px_14px_-4px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* Top subtle emerald accent line */}
      <div className="h-1 w-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669]" />

      <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER: COMPRA SEGURA & MOÇAMBIQUE                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-xs font-bold text-[#047857]">
            <svg
              aria-hidden="true"
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

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/75 text-xs font-semibold text-slate-700">
            <span aria-hidden="true" className="text-sm leading-none select-none">🇲🇿</span>
            <span>Moçambique (MZN)</span>
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
                alt={`Imagem do produto: ${productName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-[#059669]">
                <svg aria-hidden="true" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md mb-1">
              Produto Digital • Entrega Imediata
            </span>
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
              {productName}
            </h1>
            <p className="text-base sm:text-lg font-black text-[#047857] mt-0.5 tracking-tight">
              {formatMZN(price)}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. INPUT FIELDS (ACESSÍVEIS POR TECLADO E COM CONTRASTE WCAG AA)          */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 pt-0.5">
          {/* Nome completo */}
          <div>
            <label htmlFor="name" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Nome completo <span className="text-red-600" aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
              aria-invalid={Boolean(validationErrors.name)}
              aria-describedby={validationErrors.name ? 'name-error' : undefined}
              className={`w-full bg-slate-50/60 hover:bg-white focus:bg-white border ${
                validationErrors.name ? 'border-red-600 focus:border-red-600' : 'border-slate-300 focus:border-[#059669]'
              } rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}
              placeholder="Digite o seu nome completo"
              required
            />
            {validationErrors.name && (
              <p id="name-error" role="alert" className="text-red-600 text-xs mt-1 font-semibold">
                {validationErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
              Email <span className="text-slate-600 font-normal text-xs">(recomendado para receber o acesso e recibo)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-300 focus:border-[#059669] rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              placeholder="seu@email.com"
            />
          </div>

          {/* Método de Pagamento Móvel (Acessível via Teclado com Logos e Containers Visuais) */}
          <fieldset>
            <legend className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
              Selecione o Meio de Pagamento <span className="text-red-600" aria-hidden="true">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PaymentMethodOptionCard
                method="MPESA"
                selected={paymentMethod === 'MPESA'}
                onSelect={() => setPaymentMethod('MPESA')}
                prefixHelper="84 • 85 (Vodacom M-Pesa)"
              />

              <PaymentMethodOptionCard
                method="EMOLA"
                selected={paymentMethod === 'EMOLA'}
                onSelect={() => setPaymentMethod('EMOLA')}
                prefixHelper="86 • 87 (Movitel e-Mola)"
              />
            </div>
          </fieldset>

          {/* Número de Telefone com Identificação Visual do Provedor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="phone" className="text-xs sm:text-sm font-bold text-slate-800">
                Número de Telemóvel ({paymentMethod === 'MPESA' ? 'M-Pesa' : 'e-Mola'}) <span className="text-red-600" aria-hidden="true">*</span>
              </label>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>USSD Push Automático</span>
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-bold text-slate-600 select-none flex items-center gap-1 pr-2 border-r border-slate-300">
                <span aria-hidden="true">🇲🇿</span>
                <span>+258</span>
              </span>

              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                aria-required="true"
                aria-invalid={Boolean(validationErrors.phone)}
                aria-describedby={validationErrors.phone ? 'phone-error' : 'phone-help'}
                className={`w-full bg-slate-50/60 hover:bg-white focus:bg-white border ${
                  validationErrors.phone ? 'border-red-600 focus:border-red-600' : 'border-slate-300 focus:border-[#059669]'
                } rounded-xl pl-[76px] pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-emerald-500/20 transition-all font-semibold tracking-wide shadow-[0_1px_2px_rgba(0,0,0,0.02)]`}
                placeholder="84 / 85 / 86 / 87 XXX XXXX"
                required
              />

              {/* Mini visual logo container on the right of the phone input with Smooth Outline */}
              <div className="absolute right-3 w-8 h-8 rounded-xl bg-white shadow-xs border border-slate-200 p-1 flex items-center justify-center shrink-0">
                <Image
                  src={paymentMethod === 'MPESA' ? '/gateways/mpesa.svg' : '/gateways/emola.svg'}
                  alt={paymentMethod}
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <p id="phone-help" className="text-[11px] text-slate-600 mt-1">
              Usado exclusivamente para enviar a notificação de confirmação (PIN) diretamente ao seu telemóvel.
            </p>
            {validationErrors.phone && (
              <p id="phone-error" role="alert" className="text-red-600 text-xs mt-1 font-semibold">
                {validationErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ORDER BUMP / OFERTAS EXTRA NO CHECKOUT (ACESSÍVEL POR TECLADO)         */}
        {/* ========================================================================= */}
        {isOrderBumpAvailable && (
          <div className="space-y-2.5" role="group" aria-label="Ofertas adicionais opcionais">
            {availableBumpOffers.map((offer) => {
              const isSelected = selectedBumpKeys.includes(offer.key);
              const checkboxId = `bump-offer-${offer.key}`;
              return (
                <label
                  key={offer.key}
                  htmlFor={checkboxId}
                  className={`border-2 border-dashed rounded-2xl p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 ${
                    isSelected
                      ? 'border-[#059669] bg-emerald-50/70 shadow-sm'
                      : 'border-emerald-500/80 bg-emerald-50/25 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100/80 border border-emerald-200 overflow-hidden shrink-0 flex items-center justify-center text-[#059669] shadow-sm">
                      <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>

                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded mb-0.5">
                        Oferta Adicional Opcional
                      </span>
                      <span className="block text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight truncate">
                        {offer.title}
                      </span>
                      {offer.description && (
                        <span className="block text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {offer.description}
                        </span>
                      )}
                      <span className="block text-xs sm:text-sm font-bold text-[#047857] mt-0.5">
                        + {formatMZN(offer.price)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center shrink-0 pl-1">
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleBumpOffer(offer.key)}
                      className="h-5 w-5 rounded border-slate-400 text-[#059669] focus:ring-emerald-600 cursor-pointer"
                      aria-label={`Adicionar oferta opcional ${offer.title} por ${formatMZN(offer.price)}`}
                    />
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. CUPOM DE DESCONTO (SE HOUVER CUPONS ATIVOS NO PRODUTO)                 */}
        {/* ========================================================================= */}
        {activeProductCoupons.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Código de cupom promocional"
                aria-label="Código de cupom promocional"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono uppercase text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleApplyCouponCode}
                className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Aplicar Cupom
              </button>
            </div>
            {couponFeedback && (
              <p className={`text-xs font-semibold ${appliedCoupon ? 'text-[#047857]' : 'text-red-600'}`}>
                {couponFeedback}
              </p>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5B. SUMMARY ROW (NOME DO PRODUTO ... TOTAL MT)                            */}
        {/* ========================================================================= */}
        <div className="px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-800 space-y-1">
          {appliedCoupon && (
            <div className="flex items-center justify-between text-xs text-[#047857] font-semibold">
              <span>Desconto ({appliedCoupon.code} • -{appliedCoupon.discountPercent}%)</span>
              <span>- {formatMZN(discountAmount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="font-semibold text-slate-800 truncate pr-2 text-xs sm:text-sm">
              Total a pagar ({productName}
              {includeOrderBump && isOrderBumpAvailable ? ` + ${orderBumpTitle}` : ''})
            </span>
            <span className="font-black text-slate-950 whitespace-nowrap text-base sm:text-lg">
              {formatMZN(totalCalculatedPrice)}
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 6. CONSENTIMENTO EXPLÍCITO NO FORMULÁRIO (OBRIGATÓRIO E DESMARCADO)       */}
        {/* ========================================================================= */}
        <div className="rounded-xl bg-slate-50/90 border border-slate-200 p-3.5">
          <div className="flex items-start gap-2.5">
            <input
              id="acceptedTerms"
              name="acceptedTerms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked);
                if (e.target.checked && validationErrors.acceptedTerms) {
                  setValidationErrors((prev) => {
                    const next = { ...prev };
                    delete next.acceptedTerms;
                    return next;
                  });
                }
              }}
              aria-required="true"
              aria-invalid={Boolean(validationErrors.acceptedTerms)}
              aria-describedby={validationErrors.acceptedTerms ? 'terms-error' : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 text-[#059669] focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              required
            />
            <label htmlFor="acceptedTerms" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
              Li e concordo com os{' '}
              <Link href="/termos" target="_blank" className="font-bold text-[#047857] underline hover:text-emerald-900">
                Termos e Condições
              </Link>
              , a{' '}
              <Link href="/privacidade" target="_blank" className="font-bold text-[#047857] underline hover:text-emerald-900">
                Política de Privacidade
              </Link>{' '}
              e a{' '}
              <Link href="/reembolso" target="_blank" className="font-bold text-[#047857] underline hover:text-emerald-900">
                Política de Reembolso ({guaranteeDays} dias de garantia)
              </Link>
              , e autorizo o processamento dos meus dados para concluir esta compra.
            </label>
          </div>
          {validationErrors.acceptedTerms && (
            <p id="terms-error" role="alert" className="text-red-600 text-xs mt-2 font-semibold">
              {validationErrors.acceptedTerms}
            </p>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 7. CTA BUTTON COM RÓTULO EXPLÍCITO E CLARO                                */}
        {/* ========================================================================= */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="otter-keep-colors checkout-cta-attention w-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] hover:from-[#047857] hover:to-[#059669] active:scale-[0.99] disabled:opacity-75 text-white font-extrabold text-base sm:text-lg py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        >
          {status === 'submitting' ? (
            <span className="flex items-center gap-2">
              <svg aria-hidden="true" className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processando Pedido de Pagamento...</span>
            </span>
          ) : (
            <>
              <span>Pagar {formatMZN(totalCalculatedPrice)} Agora</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </>
          )}
        </button>

        {/* ========================================================================= */}
        {/* 8. TRUST BADGE: INFORMAÇÃO FACTUAL DE SEGURANÇA E GARANTIA                */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center justify-center gap-1 text-xs text-slate-600 font-medium pt-0.5 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-[#059669] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span>Ligação encriptada (HTTPS) • Garantia de reembolso de {guaranteeDays} dias</span>
          </div>
        </div>

        {/* WhatsApp Support (se configurado) */}
        {whatsappPhone && (
          <div className="text-center pt-0.5">
            <a
              href={`https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#047857] hover:text-emerald-900 font-semibold underline"
            >
              <span>Precisa de suporte antes de comprar? Contactar Vendedor via WhatsApp</span>
            </a>
          </div>
        )}
      </form>

      {/* Overlay de Processamento Seguro durante submissão do checkout */}
      {status === 'submitting' && (
        <div
          className="fixed inset-0 z-[9995] flex flex-col items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none"
          role="status"
          aria-live="polite"
          aria-label="Processando pagamento..."
        >
          <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Branded Logo Container with Pulsing Ring & Smooth Outline */}
            <div className="relative mb-4">
              <div
                className="w-18 h-18 rounded-3xl bg-white shadow-md border-2 p-2 flex items-center justify-center"
                style={{ borderColor: paymentMethod === 'MPESA' ? '#E60000' : '#FF6600' }}
              >
                <Image
                  src={paymentMethod === 'MPESA' ? '/gateways/mpesa.svg' : '/gateways/emola.svg'}
                  alt={paymentMethod}
                  width={56}
                  height={56}
                  className="w-full h-full object-contain"
                />
              </div>
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white animate-ping"
                style={{ backgroundColor: paymentMethod === 'MPESA' ? '#E60000' : '#FF6600' }}
              />
            </div>

            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
            <h4 className="text-base font-bold text-gray-900">A Iniciar Pagamento {paymentMethod === 'MPESA' ? 'M-Pesa' : 'e-Mola'}</h4>
            <p className="text-xs text-gray-600 mt-1 max-w-[260px] leading-relaxed">
              A comunicar com a operadora móvel. Irá receber o pedido de confirmação com PIN no seu telemóvel em segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
