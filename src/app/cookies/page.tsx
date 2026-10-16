'use client';

import React from 'react';
import { LegalPageLayout } from '@/components/legal/LegalPageLayout';
import {
    BUSINESS_INFO,
    COOKIE_CONSENT_STORAGE_KEY,
    openCookieSettingsModal,
} from '@/lib/legal';

export default function CookiePolicyPage() {
    return (
        <LegalPageLayout
            title="Política de Cookies e Tecnologias de Rastreamento"
            subtitle="Informação detalhada sobre como utilizamos cookies e armazenamento local, e como pode gerir ou revogar o seu consentimento a qualquer momento."
            currentPath="/cookies"
        >
            <div className="space-y-8 text-slate-700 leading-relaxed text-[15px]">
                <section aria-labelledby="cookies-what">
                    <h2 id="cookies-what" className="text-xl font-bold text-slate-900 mb-3">
                        1. O que são Cookies e Armazenamento Local?
                    </h2>
                    <p>
                        Cookies e chaves de armazenamento local (<code>localStorage</code>) são pequenos fragmentos de informação guardados no seu navegador quando visita um website. Na <strong>{BUSINESS_INFO.brandName}</strong>, seguimos uma política de <strong>bloqueio preventivo por defeito</strong>: nenhum cookie ou script de rastreamento publicitário é ativado sem a sua autorização expressa.
                    </p>
                </section>

                <section aria-labelledby="cookies-manage">
                    <h2 id="cookies-manage" className="text-xl font-bold text-slate-900 mb-3">
                        2. Gerir ou Revogar o seu Consentimento
                    </h2>
                    <p className="mb-4">
                        Pode alterar ou retirar o seu consentimento a qualquer momento com um único clique no botão abaixo:
                    </p>
                    <button
                        type="button"
                        onClick={openCookieSettingsModal}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                    >
                        Abrir Preferências de Cookies
                    </button>
                </section>

                <section aria-labelledby="cookies-table">
                    <h2 id="cookies-table" className="text-xl font-bold text-slate-900 mb-3">
                        3. Lista Detalhada de Cookies e Tecnologias Utilizadas
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse border border-slate-200 text-sm">
                            <thead>
                                <tr className="bg-slate-100 text-slate-900">
                                    <th className="p-3 border border-slate-200 font-bold">Nome / Tecnologia</th>
                                    <th className="p-3 border border-slate-200 font-bold">Fornecedor</th>
                                    <th className="p-3 border border-slate-200 font-bold">Categoria</th>
                                    <th className="p-3 border border-slate-200 font-bold">Finalidade</th>
                                    <th className="p-3 border border-slate-200 font-bold">Duração</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                <tr>
                                    <td className="p-3 border border-slate-200 font-mono text-xs">{COOKIE_CONSENT_STORAGE_KEY}</td>
                                    <td className="p-3 border border-slate-200">{BUSINESS_INFO.brandName} (1.ª Parte)</td>
                                    <td className="p-3 border border-slate-200">
                                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-xs">Estritamente Necessário</span>
                                    </td>
                                    <td className="p-3 border border-slate-200">Guarda a escolha do utilizador sobre aceitação ou rejeição de cookies opcionais.</td>
                                    <td className="p-3 border border-slate-200">180 dias</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200 font-mono text-xs">otterfy_user_name / theme</td>
                                    <td className="p-3 border border-slate-200">{BUSINESS_INFO.brandName} (1.ª Parte)</td>
                                    <td className="p-3 border border-slate-200">
                                        <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-xs">Estritamente Necessário</span>
                                    </td>
                                    <td className="p-3 border border-slate-200">Mantém a sessão autenticada do Produtor no painel e preferência visual de tema.</td>
                                    <td className="p-3 border border-slate-200">Sessão</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200 font-mono text-xs">_fbp / fbevents.js</td>
                                    <td className="p-3 border border-slate-200">Meta Platforms, Inc. (Terceiro)</td>
                                    <td className="p-3 border border-slate-200">
                                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-xs">Marketing (Opt-in)</span>
                                    </td>
                                    <td className="p-3 border border-slate-200">Medição de conversões de anúncios (PageView, InitiateCheckout) configurados pelo Produtor. Desativado por defeito até consentimento explícito.</td>
                                    <td className="p-3 border border-slate-200">Até 90 dias</td>
                                </tr>
                                <tr>
                                    <td className="p-3 border border-slate-200 font-mono text-xs">Utmify Pixel &amp; Parâmetros UTM</td>
                                    <td className="p-3 border border-slate-200">Utmify (Terceiro)</td>
                                    <td className="p-3 border border-slate-200">
                                        <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-xs">Marketing (Opt-in)</span>
                                    </td>
                                    <td className="p-3 border border-slate-200">Atribuição de origem de tráfego publicitário para campanhas do Produtor. Desativado por defeito até consentimento explícito.</td>
                                    <td className="p-3 border border-slate-200">Sessão / 30 dias</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section aria-labelledby="cookies-thirdparty">
                    <h2 id="cookies-thirdparty" className="text-xl font-bold text-slate-900 mb-3">
                        4. Incorporações de Terceiros e Fontes
                    </h2>
                    <p>
                        Para proteger a sua privacidade e evitar a transmissão automática do seu endereço IP para servidores externos sem consentimento, a {BUSINESS_INFO.brandName} aloja localmente as suas fontes tipográficas (Satoshi Variable) e ativos gráficos essenciais, e não carrega scripts externos da Meta ou Utmify caso escolha &ldquo;Rejeitar Opcionais (Apenas Necessários)&rdquo;.
                    </p>
                </section>
            </div>
        </LegalPageLayout>
    );
}
