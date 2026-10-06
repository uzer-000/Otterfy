'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'Ativo' | 'Inativo';
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    value?: string;
  }[];
}

const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'utmify',
    name: 'Utmify',
    description: 'Rastreamento de campanhas e UTMs',
    category: 'Rastreamento',
    status: 'Inativo',
    icon: (
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-[#1E1B26] shadow-sm">
        <img src="/logos/utmify.png" alt="Utmify" className="w-full h-full object-cover" />
      </div>
    ),
    fields: [
      { key: 'pixelId', label: 'ID do Pixel Utmify', placeholder: 'Ex: utm_pix_991823' },
      { key: 'apiToken', label: 'Token de API Utmify', placeholder: 'Cole seu token secreto aqui', type: 'password' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Notificações e relatórios via WhatsApp',
    category: 'Comunicação',
    status: 'Inativo',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
        </svg>
      </div>
    ),
    fields: [
      { key: 'phone', label: 'Número WhatsApp para Notificações', placeholder: '+258 84 000 0000' },
      { key: 'instanceKey', label: 'Chave da Instância / Evolution API', placeholder: 'Cole a chave da API WhatsApp', type: 'password' },
    ],
  },
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Integração com APIs externas',
    category: 'Desenvolvedor',
    status: 'Inativo',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'webhookUrl', label: 'URL do Endpoint (POST)', placeholder: 'https://sua-api.com/webhooks/otterfy' },
      { key: 'secret', label: 'Secret do Webhook (Assinatura HMAC)', placeholder: 'whsec_xxxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de workflows e integrações avançadas',
    category: 'Automação',
    status: 'Inativo',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'webhookUrl', label: 'URL do Webhook n8n', placeholder: 'https://n8n.sua-instancia.com/webhook/otterfy-events' },
      { key: 'authHeader', label: 'Header de Autenticação (Opcional)', placeholder: 'Bearer seu_token' },
    ],
  },
  {
    id: 'salesfunnel',
    name: 'Funis de Vendas',
    description: 'Crie funis de conversão para seus produtos',
    category: 'Vendas',
    status: 'Inativo',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-amber-600/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'upsellUrl', label: 'URL de Upsell Imediato (Pós-compra)', placeholder: 'https://seusite.com/oferta-vip' },
      { key: 'downsellUrl', label: 'URL de Downsell', placeholder: 'https://seusite.com/oferta-desconto' },
    ],
  },
  {
    id: 'membership',
    name: 'Áreas de Membro',
    description: 'Configure entregas em plataformas externas',
    category: 'Entrega',
    status: 'Inativo',
    icon: (
      <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'platform', label: 'Plataforma de Membros', placeholder: 'MemberKit, Hotmart Club, etc.' },
      { key: 'apiUrl', label: 'API Key ou Webhook de Liberação', placeholder: 'Cole o endpoint de matrícula automática' },
    ],
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(DEFAULT_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isActiveToggle, setIsActiveToggle] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('otterfy-integrations-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setIntegrations((prev) =>
            prev.map((item) => {
              const found = parsed.find((p: any) => p.id === item.id);
              return found ? { ...item, status: found.status } : item;
            })
          );
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar integrações salvas', e);
    }
  }, []);

  const openModal = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setIsActiveToggle(integration.status === 'Ativo');

    // Load existing values from localStorage
    try {
      const savedData = localStorage.getItem(`otterfy-integration-data-${integration.id}`);
      if (savedData) {
        setFormValues(JSON.parse(savedData));
      } else {
        setFormValues({});
      }
    } catch {
      setFormValues({});
    }
  };

  const closeModal = () => {
    setSelectedIntegration(null);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;

    const newStatus = isActiveToggle ? 'Ativo' : 'Inativo';
    const updated = integrations.map((i) =>
      i.id === selectedIntegration.id ? { ...i, status: newStatus as 'Ativo' | 'Inativo' } : i
    );

    setIntegrations(updated);
    localStorage.setItem('otterfy-integrations-v1', JSON.stringify(updated.map((u) => ({ id: u.id, status: u.status }))));
    localStorage.setItem(`otterfy-integration-data-${selectedIntegration.id}`, JSON.stringify(formValues));

    setToastMessage(`Integração ${selectedIntegration.name} salva como ${newStatus}!`);
    setTimeout(() => setToastMessage(null), 3500);
    closeModal();
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header (Print 3 style) */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Integrações</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Conecte o Otterfy às suas ferramentas de marketing, rastreamento, automação e webhook
          </p>
        </div>
      </div>


      {/* Grid of 6 Integration Cards (Print 3 layout in Otterfy theme) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-200 shadow-sm flex flex-col justify-between group"
          >
            <div>
              {/* Card Top: Icon & Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                    item.status === 'Ativo'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-[#1E1B26] border-transparent text-[#94A3B8]'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="font-bold text-base text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Bottom Link (Print 3 style) */}
            <div className="pt-6 mt-4 border-t border-[#1E1B26]/80">
              <button
                type="button"
                onClick={() => openModal(item)}
                className="text-xs text-[#94A3B8] group-hover:text-violet-400 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Clique para configurar</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CONFIGURAÇÃO INTERATIVO */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl text-[#F8FAFC]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#1E1B26]">
              <div className="flex items-center gap-3">
                {selectedIntegration.icon}
                <div>
                  <h3 className="text-lg font-bold text-[#F8FAFC]">{selectedIntegration.name}</h3>
                  <p className="text-xs text-[#94A3B8]">{selectedIntegration.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle Status Ativo/Inativo */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
              <div>
                <span className="text-xs font-semibold text-[#F8FAFC] block">Status da Integração</span>
                <span className="text-[11px] text-[#64748B]">
                  {isActiveToggle ? 'Ativada e transmitindo eventos' : 'Desativada'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsActiveToggle(!isActiveToggle)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isActiveToggle ? 'bg-emerald-600' : 'bg-[#1E1B26]'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    isActiveToggle ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {selectedIntegration.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type={field.type || 'text'}
                    value={formValues[field.key] || ''}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        [field.key]: e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
