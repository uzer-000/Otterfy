'use client';

import React from 'react';
import Link from 'next/link';
import { BUSINESS_INFO, openCookieSettingsModal } from '@/lib/legal';

interface LegalFooterProps {
  variant?: 'light' | 'dark';
  compact?: boolean;
}

export default function LegalFooter({ variant = 'light', compact = false }: LegalFooterProps) {
  const isDark = variant === 'dark';

  return (
    <footer
      aria-label="Informações legais e dados empresariais"
      className={`w-full border-t text-xs transition-colors ${
        isDark
          ? 'border-[#1E1B26] bg-[#0B0910] text-[#CBD5E1]'
          : 'border-slate-200 bg-white/90 text-slate-700'
      } ${compact ? 'py-5 px-4 rounded-2xl border' : 'py-8 px-4 mt-8'}`}
    >
      <div className="max-w-3xl mx-auto space-y-4 text-center">
        {/* Brand & Intermediary Notice */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="inline-flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="w-4 h-4 object-contain"
            />
            <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {BUSINESS_INFO.tradeName}
            </span>
          </div>
          <p className={`text-[11.5px] leading-relaxed max-w-xl ${isDark ? 'text-[#CBD5E1]' : 'text-slate-600'}`}>
            A {BUSINESS_INFO.tradeName} atua como plataforma tecnológica de intermediação de pagamentos digitais.
            O conteúdo, a entrega e o suporte específico do produto adquirido são da responsabilidade do vendedor identificado,
            assegurando-se ao comprador o prazo legal mínimo de garantia de {BUSINESS_INFO.defaultGuaranteeDays} dias.
          </p>
        </div>

        {/* Navigation Links to Policies */}
        <nav aria-label="Links de políticas legais" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
          <Link
            href="/privacidade"
            className={`font-semibold underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 rounded ${
              isDark
                ? 'text-violet-300 hover:text-white focus-visible:ring-violet-400'
                : 'text-slate-800 hover:text-emerald-800 focus-visible:ring-emerald-700'
            }`}
          >
            Política de Privacidade
          </Link>
          <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <Link
            href="/termos"
            className={`font-semibold underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 rounded ${
              isDark
                ? 'text-violet-300 hover:text-white focus-visible:ring-violet-400'
                : 'text-slate-800 hover:text-emerald-800 focus-visible:ring-emerald-700'
            }`}
          >
            Termos e Condições
          </Link>
          <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <Link
            href="/cookies"
            className={`font-semibold underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 rounded ${
              isDark
                ? 'text-violet-300 hover:text-white focus-visible:ring-violet-400'
                : 'text-slate-800 hover:text-emerald-800 focus-visible:ring-emerald-700'
            }`}
          >
            Política de Cookies
          </Link>
          <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <Link
            href="/reembolso"
            className={`font-semibold underline underline-offset-2 transition-colors focus:outline-none focus-visible:ring-2 rounded ${
              isDark
                ? 'text-violet-300 hover:text-white focus-visible:ring-violet-400'
                : 'text-slate-800 hover:text-emerald-800 focus-visible:ring-emerald-700'
            }`}
          >
            Política de Reembolso
          </Link>
          <span aria-hidden="true" className={isDark ? 'text-slate-600' : 'text-slate-400'}>•</span>
          <button
            type="button"
            onClick={openCookieSettingsModal}
            className={`font-semibold underline underline-offset-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 rounded ${
              isDark
                ? 'text-violet-300 hover:text-white focus-visible:ring-violet-400'
                : 'text-slate-800 hover:text-emerald-800 focus-visible:ring-emerald-700'
            }`}
          >
            Gerir Cookies
          </button>
        </nav>

        {/* Business Details & Trademark Disclaimer */}
        <div className={`pt-3 border-t text-[11px] leading-relaxed space-y-1.5 ${
          isDark ? 'border-[#1E1B26] text-[#94A3B8]' : 'border-slate-200 text-slate-600'
        }`}>
          <p>
            <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{BUSINESS_INFO.legalName}</strong>{' '}
            • NUIT: {BUSINESS_INFO.nuit} • {BUSINESS_INFO.address}
          </p>
          <p>
            Contacto & Suporte:{' '}
            <a
              href={`mailto:${BUSINESS_INFO.supportEmail}`}
              className="underline hover:opacity-80"
            >
              {BUSINESS_INFO.supportEmail}
            </a>{' '}
            • Proteção de Dados (DPO):{' '}
            <a
              href={`mailto:${BUSINESS_INFO.privacyEmail}`}
              className="underline hover:opacity-80"
            >
              {BUSINESS_INFO.privacyEmail}
            </a>{' '}
            • Tel: {BUSINESS_INFO.supportPhone}
          </p>
          <p className="text-[10.5px]">
            Aviso de Marcas: M-Pesa® (Vodacom Moçambique, S.A.) e e-Mola® (Movitel, S.A.) são marcas registadas dos seus respetivos titulares e são referenciadas exclusivamente para identificar os meios de pagamento móveis suportados.
          </p>
        </div>
      </div>
    </footer>
  );
}

export { LegalFooter };
