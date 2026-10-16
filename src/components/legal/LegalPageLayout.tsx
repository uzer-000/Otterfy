import React from 'react';
import Link from 'next/link';
import { BUSINESS_INFO } from '@/lib/legal';
import LegalFooter from './LegalFooter';

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  activeTab?: 'privacidade' | 'termos' | 'cookies' | 'reembolso';
  currentPath?: string;
  children: React.ReactNode;
}

export type { LegalPageLayoutProps };

const TABS = [
  { id: 'privacidade', label: 'Política de Privacidade', href: '/privacidade' },
  { id: 'termos', label: 'Termos e Condições', href: '/termos' },
  { id: 'cookies', label: 'Política de Cookies', href: '/cookies' },
  { id: 'reembolso', label: 'Política de Reembolso', href: '/reembolso' },
] as const;

export default function LegalPageLayout({
  title,
  subtitle,
  activeTab,
  currentPath,
  children,
}: LegalPageLayoutProps) {
  const selectedTab = activeTab ?? TABS.find((tab) => tab.href === currentPath)?.id;
  return (
    <div className="otter-keep-colors min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logótipo da Otterfy"
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-black tracking-tight text-slate-900">
              Otter<span className="text-violet-700">fy</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
            >
              Aceder à Plataforma
            </Link>
          </div>
        </div>

        {/* Policy Navigation Tabs */}
        <nav
          aria-label="Navegação entre documentos legais"
          className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto pb-3"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === selectedTab;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  isActive
                    ? 'bg-[#047857] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Document Title Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            <span>Conformidade Legal • {BUSINESS_INFO.country}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
            {subtitle}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-600 border-t border-slate-100">
            <span>
              <strong>Última atualização:</strong> {BUSINESS_INFO.lastUpdated}
            </span>
            <span>
              <strong>Entidade Responsável:</strong> {BUSINESS_INFO.legalName} (NUIT {BUSINESS_INFO.nuit})
            </span>
          </div>
        </div>

        {/* Policy Body */}
        <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8 text-sm text-slate-800 leading-relaxed">
          {children}

          {/* Official Business Identification Card inside every Legal Document */}
          <section
            aria-labelledby="identificacao-empresarial"
            className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <h2 id="identificacao-empresarial" className="text-base font-bold text-slate-900">
              Identificação Societária e Canais Oficiais de Contacto
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <dt className="font-bold text-slate-700">Denominação Social:</dt>
                <dd className="text-slate-900">{BUSINESS_INFO.legalName}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-700">NUIT / Registo:</dt>
                <dd className="text-slate-900">NUIT {BUSINESS_INFO.nuit} • {BUSINESS_INFO.registrationEntity}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-700">Sede Social:</dt>
                <dd className="text-slate-900">{BUSINESS_INFO.address}</dd>
              </div>
              <div>
                <dt className="font-bold text-slate-700">E-mail de Suporte ao Consumidor:</dt>
                <dd>
                  <a href={`mailto:${BUSINESS_INFO.supportEmail}`} className="text-emerald-800 font-semibold underline">
                    {BUSINESS_INFO.supportEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-700">Encarregado de Proteção de Dados (DPO):</dt>
                <dd>
                  <a href={`mailto:${BUSINESS_INFO.privacyEmail}`} className="text-emerald-800 font-semibold underline">
                    {BUSINESS_INFO.privacyEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-bold text-slate-700">Departamento Jurídico / Direitos de Autor:</dt>
                <dd>
                  <a href={`mailto:${BUSINESS_INFO.legalEmail}`} className="text-emerald-800 font-semibold underline">
                    {BUSINESS_INFO.legalEmail}
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        </article>
      </main>

      <LegalFooter variant="light" />
    </div>
  );
}

export { LegalPageLayout };
