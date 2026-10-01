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

  // ORDER BUMP
  const isOrderBumpAvailable = checkoutSettings?.orderBump?.enabled ?? false;
  const [includeOrderBump, setIncludeOrderBump] = useState(false);
  const orderBumpPrice = checkoutSettings?.orderBump?.price || 250;
  const orderBumpTitle = checkoutSettings?.orderBump?.title || 'Pack de Modelos VIP + Acesso Antecipado';
  const orderBumpDesc = checkoutSettings?.orderBump?.description || 'Adicione materiais complementares exclusivos por uma fração do valor original.';

  // CUPONS DE DESCONTO (Aplicados apenas via URL se configurado na campanha, sem exibir campo para não distrair o lead)
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
      errors.name = 'O nome deve ter pelo menos 2 caracteres';
    }

    const phoneRegex = /^(84|85|86|87)\d{7}$/;
    if (!phoneRegex.test(phone)) {
      errors.phone = 'Número inválido. Deve ter 9 dígitos e começar com 84, 85, 86 ou 87';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          customerName: name,
          customerPhone: `+258${phone}`,
          customerEmail: email,
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
        // Fallback simulate instant success if demo mode
        window.location.href = `/pay/success?orderId=${data.orderId || 'DEMO-OK'}&amount=${totalCalculatedPrice}`;

      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Ocorreu um erro inesperado ao conectar com a carteira.');
    }
  };

  const guaranteeDays = checkoutSettings?.customCheckout?.guaranteeDays || 7;
  const whatsappPhone = checkoutSettings?.whatsappSupport?.phone;
  const whatsappMsg = encodeURIComponent(
    checkoutSettings?.whatsappSupport?.message || `Olá! Preciso de ajuda com a compra de ${productName}`
  );

  if (status === 'error') {
    return (
      <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-8 text-center max-w-lg mx-auto shadow-2xl animate-fadeIn">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">Erro no pagamento</h3>
        <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">{errorMessage}</p>
        <button
          onClick={() => setStatus('form')}
          className="laser-button w-full py-3.5 px-4 text-[#F8FAFC] font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: CHECKOUT FORM & PAYMENT SELECTION (7 COLS)                   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#121016] border border-[#1E1B26] p-6 sm:p-8 rounded-3xl shadow-2xl">
            {/* Step 1: Dados Pessoais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1E1B26]">
                <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight uppercase">
                  Identificação do Comprador
                </h3>
              </div>

              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Nome Completo <span className="text-violet-400">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-[#0F0E14] border ${validationErrors.name ? 'border-red-500 focus:border-red-500' : 'border-[#1E1B26] focus:border-violet-500'} rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors font-medium`}
                  placeholder="Seu nome completo"
                  required
                />
                {validationErrors.name && <p className="text-red-400 text-xs mt-1">{validationErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Número da Carteira Móvel (M-Pesa / e-Mola) <span className="text-violet-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-violet-400 font-mono">
                    +258
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    className={`w-full bg-[#0F0E14] border ${validationErrors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#1E1B26] focus:border-violet-500'} rounded-xl pl-16 pr-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors font-mono font-bold`}
                    placeholder="84 / 85 / 86 / 87 XXX XXXX"
                    required
                  />
                </div>
                {validationErrors.phone && <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>}
                <span className="text-[11px] text-[#64748B] block mt-1.5">
                  Será redirecionado(a) para a página de pagamento seguro após clicar em Avançar.
                </span>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Email para Receber o Acesso (Opcional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none transition-colors"
                  placeholder="seu.email@exemplo.co.mz"
                />
              </div>
            </div>

            {/* Step 2: Informação de Pagamento (sem seleção — a Zenopay detecta pelo número) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#1E1B26]">
                <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-black flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight uppercase">
                  Forma de Pagamento
                </h3>
              </div>

              <div className="rounded-2xl border border-[#1E1B26] bg-[#0F0E14] p-4 flex items-center gap-4">
                {/* e-Mola logo */}
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/gateways/emola.png" alt="e-Mola" className="w-full h-full object-contain" />
                </div>
                {/* M-Pesa logo */}
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img src="/gateways/Mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-bold text-[#F8FAFC]">M-Pesa &amp; e-Mola aceitos</p>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Pagamento processado automaticamente pelo número que inseriu acima.
                  </p>
                </div>
              </div>
            </div>


            {/* Step 3: Order Bump (se configurado no produto) */}
            {isOrderBumpAvailable && (
              <div
                onClick={() => setIncludeOrderBump(!includeOrderBump)}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden select-none ${
                  includeOrderBump
                    ? 'bg-violet-950/25 border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.15)] ring-1 ring-violet-500/50'
                    : 'bg-[#0F0E14] border-dashed border-[#2A2636] hover:border-violet-500/50'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={includeOrderBump}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 text-violet-600 rounded focus:ring-0 cursor-pointer accent-violet-600 shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500 text-black animate-pulse">
                        OFERTA ÚNICA
                      </span>
                      <h4 className="text-xs font-bold text-[#F8FAFC]">
                        Sim! Adicionar {orderBumpTitle}
                      </h4>
                    </div>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {orderBumpDesc}{' '}
                      <strong className="text-violet-300 font-bold block sm:inline mt-1 sm:mt-0">
                        (+{formatMZN(orderBumpPrice)})
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Botão de Pagamento & Confirmação */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="laser-button w-full py-4 px-6 text-white text-base font-black rounded-2xl disabled:opacity-70 flex items-center justify-center cursor-pointer shadow-2xl transition-transform active:scale-[0.99]"
              >
                {status === 'submitting' ? (
                  <span className="flex items-center gap-2.5">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Redirecionando para pagamento...</span>
                  </span>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="tracking-tight">Avançar para Pagamento</span>
                    <span className="font-mono text-sm bg-white/20 px-3.5 py-1 rounded-xl">
                      {formatMZN(totalCalculatedPrice)}
                    </span>
                  </div>
                )}
              </button>

              {affiliateRef && (
                <p className="text-[11px] text-center text-[#64748B]">
                  Indicação de afiliado: <span className="text-violet-400 font-mono">#{affiliateRef}</span>
                </p>
              )}

              {/* Selo de Pagamento Seguro */}
              <div className="flex items-center justify-center gap-2 text-[#64748B] text-xs pt-1">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Pagamento 100% Criptografado via Carteiras Oficiais de Moçambique</span>
              </div>
            </div>
          </form>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: RESUMO DO PEDIDO - "SEGURANDO O PRÓPRIO PRODUTO" (5 COLS)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 sticky top-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <h3 className="text-sm font-bold text-[#F8FAFC] tracking-tight uppercase">
                Resumo do Pedido
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                Produto Oficial
              </span>
            </div>

            {/* Product Card Holding Image & Name */}
            <div className="flex gap-4 items-start">
              <div className="w-20 h-20 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                {productImageUrl ? (
                  <img
                    src={productImageUrl}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <h4 className="text-base font-bold text-[#F8FAFC] leading-snug line-clamp-2">
                  {productName}
                </h4>
                <p className="font-mono text-lg font-black text-violet-400">
                  {formatMZN(price)}
                </p>
                <span className="text-[11px] text-[#64748B] block">
                  Acesso imediato após confirmação
                </span>
              </div>
            </div>

            {productDescription && (
              <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#0F0E14] border border-[#1E1B26] p-3.5 rounded-2xl">
                {productDescription}
              </p>
            )}

            {/* Tabela de Valores / Financial Breakdown */}
            <div className="space-y-2.5 pt-3 border-t border-[#1E1B26] text-xs">
              <div className="flex items-center justify-between text-[#94A3B8]">
                <span>Preço base do produto</span>
                <span className="font-mono font-semibold text-[#F8FAFC]">{formatMZN(price)}</span>
              </div>

              {includeOrderBump && isOrderBumpAvailable && (
                <div className="flex items-center justify-between text-violet-300">
                  <span>+ {orderBumpTitle}</span>
                  <span className="font-mono font-semibold">+{formatMZN(orderBumpPrice)}</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Desconto ({appliedCoupon.code})</span>
                  <span className="font-mono">-{formatMZN(discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-[#1E1B26] text-sm">
                <span className="font-bold text-[#F8FAFC]">Total a Pagar</span>
                <span className="font-mono font-black text-xl text-violet-400">
                  {formatMZN(totalCalculatedPrice)}
                </span>
              </div>
            </div>

            {/* Selo de Garantia Incondicional */}
            <div className="p-3.5 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#F8FAFC] block">Garantia de {guaranteeDays} Dias</span>
                <span className="text-[11px] text-[#94A3B8]">Satisfação total garantida ou seu dinheiro de volta.</span>
              </div>
            </div>

            {/* Suporte WhatsApp se habilitado */}
            {whatsappPhone && (
              <a
                href={`https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${whatsappMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
                </svg>
                <span>Dúvidas? Fale no WhatsApp Oficial</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
