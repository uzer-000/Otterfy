'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export type PaymentMethodType = 'MPESA' | 'EMOLA' | 'STRIPE' | 'CARD' | 'EMIS' | 'PAYFAST' | 'BANK' | 'ZENOFY' | 'E2PAYMENT' | 'ESCALEPAY' | 'LOJOU';

interface PaymentMethodBadgeProps {
  method: PaymentMethodType | string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function PaymentMethodBadge({
  method,
  size = 'md',
  showLabel = true,
  className = '',
}: PaymentMethodBadgeProps) {
  const norm = (method || '').toUpperCase().trim();
  const [imgError, setImgError] = useState(false);

  // Configuration for each method
  const config = React.useMemo(() => {
    if (norm.includes('MPESA') || norm.includes('M-PESA')) {
      return {
        label: 'M-Pesa',
        subLabel: 'Vodacom (84 / 85)',
        logoSrc: '/gateways/mpesa.svg',
        bgLight: 'bg-[#FF0000]/10 border-[#FF0000]/30 text-[#D80000]',
        bgDark: 'bg-[#FF0000]/15 border-[#FF0000]/30 text-[#FF4D4D]',
        accentColor: '#E60000',
        brandText: 'Vodacom M-Pesa',
      };
    }
    if (norm.includes('EMOLA') || norm.includes('E-MOLA')) {
      return {
        label: 'e-Mola',
        subLabel: 'Movitel (86 / 87)',
        logoSrc: '/gateways/emola.svg',
        bgLight: 'bg-[#FF6600]/10 border-[#FF6600]/30 text-[#D95300]',
        bgDark: 'bg-[#FF6600]/15 border-[#FF6600]/30 text-[#FFA04D]',
        accentColor: '#FF6600',
        brandText: 'Movitel e-Mola',
      };
    }
    if (norm.includes('STRIPE') || norm.includes('CARD') || norm.includes('CARTAO')) {
      return {
        label: 'Cartão',
        subLabel: 'Visa • Mastercard',
        logoSrc: '/gateways/stripe-cards.svg',
        bgLight: 'bg-[#635BFF]/10 border-[#635BFF]/30 text-[#635BFF]',
        bgDark: 'bg-[#635BFF]/15 border-[#635BFF]/30 text-[#A29BFE]',
        accentColor: '#635BFF',
        brandText: 'Cards / Stripe',
      };
    }
    if (norm.includes('EMIS') || norm.includes('MULTICAIXA')) {
      return {
        label: 'Multicaixa',
        subLabel: 'EMIS GPO • Angola',
        logoSrc: '/gateways/multicaixa.svg',
        bgLight: 'bg-[#0D47A1]/10 border-[#0D47A1]/30 text-[#0D47A1]',
        bgDark: 'bg-[#0D47A1]/15 border-[#0D47A1]/30 text-[#64B5F6]',
        accentColor: '#0D47A1',
        brandText: 'Multicaixa Express',
      };
    }
    if (norm.includes('PAYFAST')) {
      return {
        label: 'PayFast',
        subLabel: 'South Africa • ZAR',
        logoSrc: '/gateways/payfast.png',
        bgLight: 'bg-[#E51937]/10 border-[#E51937]/30 text-[#E51937]',
        bgDark: 'bg-[#E51937]/15 border-[#E51937]/30 text-[#FF6B81]',
        accentColor: '#E51937',
        brandText: 'PayFast EFT',
      };
    }
    if (norm.includes('BANK') || norm.includes('BANCO') || norm.includes('BIM') || norm.includes('BCI')) {
      return {
        label: 'Banco (NIB)',
        subLabel: 'Transferência Bancária',
        logoSrc: '',
        bgLight: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
        bgDark: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        accentColor: '#10B981',
        brandText: 'Banco Moçambique',
      };
    }
    // Default / Zenofy
    return {
      label: 'Zenofy',
      subLabel: 'Gateway Nativo',
      logoSrc: '/gateways/zenofy.png',
      accentColor: '#8B5CF6',
      brandText: 'Otterfy Zenofy',
    };
  }, [norm]);

  const pillThemeClass = React.useMemo(() => {
    if (norm.includes('MPESA') || norm.includes('M-PESA')) {
      return 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400';
    }
    if (norm.includes('EMOLA') || norm.includes('E-MOLA')) {
      return 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400';
    }
    if (norm.includes('STRIPE') || norm.includes('CARD') || norm.includes('CARTAO')) {
      return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400';
    }
    if (norm.includes('EMIS') || norm.includes('MULTICAIXA')) {
      return 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400';
    }
    if (norm.includes('PAYFAST')) {
      return 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400';
    }
    if (norm.includes('BANK') || norm.includes('BANCO') || norm.includes('BIM') || norm.includes('BCI')) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    }
    return 'bg-violet-500/10 border-violet-500/30 text-violet-600 dark:text-violet-400';
  }, [norm]);

