'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  status: 'Ativo' | 'Inativo';
  supportsEvents?: boolean;
  supportsTestWebhook?: boolean;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    value?: string;
  }[];
}

interface WebhookLog {
  id: string;
  url: string;
  event: string;
  orderId: string;
  productName: string;
  status: number;
  ok: boolean;
  durationMs: number;
  responsePreview?: string;
  error?: string;
  createdAt: string;
}

const ALL_WEBHOOK_EVENTS = [
  { id: 'order.approved', label: 'Venda Aprovada (order.approved)' },
  { id: 'order.created', label: 'Pedido Criado / Pendente (order.created)' },
  { id: 'order.declined', label: 'Pagamento Recusado (order.declined)' },
  { id: 'order.refunded', label: 'Reembolso / Chargeback (order.refunded)' },
];

const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'webhook',
    name: 'Webhook',
    description: 'Receba notificações em tempo real (POST JSON) quando uma venda for criada, aprovada ou recusada',
    category: 'Desenvolvedor',
    status: 'Inativo',
    supportsEvents: true,
    supportsTestWebhook: true,
    icon: (
      <div className="w-9 h-9 rounded-xl bg-violet-600/15 border border-violet-500/25 text-violet-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'webhookUrl', label: 'URL do Endpoint (POST)', placeholder: 'https://sua-api.com/webhooks/otterfy' },
      { key: 'secret', label: 'Secret do Webhook (Assinatura HMAC-SHA256 Opcional)', placeholder: 'whsec_xxxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Automação de workflows e disparo automático de eventos para fluxos n8n',
    category: 'Automação',
    status: 'Inativo',
    supportsEvents: true,
    supportsTestWebhook: true,
    icon: (
      <div className="w-9 h-9 rounded-xl bg-orange-600/15 border border-orange-500/25 text-orange-400 flex items-center justify-center">
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
    id: 'utmify',
    name: 'Utmify',
    description: 'Rastreamento automático de campanhas, UTMs e conversões aprovadas',
    category: 'Rastreamento',
    status: 'Inativo',
    icon: (
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-[#1E1B26] shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
    description: 'Notificações e alertas de vendas via WhatsApp / Evolution API',
    category: 'Comunicação',
    status: 'Inativo',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'phone', label: 'Número WhatsApp para Notificações', placeholder: '+258 84 000 0000' },
      { key: 'instanceKey', label: 'Chave da Instância / Evolution API', placeholder: 'Cole a chave da API WhatsApp', type: 'password' },
    ],
  },
  {
    id: 'salesfunnel',
    name: 'Funis de Vendas',
    description: 'Configure URLs padrão de Upsell e Downsell pós-compra',
    category: 'Vendas',
    status: 'Inativo',
    icon: (
      <div className="w-9 h-9 rounded-xl bg-amber-600/15 border border-amber-500/25 text-amber-400 flex items-center justify-center">
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
    description: 'Liberação automática de acesso em plataformas externas via Webhook',
    category: 'Entrega',
    status: 'Inativo',
    supportsTestWebhook: true,
    icon: (
      <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
    ),
    fields: [
      { key: 'platform', label: 'Plataforma de Membros', placeholder: 'MemberKit, Hotmart Club, Astron, etc.' },
      { key: 'apiUrl', label: 'URL do Webhook de Matrícula Automática', placeholder: 'https://sua-area-de-membros.com/api/webhook' },
    ],
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(DEFAULT_INTEGRATIONS);
  const [serverConfigs, setServerConfigs] = useState<Record<string, { fields: Record<string, string>; events?: string[] }>>({});
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.approved', 'order.created', 'order.declined', 'order.refunded']);
  const [isActiveToggle, setIsActiveToggle] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [incomingEndpoints, setIncomingEndpoints] = useState<{ zenofy: string; e2payment: string; escalepay: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const loadFromServer = useCallback(async () => {
    try {
      const res = await fetch('/api/webhooks/config');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.integrations)) {
          const map: Record<string, { fields: Record<string, string>; events?: string[] }> = {};
          data.integrations.forEach((item: any) => {
            map[item.id] = {
              fields: item.fields || {},
              events: item.events || ['order.approved', 'order.created', 'order.declined', 'order.refunded'],
            };
          });
          setServerConfigs(map);
          setIntegrations((prev) =>
            prev.map((item) => {
              const found = data.integrations.find((p: any) => p.id === item.id);
              return found ? { ...item, status: found.status } : item;
            })
          );
        }
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
        if (data.incomingEndpoints) {
          setIncomingEndpoints(data.incomingEndpoints);
        }
        return;
      }
    } catch (e) {
      console.warn('Fallback to localStorage for integrations:', e);
    }

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
    } catch {}
  }, []);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  const openModal = (integration: IntegrationConfig) => {
    setSelectedIntegration(integration);
    setIsActiveToggle(integration.status === 'Ativo');
    setTestResult(null);

    const fromServer = serverConfigs[integration.id];
    if (fromServer && Object.keys(fromServer.fields || {}).length > 0) {
      setFormValues(fromServer.fields);
      setSelectedEvents(fromServer.events || ['order.approved', 'order.created', 'order.declined', 'order.refunded']);
      return;
    }

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
    setSelectedEvents(['order.approved', 'order.created', 'order.declined', 'order.refunded']);
  };

  const closeModal = () => {
    setSelectedIntegration(null);
    setTestResult(null);
  };

  const handleTestWebhook = async () => {
    if (!selectedIntegration) return;
    const targetUrl = (formValues.webhookUrl || formValues.apiUrl || '').trim();
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setTestResult({
        ok: false,
        text: 'Informe uma URL válida começando com https:// ou http:// para testar.',
      });
      return;
    }

    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          secret: formValues.secret,
          authHeader: formValues.authHeader,
          event: 'order.approved',
          amount: 497,
          productName: 'Produto Teste Otterfy',
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({
          ok: true,
          text: `Disparo enviado com sucesso! Resposta HTTP ${data.status} (${data.durationMs}ms).`,
        });
      } else {
        setTestResult({
          ok: false,
          text: `Falha no envio: ${data.error || `HTTP ${data.status} ${data.statusText || ''}`} (${data.durationMs || 0}ms).`,
        });
      }
      loadFromServer();
    } catch (err: any) {
      setTestResult({
        ok: false,
        text: `Erro ao testar webhook: ${err?.message || 'Falha de rede'}`,
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!selectedIntegration) return;
    setSaving(true);

    const hasUrlOrValue = Object.values(formValues).some((v) => Boolean(v && v.trim()));
    const newStatus: 'Ativo' | 'Inativo' = isActiveToggle || hasUrlOrValue ? (isActiveToggle ? 'Ativo' : 'Inativo') : 'Inativo';

    const updated = integrations.map((i) =>
      i.id === selectedIntegration.id ? { ...i, status: newStatus } : i
    );

    setIntegrations(updated);
    localStorage.setItem('otterfy-integrations-v1', JSON.stringify(updated.map((u) => ({ id: u.id, status: u.status }))));
    localStorage.setItem(`otterfy-integration-data-${selectedIntegration.id}`, JSON.stringify(formValues));

    try {
      await fetch('/api/webhooks/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedIntegration.id,
          status: newStatus,
          fields: formValues,
          events: selectedEvents,
        }),
      });
      await loadFromServer();
    } catch (err) {
      console.warn('Erro ao salvar integração no servidor:', err);
    } finally {
      setSaving(false);
    }

    setToastMessage(`Integração ${selectedIntegration.name} salva como ${newStatus}!`);
    setTimeout(() => setToastMessage(null), 3500);
    closeModal();
  };

  const copyToClipboard = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-8 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.85}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Webhooks & Integrações</h1>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Configure Webhooks em tempo real, n8n, Utmify e receba notificações automáticas de vendas aprovadas
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((item) => {
          const configuredUrl = serverConfigs[item.id]?.fields?.webhookUrl || serverConfigs[item.id]?.fields?.apiUrl;
          return (
            <div
              key={item.id}
              onClick={() => openModal(item)}
              className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/40 rounded-2xl p-6 transition-all duration-200 shadow-sm flex flex-col justify-between group cursor-pointer"
            >
              <div>
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

                <h3 className="font-bold text-base text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">
                  {item.description}
                </p>

                {configuredUrl && (
                  <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-[#0F0E14] border border-[#1E1B26] text-[11px] font-mono text-violet-300 truncate">
                    {configuredUrl}
                  </div>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-[#1E1B26]/80">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(item);
                  }}
                  className="text-xs text-[#94A3B8] group-hover:text-violet-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Configurar {item.name}</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Incoming Gateway Webhook Endpoints (IPN) */}
      {incomingEndpoints && (
        <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Endpoints de Recebimento (Webhooks dos Gateways)</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Copie o link abaixo caso precise cadastrar a URL de retorno (Callback / IPN) no painel do seu gateway de pagamento
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0 self-start sm:self-auto">
              ● Escutando Eventos 24/7
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'zenofy', label: 'Zenofy Webhook URL', url: incomingEndpoints.zenofy },
              { key: 'e2payment', label: 'E2 Payment Callback (IPN)', url: incomingEndpoints.e2payment },
              { key: 'escalepay', label: 'EscalePay Webhook URL', url: incomingEndpoints.escalepay },
            ].map((ep) => (
              <div key={ep.key} className="p-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] space-y-2">
                <span className="text-[11px] font-bold text-[#94A3B8] block">{ep.label}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={ep.url}
                    className="w-full bg-[#121016] border border-[#1E1B26] rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-[#F8FAFC] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(ep.url, ep.key)}
                    className="px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-[11px] font-bold shrink-0 cursor-pointer transition-colors"
                  >
                    {copiedUrl === ep.key ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Webhook Delivery Logs */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#F8FAFC]">Histórico Recente de Disparos de Webhook</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Acompanhe em tempo real todos os eventos enviados para suas URLs configuradas
            </p>
          </div>
          <button
            type="button"
            onClick={loadFromServer}
            className="px-3 py-1.5 rounded-xl bg-[#1A1820] hover:bg-[#231F2E] border border-[#1E1B26] text-xs font-semibold text-[#F8FAFC] cursor-pointer transition-colors"
          >
            Atualizar Logs
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748B] border border-dashed border-[#1E1B26] rounded-xl">
            Nenhum disparo de webhook registrado ainda. Configure uma URL de Webhook acima e clique em &ldquo;Testar Webhook Agora&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E1B26] text-[#94A3B8]">
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold">Evento</th>
                  <th className="py-2.5 px-3 font-semibold">Pedido / Produto</th>
                  <th className="py-2.5 px-3 font-semibold">Endpoint</th>
                  <th className="py-2.5 px-3 font-semibold">Latência</th>
                  <th className="py-2.5 px-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1B26]">
                {logs.slice(0, 12).map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A1820]/50">
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.ok
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.ok ? `✓ ${log.status}` : `✕ ${log.status || 'ERRO'}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-violet-400 font-semibold">{log.event}</td>
                    <td className="py-2.5 px-3 text-[#F8FAFC]">
                      <span className="font-mono text-[11px]">{log.orderId}</span>
                      <span className="text-[#94A3B8] block text-[10px] truncate max-w-[180px]">{log.productName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#94A3B8] max-w-[240px] truncate" title={log.url}>
                      {log.url}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#94A3B8]">{log.durationMs}ms</td>
                    <td className="py-2.5 px-3 text-[11px] text-[#64748B]">
                      {new Date(log.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO INTERATIVO */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl text-[#F8FAFC] max-h-[92vh] overflow-y-auto">
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
                  {isActiveToggle ? 'Ativada e transmitindo eventos em tempo real' : 'Desativada'}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormValues({
                        ...formValues,
                        [field.key]: val,
                      });
                      if (val.trim() && !isActiveToggle) {
                        setIsActiveToggle(true);
                      }
                    }}
                    placeholder={field.placeholder}
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] font-mono focus:outline-none transition-colors"
                  />
                </div>
              ))}
            </div>

            {/* Events Selection for Webhook / n8n */}
            {selectedIntegration.supportsEvents && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-[#F8FAFC] block">
                  Eventos que disparam o Webhook:
                </label>
                <div className="grid grid-cols-1 gap-2 p-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26]">
                  {ALL_WEBHOOK_EVENTS.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2.5 text-xs text-[#F8FAFC] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, ev.id]);
                          } else {
                            setSelectedEvents(selectedEvents.filter((x) => x !== ev.id));
                          }
                        }}
                        className="rounded border-[#1E1B26] text-violet-600"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Live Webhook Test Button */}
            {selectedIntegration.supportsTestWebhook && (
              <div className="p-3.5 rounded-xl bg-[#0F0E14] border border-[#1E1B26] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-[#F8FAFC] block">Disparar Evento de Teste</span>
                    <span className="text-[11px] text-[#94A3B8]">Envia um payload real de Venda Aprovada (MT 497)</span>
                  </div>
                  <button
                    type="button"
                    disabled={testingWebhook}
                    onClick={handleTestWebhook}
                    className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shrink-0"
                  >
                    {testingWebhook ? 'Enviando...' : '⚡ Testar Webhook Agora'}
                  </button>
                </div>

                {testResult && (
                  <p
                    className={`text-xs font-medium p-2.5 rounded-lg border ${
                      testResult.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}
                  >
                    {testResult.ok ? '✓ ' : '✕ '}
                    {testResult.text}
                  </p>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveConfig}
                className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
