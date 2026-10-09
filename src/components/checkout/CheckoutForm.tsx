'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatMZN } from '@/lib/utils';
import OtterLoadingAnimation from '@/components/ui/OtterLoadingAnimation';

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
    };
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

  // ORDER BUMP (habilitado por padrão conforme print oficial do usuário)
  const isOrderBumpAvailable = checkoutSettings?.orderBump?.enabled ?? true;
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const orderBumpPrice = checkoutSettings?.orderBump?.price ?? 198;
  const orderBumpTitle = checkoutSettings?.orderBump?.title ?? 'ARCANUM SPY';

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

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
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
          className="w-full py-3.5 px-4 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/5 overflow-hidden">
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 md:p-7 space-y-4 sm:space-y-5">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER: COMPRA SEGURA & MOÇAMBIQUE                                 */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900">
            <svg
              className="w-4 h-4 text-[#059669] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Compra segura</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500">
            <span className="text-base leading-none select-none">🇲🇿</span>
            <span>Moçambique</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. PRODUCT INFO: THUMBNAIL + TITLE + PRICE                                */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3.5 pt-0.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
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
            <h1 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-2">
              {productName}
            </h1>
            <p className="text-base sm:text-lg font-extrabold text-[#059669] mt-0.5">
              {formatMZN(price)}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. INPUT FIELDS (SIMPLES E DIRETO)                                        */}
        {/* ========================================================================= */}
        <div className="space-y-3.5 pt-1">
          {/* Nome completo */}
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-gray-900 mb-1.5">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-white border ${
                validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#059669]'
              } rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all font-medium`}
              placeholder="Seu nome"
              required
            />
            {validationErrors.name && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-[#059669] rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all font-medium"
              placeholder="seu@email.com"
            />
          </div>

          {/* Número do WhatsApp */}
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-gray-900 mb-1.5">
              Número do WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              className={`w-full bg-white border ${
                validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#059669]'
              } rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#059669] transition-all font-medium`}
              placeholder="8X XXX XXXX"
              required
            />
            {validationErrors.phone && (
              <p className="text-red-500 text-xs mt-1 font-semibold">{validationErrors.phone}</p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. ORDER BUMP (SE HABILITADO)                                             */}
        {/* ========================================================================= */}
        {isOrderBumpAvailable && (
          <div
            onClick={() => setIncludeOrderBump(!includeOrderBump)}
            className={`border-2 border-dashed rounded-2xl p-3 sm:p-3.5 transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
              includeOrderBump
                ? 'border-[#059669] bg-emerald-50/60 shadow-sm'
                : 'border-emerald-400/80 bg-emerald-50/20 hover:bg-emerald-50/40'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-pink-100/70 border border-pink-200/60 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-br from-pink-100 to-rose-200 text-rose-700">
                  <span className="text-[12px] font-black leading-none tracking-tight">S</span>
                  <span className="text-[7px] font-bold uppercase tracking-wider">selecta</span>
                </div>
              </div>

              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-tight truncate">
                  {orderBumpTitle}
                </h4>
                <p className="text-xs sm:text-sm font-bold text-[#059669] mt-0.5">
                  {formatMZN(orderBumpPrice)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 shrink-0 pl-1">
              <svg
                className="w-4 h-4 text-red-500 animate-bounce"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
              </svg>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  includeOrderBump ? 'border-[#059669] bg-[#059669] text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {includeOrderBump && (
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
        )}

        {/* ========================================================================= */}
        {/* 5. SUMMARY ROW (NOME DO PRODUTO ... TOTAL MT)                            */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between text-sm sm:text-base pt-1 text-gray-800">
          <span className="font-semibold text-gray-700 truncate pr-2">
            {productName}
            {includeOrderBump && isOrderBumpAvailable && (
              <span className="text-xs text-gray-500 block font-normal">
                + {orderBumpTitle}
              </span>
            )}
          </span>
          <span className="font-bold text-gray-900 whitespace-nowrap text-base sm:text-lg">
            {formatMZN(totalCalculatedPrice)}
          </span>
        </div>

        {/* ========================================================================= */}
        {/* 6. CTA BUTTON ("Continuar")                                               */}
        {/* ========================================================================= */}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full bg-[#059669] hover:bg-[#047857] active:scale-[0.99] disabled:opacity-75 text-white font-bold text-base sm:text-lg py-3.5 sm:py-4 rounded-xl shadow-md shadow-emerald-700/10 flex items-center justify-center transition-all cursor-pointer"
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
            <span>Continuar</span>
          )}
        </button>

        {/* ========================================================================= */}
        {/* 7. TRUST BADGE: PAGAMENTO SEGURO E CRIPTOGRAFADO                           */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 font-medium pt-0.5">
          <span className="text-sm select-none">🔒</span>
          <span>Pagamento seguro e criptografado</span>
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

      {/* Overlay de Processamento com Mascote Otterfy durante submissão do checkout */}
      {status === 'submitting' && (
        <div
          className="fixed inset-0 z-[9995] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none"
          role="status"
          aria-live="polite"
          aria-label="Processando pagamento..."
        >
          <div className="bg-white rounded-3xl p-7 sm:p-8 max-w-sm w-full mx-auto flex flex-col items-center text-center shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <OtterLoadingAnimation size="compact" idPrefix="pay-submitting-otter" />
            <h4 className="text-base font-bold text-gray-900 mt-5">Gerando Pagamento</h4>
            <p className="text-xs text-gray-500 mt-1.5 max-w-[260px] leading-relaxed">
              Conectando com segurança ao gateway de pagamento (M-Pesa / e-Mola)...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
