'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getCookieConsent,
  saveCookieConsent,
  OPEN_COOKIE_SETTINGS_EVENT,
  COOKIE_CONSENT_CHANGED_EVENT,
} from '@/lib/legal';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setVisible(true);
    } else {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
    }

    const handleOpenSettings = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
      setCustomizing(true);
      setVisible(true);
    };

    const handleConsentChanged = () => {
      const current = getCookieConsent();
      if (current) {
        setAnalytics(current.analytics);
        setMarketing(current.marketing);
      }
    };

    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleConsentChanged);
    return () => {
      window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handleConsentChanged);
    };
  }, []);

  useEffect(() => {
    if (!visible || !customizing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const existing = getCookieConsent();
        if (existing) {
          setVisible(false);
          setCustomizing(false);
        } else {
          setCustomizing(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, customizing]);

  if (!visible) return null;

  const handleAcceptNecessaryOnly = () => {
    saveCookieConsent({ analytics: false, marketing: false });
    setAnalytics(false);
    setMarketing(false);
    setCustomizing(false);
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveCookieConsent({ analytics: true, marketing: true });
    setAnalytics(true);
    setMarketing(true);
    setCustomizing(false);
    setVisible(false);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    saveCookieConsent({ analytics, marketing });
    setCustomizing(false);
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Preferências de Privacidade e Cookies"
      className="fixed bottom-0 inset-x-0 z-[9998] p-3 sm:p-4 pointer-events-none"
    >
      <div className="otter-keep-colors max-w-3xl mx-auto bg-white text-slate-900 border border-slate-300 rounded-2xl shadow-2xl p-4 sm:p-6 pointer-events-auto">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span aria-hidden="true">🍪</span>
                <span>Controlo de Cookies e Privacidade de Dados</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Utilizamos apenas cookies estritamente necessários para o funcionamento seguro da sessão e do checkout por padrão.
                Cookies analíticos e de marketing (como Meta Pixel e atribuição UTM) só são ativados mediante o seu consentimento explícito.
                Consulte a nossa{' '}
                <Link
                  href="/cookies"
                  className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
                >
                  Política de Cookies
                </Link>{' '}
                e a{' '}
                <Link
                  href="/privacidade"
                  className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>

          {customizing && (
            <form onSubmit={handleSaveCustom} className="mt-2 pt-3 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Strictly Necessary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">Estritamente Necessários</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900">
                        Sempre Ativo
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-snug">
                      Essenciais para autenticação segura, prevenção de fraude, preferência de tema e processamento do pagamento M-Pesa/e-Mola.
                    </p>
                  </div>
                </div>

                {/* Analytics */}
                <label
                  htmlFor="cookie-analytics-toggle"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex flex-col justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">Analíticos e Desempenho</span>
                      <input
                        id="cookie-analytics-toggle"
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        className="w-4 h-4 accent-[#047857] rounded focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                      />
                    </div>
                    <p className="text-slate-600 mt-1 leading-snug">
                      Permitem medir o desempenho técnico das páginas de forma agregada para melhorar a estabilidade do serviço.
                    </p>
                  </div>
                </label>

                {/* Marketing */}
                <label
                  htmlFor="cookie-marketing-toggle"
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 flex flex-col justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">Marketing e Atribuição</span>
                      <input
                        id="cookie-marketing-toggle"
                        type="checkbox"
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                        className="w-4 h-4 accent-[#047857] rounded focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                      />
                    </div>
                    <p className="text-slate-600 mt-1 leading-snug">
                      Ativam scripts de terceiros configurados pelo vendedor (ex.: Meta Pixel e Utmify) para medir conversões de campanhas.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCustomizing(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
                >
                  Cancelar Edição
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                >
                  Guardar Preferências Selecionadas
                </button>
              </div>
            </form>
          )}

          {!customizing && (
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleAcceptNecessaryOnly}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
              >
                Rejeitar Opcionais (Apenas Necessários)
              </button>
              <button
                type="button"
                onClick={() => setCustomizing(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-700"
              >
                Personalizar Cookies
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2.5 rounded-xl bg-[#047857] hover:bg-[#065F46] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                Aceitar Todos os Cookies
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { CookieConsentBanner };