  // Dimensions
  const dims = {
    xs: { box: 'w-5 h-5', img: 14, text: 'text-[10px]', pad: 'px-1.5 py-0.5' },
    sm: { box: 'w-6 h-6', img: 18, text: 'text-xs', pad: 'px-2 py-1' },
    md: { box: 'w-8 h-8', img: 24, text: 'text-xs', pad: 'px-2.5 py-1.5' },
    lg: { box: 'w-10 h-10', img: 30, text: 'text-sm', pad: 'px-3 py-2' },
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl border font-bold transition-all ${pillThemeClass} ${dims.pad} ${className}`}
    >
      {/* Visual Image / Logo Container */}
      <div
        className={`${dims.box} rounded-lg bg-white shadow-sm flex items-center justify-center p-0.5 overflow-hidden shrink-0 border border-slate-200`}
      >
        {config.logoSrc && !imgError ? (
          <Image
            src={config.logoSrc}
            alt={config.label}
            width={dims.img}
            height={dims.img}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <span
            className="font-black text-[10px] leading-none"
            style={{ color: config.accentColor }}
          >
            {config.label.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Text Label */}
      {showLabel && (
        <span className={`tracking-tight ${dims.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Interactive Radio Card for Checkouts and Modals
interface PaymentMethodOptionCardProps {
  method: 'MPESA' | 'EMOLA' | 'STRIPE' | 'BANK';
  selected: boolean;
  onSelect: () => void;
  prefixHelper?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export function PaymentMethodOptionCard({
  method,
  selected,
  onSelect,
  prefixHelper,
  className = '',
  layout = 'horizontal',
}: PaymentMethodOptionCardProps) {
  const isMpesa = method === 'MPESA';
  const isEmola = method === 'EMOLA';
  const isStripe = method === 'STRIPE';
  const isBank = method === 'BANK';

  const title = isMpesa ? 'M-Pesa' : isEmola ? 'e-Mola' : isStripe ? 'Cartão Visa/Master' : 'Banco (NIB)';
  const subtitle = prefixHelper || (isMpesa ? '84 • 85 (Vodacom)' : isEmola ? '86 • 87 (Movitel)' : isStripe ? 'Crédito / Débito' : 'Transferência');
  const logo = isMpesa ? '/gateways/mpesa.svg' : isEmola ? '/gateways/emola.svg' : isStripe ? '/gateways/stripe-cards.svg' : '';
  const brandAccent = isMpesa ? '#E60000' : isEmola ? '#FF6600' : isStripe ? '#635BFF' : '#10B981';

  // Vertical layout (ideal for 3-column modal grids and compact selectors)
  if (layout === 'vertical') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`relative w-full p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer select-none group min-w-0 ${
          selected
            ? isMpesa
              ? 'border-[#E60000] bg-red-50/90 dark:bg-red-950/30 shadow-md shadow-[#E60000]/10 ring-2 ring-[#E60000]/25'
              : isEmola
                ? 'border-[#FF6600] bg-orange-50/90 dark:bg-orange-950/30 shadow-md shadow-[#FF6600]/10 ring-2 ring-[#FF6600]/25'
                : isBank
                  ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/30 shadow-md shadow-emerald-600/10 ring-2 ring-emerald-600/25'
                  : 'border-violet-600 bg-violet-50/90 dark:bg-violet-950/30 shadow-md shadow-violet-600/10 ring-2 ring-violet-600/25'
            : 'border-slate-200 dark:border-[#252033] bg-white dark:bg-[#121018] hover:border-slate-300 dark:hover:border-[#352D48] hover:bg-slate-50/50 dark:hover:bg-[#16131F]'
        } ${className}`}
      >
        {/* Subtle Checkmark Badge in Top Right */}
        <div
          className={`otter-keep-colors absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            selected
              ? 'border-transparent shadow-xs'
              : 'border-slate-300 dark:border-slate-600 bg-transparent'
          }`}
          style={{ backgroundColor: selected ? brandAccent : 'transparent' }}
        >
          {selected && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Logo Container */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5 bg-white shadow-xs flex items-center justify-center shrink-0 border-2 transition-transform duration-200 group-hover:scale-105 ${
            selected ? 'shadow-md border-transparent' : 'border-slate-200 dark:border-white/15'
          }`}
          style={{ borderColor: selected ? brandAccent : undefined }}
        >
          {logo ? (
            <Image
              src={logo}
              alt={title}
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          ) : (
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
            </svg>
          )}
        </div>

        {/* Title and Subtitle */}
        <div className="w-full text-center min-w-0 mt-2 px-0.5">
          <div className="flex items-center justify-center gap-1">
            <h4
              className={`text-xs sm:text-sm font-black tracking-tight whitespace-nowrap leading-tight ${
                selected
                  ? isMpesa
                    ? 'text-[#C40000] dark:text-red-300'
                    : isEmola
                      ? 'text-[#C74900] dark:text-orange-300'
                      : isBank
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-violet-700 dark:text-violet-300'
                  : 'text-slate-900 dark:text-[#F8FAFC]'
              }`}
            >
              {title}
            </h4>
          </div>
          <p
            className={`text-[10px] mt-0.5 truncate block w-full ${
              selected
                ? isMpesa
                  ? 'text-red-900/80 dark:text-red-200/80 font-semibold'
                  : isEmola
                    ? 'text-orange-900/80 dark:text-orange-200/80 font-semibold'
                    : isBank
                      ? 'text-emerald-900/80 dark:text-emerald-200/80 font-semibold'
                      : 'text-violet-900/80 dark:text-violet-200/80 font-semibold'
                : 'text-slate-500 dark:text-[#94A3B8] font-medium'
            }`}
          >
            {subtitle}
          </p>
        </div>
      </button>
    );
  }

  // Horizontal layout (for checkouts and wide cards)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 text-left flex items-center justify-between gap-3 cursor-pointer select-none group min-w-0 ${
        selected
          ? isMpesa
            ? 'border-[#E60000] bg-red-50/90 dark:bg-red-950/30 shadow-md shadow-[#E60000]/10 ring-2 ring-[#E60000]/25'
            : isEmola
              ? 'border-[#FF6600] bg-orange-50/90 dark:bg-orange-950/30 shadow-md shadow-[#FF6600]/10 ring-2 ring-[#FF6600]/25'
              : isBank
                ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/30 shadow-md shadow-emerald-600/10 ring-2 ring-emerald-600/25'
                : 'border-violet-600 bg-violet-50/90 dark:bg-violet-950/30 shadow-md shadow-violet-600/10 ring-2 ring-violet-600/25'
          : 'border-slate-200 dark:border-[#252033] bg-white dark:bg-[#121018] hover:border-slate-300 dark:hover:border-[#352D48] hover:bg-slate-50/50 dark:hover:bg-[#16131F]'
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Prominent Logo Container */}
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl p-1.5 bg-white shadow-xs flex items-center justify-center shrink-0 border-2 transition-transform duration-200 group-hover:scale-105 ${
            selected
              ? 'shadow-md border-transparent'
              : 'border-slate-200 dark:border-white/15'
          }`}
          style={{ borderColor: selected ? brandAccent : undefined }}
        >
          {logo ? (
            <Image
              src={logo}
              alt={title}
              width={40}
              height={40}
              className="w-full h-full object-contain"
            />
          ) : (
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
            </svg>
          )}
        </div>

        {/* Titles and Fast Helper with Flawless Contrast */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs sm:text-sm font-black tracking-tight whitespace-nowrap leading-tight ${
                selected
                  ? isMpesa
                    ? 'text-[#C40000] dark:text-red-300'
                    : isEmola
                      ? 'text-[#C74900] dark:text-orange-300'
                      : isBank
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-violet-700 dark:text-violet-300'
                  : 'text-slate-900 dark:text-[#F8FAFC]'
              }`}
            >
              {title}
            </h4>
            {selected && (
              <span
                className="otter-keep-colors px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider text-white shrink-0"
                style={{ backgroundColor: brandAccent }}
              >
                Ativo
              </span>
            )}
          </div>
          <p
            className={`text-[11px] mt-0.5 truncate block ${
              selected
                ? isMpesa
                  ? 'text-red-900/80 dark:text-red-200/80 font-semibold'
                  : isEmola
                    ? 'text-orange-900/80 dark:text-orange-200/80 font-semibold'
                    : isBank
                      ? 'text-emerald-900/80 dark:text-emerald-200/80 font-semibold'
                      : 'text-violet-900/80 dark:text-violet-200/80 font-semibold'
                : 'text-slate-600 dark:text-[#94A3B8] font-medium'
            }`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Custom Selected Radio Bubble */}
      <div
        className={`otter-keep-colors w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          selected
            ? 'border-transparent shadow-xs'
            : 'border-slate-300 dark:border-slate-600 bg-transparent'
        }`}
        style={{ backgroundColor: selected ? brandAccent : 'transparent' }}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </button>
  );
}
