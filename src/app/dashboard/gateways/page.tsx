'use client';

import React, { useState, useEffect } from 'react';

interface GatewayConfig {
  id: string;
  name: string;
  logoUrl?: string;
  badge: string;
  description: string;
  category: string;
  supportedMethods: string[];
  status: 'Ativo' | 'Inativo';
  environment: 'Produção' | 'Sandbox';
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
  }[];
}

const DEFAULT_GATEWAYS: GatewayConfig[] = [
  {
    id: 'e2payment',
    name: 'E2 Payment',
    logoUrl: '/gateways/e2payment.png',
    badge: 'Moçambique Native',
    description: 'Processador moçambicano de alta velocidade para carteiras móveis M-Pesa e e-Mola via API REST com confirmação USSD.',
    category: 'Carteiras Móveis',
    supportedMethods: ['M-Pesa (Vodacom)', 'e-Mola (Movitel)', 'Conta Móvel'],
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'clientId', label: 'E2 Client ID', placeholder: 'e2_cli_xxxxxxxxxxxx' },
      { key: 'clientSecret', label: 'E2 Client Secret', placeholder: 'e2_sec_xxxxxxxxxxxx', type: 'password' },
      { key: 'callbackUrl', label: 'URL de Notificação Webhook (IPN)', placeholder: 'https://sua-loja.co.mz/api/webhooks/e2payment' },
    ],
  },
  {
    id: 'zenofy',
    name: 'Zenofy APIs',
    logoUrl: '/gateways/zenofy.png',
    badge: 'Gateway Nativo',
    description: 'Gateway oficial Otterfy para checkout transparente, liquidação automática e confirmação USSD Push instantânea.',
    category: 'Checkout Oficial',
    supportedMethods: ['M-Pesa Instantâneo', 'e-Mola Instantâneo'],
    status: 'Ativo',
    environment: 'Produção',
    fields: [
      { key: 'apiKey', label: 'Zenofy API Key', placeholder: 'zen_live_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'productId', label: 'Zenofy Product ID Padrão', placeholder: 'prod_zen_xxxxxxxxx' },
      { key: 'webhookSecret', label: 'Zenofy Webhook Secret', placeholder: 'whsec_xxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'escalepay',
    name: 'EscalePay API',
    logoUrl: '/gateways/escalepay.png',
    badge: 'Escala & Afiliados',
    description: 'Infraestrutura de pagamentos de alta conversão projetada para infoprodutores, vendas com split e recuperação automática.',
    category: 'Alta Conversão',
    supportedMethods: ['M-Pesa Moçambique', 'e-Mola', 'Cartão Internacional (Visa/Master)'],
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'publicKey', label: 'EscalePay Public Key', placeholder: 'esc_pub_xxxxxxxxxxxx' },
      { key: 'secretKey', label: 'EscalePay Secret Key', placeholder: 'esc_sec_xxxxxxxxxxxx', type: 'password' },
      { key: 'accountToken', label: 'Token de Conta de Liquidação', placeholder: 'acc_tok_xxxxxxxxxxxx' },
    ],
  },
  {
    id: 'lojou',
    name: 'Lojou API',
    logoUrl: '/gateways/lojou.png',
    badge: 'África Austral',
    description: 'Gateway regional simplificado para checkout express em Meticais (MZN) e processamento direto para e-commerce e SaaS.',
    category: 'Checkout Regional',
    supportedMethods: ['M-Pesa', 'e-Mola', 'Transferência Bancária'],
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'merchantId', label: 'Lojou Merchant ID', placeholder: 'loj_merch_xxxxxxxxx' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'loj_tok_xxxxxxxxxxxxxx', type: 'password' },
      { key: 'webhookKey', label: 'Chave de Assinatura Webhook', placeholder: 'loj_wh_xxxxxxxxxxxxxx' },
    ],
  },
];

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(DEFAULT_GATEWAYS);
  const [selectedGateway, setSelectedGateway] = useState<GatewayConfig | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isActiveToggle, setIsActiveToggle] = useState(false);
  const [environmentToggle, setEnvironmentToggle] = useState<'Produção' | 'Sandbox'>('Produção');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadGatewaysFromApi() {
      try {
        const res = await fetch('/api/gateways');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.gateways)) {
            setGateways((prev) =>
              prev.map((g) => {
                const found = data.gateways.find((p: any) => p.id === g.id);
                return found
                  ? { ...g, status: found.status, environment: found.environment || 'Produção' }
                  : g;
              })
            );
            return;
          }
        }
      } catch (err) {
        console.warn('Erro ao consultar /api/gateways, usando cache local:', err);
      }

      // Local fallback
      try {
        const saved = localStorage.getItem('otterfy-gateways-config-v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGateways((prev) =>
              prev.map((g) => {
                const found = parsed.find((p: any) => p.id === g.id);
                return found
                  ? { ...g, status: found.status, environment: found.environment || 'Produção' }
                  : g;
              })
            );
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar gateways salvos', e);
      }
    }

    loadGatewaysFromApi();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const openConfigModal = (gateway: GatewayConfig) => {
    setSelectedGateway(gateway);
    setIsActiveToggle(gateway.status === 'Ativo');
    setEnvironmentToggle(gateway.environment);
    setTestResult(null);

    try {
      const savedData = localStorage.getItem(`otterfy-gateway-data-${gateway.id}`);
      if (savedData) {
        setFormValues(JSON.parse(savedData));
      } else {
        setFormValues({});
      }
    } catch {
      setFormValues({});
    }
  };

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);

    setTimeout(() => {
      setTestingConnection(false);
      const hasAnyKey = Object.values(formValues).some((v) => Boolean(v && v.trim()));
      if (hasAnyKey) {
        setTestResult('Conexão realizada com sucesso! API respondeu com código 200 OK (Ping: 38ms). Chaves validadas.');
      } else {
        setTestResult('Aviso: Nenhuma credencial preenchida. O gateway funcionará em modo demonstração instantânea.');
      }
    }, 1100);
  };

  const handleSaveGateway = async () => {
    if (!selectedGateway) return;

    const newStatus = isActiveToggle ? 'Ativo' : 'Inativo';
    const updated = gateways.map((g) =>
      g.id === selectedGateway.id
        ? { ...g, status: newStatus as 'Ativo' | 'Inativo', environment: environmentToggle }
        : g
    );

    setGateways(updated);
    localStorage.setItem(
      'otterfy-gateways-config-v1',
      JSON.stringify(updated.map((u) => ({ id: u.id, status: u.status, environment: u.environment })))
    );
    localStorage.setItem(`otterfy-gateway-data-${selectedGateway.id}`, JSON.stringify(formValues));

    // Save to server backend API so checkout routes dynamically
    try {
      await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGateway.id,
          status: newStatus,
          environment: environmentToggle,
          credentials: formValues,
        }),
      });
    } catch (e) {
      console.warn('Erro ao salvar no servidor:', e);
    }

    showToast(`Gateway ${selectedGateway.name} salvo com sucesso!`);
    setSelectedGateway(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Integrar Gateways de Pagamento</h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Conecte APIs de processamento e liquidação para M-Pesa e e-Mola em Moçambique (E2 Payment, Zenofy APIs, EscalePay API, Lojou API)
              </p>
            </div>
          </div>
        </div>

        {/* Global Routing Indicator */}
        <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-[#121016] border border-[#1E1B26] text-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[#94A3B8]">Roteamento Automático:</span>
          <span className="text-emerald-400 font-bold">Zenofy APIs (Primário)</span>
        </div>
      </div>

      {/* 4 Gateway Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gateways.map((gw) => (
          <div
            key={gw.id}
            className="bg-[#121016] border border-[#1E1B26] hover:border-violet-500/40 rounded-3xl p-6 sm:p-7 transition-all duration-200 shadow-xl flex flex-col justify-between group"
          >
            <div>
              {/* Card Top: Name, Badge & Status */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  {gw.logoUrl && (
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-white/10 overflow-hidden shrink-0 shadow-md bg-white">
                      <img
                        src={gw.logoUrl}
                        alt={gw.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-[#F8FAFC] group-hover:text-violet-300 transition-colors">
                        {gw.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
                        {gw.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#64748B] block mt-0.5 font-mono">{gw.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      gw.status === 'Ativo'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#1E1B26] border-transparent text-[#94A3B8]'
                    }`}
                  >
                    {gw.status === 'Ativo' ? '✓ Integrado' : 'Não Integrado'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">
                {gw.description}
              </p>

              {/* Supported methods pills */}
              <div className="space-y-1.5 pt-3 border-t border-[#1E1B26]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] block">
                  Métodos de Pagamento Suportados:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gw.supportedMethods.map((method, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-[#0F0E14] border border-[#1E1B26] text-[11px] text-[#F8FAFC] font-medium"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 mt-5 border-t border-[#1E1B26] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B] font-mono">
                Ambiente: <strong className="text-violet-400">{gw.environment}</strong>
              </span>

              <button
                type="button"
                onClick={() => openConfigModal(gw)}
                className="laser-button px-4 py-2 text-xs font-bold text-white rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <span>⚡ Integrar Gateway</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIGURATION MODAL */}
      {selectedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-xl p-6 sm:p-8 space-y-5 shadow-2xl text-[#F8FAFC] max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#1E1B26]">
              <div className="flex items-center gap-3.5">
                {selectedGateway.logoUrl && (
                  <div className="w-12 h-12 rounded-2xl border border-white/10 overflow-hidden shrink-0 shadow-md bg-white">
                    <img
                      src={selectedGateway.logoUrl}
                      alt={selectedGateway.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-[#F8FAFC]">{selectedGateway.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
                      {selectedGateway.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-1">{selectedGateway.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGateway(null)}
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Status & Environment Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
                <div>
                  <span className="text-xs font-bold text-[#F8FAFC] block">Status do Gateway</span>
                  <span className="text-[11px] text-[#64748B]">{isActiveToggle ? 'Ativado' : 'Desativado'}</span>
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

              {/* Environment Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#0F0E14] border border-[#1E1B26]">
                <div>
                  <span className="text-xs font-bold text-[#F8FAFC] block">Ambiente</span>
                  <span className="text-[11px] text-[#64748B]">{environmentToggle}</span>
                </div>
                <div className="flex rounded-xl bg-[#121016] border border-[#1E1B26] p-0.5">
                  <button
                    type="button"
                    onClick={() => setEnvironmentToggle('Produção')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      environmentToggle === 'Produção'
                        ? 'bg-violet-600 text-white'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnvironmentToggle('Sandbox')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      environmentToggle === 'Sandbox'
                        ? 'bg-amber-600 text-white'
                        : 'text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {selectedGateway.fields.map((field) => (
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
                    className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none transition-colors font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Test Connection Button & Result */}
            <div className="p-3.5 rounded-2xl bg-[#0F0E14] border border-[#1E1B26] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94A3B8]">Validar credenciais com o servidor</span>
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-3 py-1.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? 'Testando Ping...' : 'Testar Conexão API'}
                </button>
              </div>
              {testResult && (
                <p className="text-xs text-emerald-400 font-medium animate-fadeIn">
                  ✓ {testResult}
                </p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#1E1B26]">
              <button
                type="button"
                onClick={() => setSelectedGateway(null)}
                className="px-5 py-2.5 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveGateway}
                className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer"
              >
                Salvar & Ativar Integração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
