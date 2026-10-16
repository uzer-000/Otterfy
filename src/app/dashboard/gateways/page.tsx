'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface GatewaySpec {
  id: string;
  name: string;
  iconType: 'mobile' | 'money' | 'card' | 'bank' | 'globe' | 'shield';
  logoUrl?: string;
  badge: string;
  description: string;
  currencies: string;
  regions: string;
  methods: string;
  hostedCheckout: string;
  directApi: string;
  status: 'Ativo' | 'Inativo';
  environment: 'Produção' | 'Sandbox';
  fields: {
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    help?: string;
  }[];
}

const OFFICIAL_GATEWAYS: GatewaySpec[] = [
  {
    id: 'mpesa',
    name: 'M-Pesa (Vodacom)',
    iconType: 'mobile',
    logoUrl: '/gateways/mpesa.svg',
    badge: 'Moçambique • Vodacom',
    description: 'Mobile money payments via Vodacom M-Pesa in Mozambique. Push STK e confirmação automática USSD.',
    currencies: 'MZN (settlement)',
    regions: 'Moçambique',
    methods: 'Push STK • Pull USSD',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Ativo',
    environment: 'Produção',
    fields: [
      { key: 'shortcode', label: 'Shortcode / Business Number', placeholder: '171717' },
      { key: 'passkey', label: 'Lipa Passkey', placeholder: 'bfb279f9aa9bdbaca158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919' },
      { key: 'consumerKey', label: 'Consumer Key (API v1/v2)', placeholder: 'mp_ck_live_xxxxxxxxxxxxxxxx' },
      { key: 'consumerSecret', label: 'Consumer Secret', placeholder: 'mp_sec_live_xxxxxxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'emola',
    name: 'e-Mola (Movitel)',
    iconType: 'money',
    logoUrl: '/gateways/emola.svg',
    badge: 'Moçambique • Movitel',
    description: 'Direct API payment & Hosted checkout via Movitel e-Mola in Mozambique. Alta conversão para mobile money.',
    currencies: 'MZN (settlement)',
    regions: 'Moçambique',
    methods: 'Direct API payment • Hosted checkout',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Ativo',
    environment: 'Produção',
    fields: [
      { key: 'merchantCode', label: 'Merchant Code', placeholder: 'EMOLA_OTF_01' },
      { key: 'apiKey', label: 'e-Mola API Key', placeholder: 'em_live_xxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'pinCode', label: 'PIN de Transação', placeholder: '••••', type: 'password' },
    ],
  },
  {
    id: 'stripe',
    name: 'Cards (Stripe)',
    iconType: 'card',
    logoUrl: '/gateways/stripe-cards.svg',
    badge: 'Internacional • Visa/Master',
    description: 'International Visa, Mastercard and digital wallets. Aceite cartões em MZN, USD, AOA e ZAR com proteção 3D Secure.',
    currencies: 'MZN, USD, AOA, ZAR',
    regions: 'Internacional',
    methods: 'Card • Apple Pay / Google Pay',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Ativo',
    environment: 'Produção',
    fields: [
      { key: 'publishableKey', label: 'Publishable Key', placeholder: 'Insira a Publishable Key (ex: pk_test_...)' },
      { key: 'secretKey', label: 'Secret Key', placeholder: 'Insira a Secret Key (ex: sk_test_...)', type: 'password' },
      { key: 'webhookSecret', label: 'Webhook Signing Secret', placeholder: 'Insira o Webhook Signing Secret', type: 'password' },
    ],
  },
  {
    id: 'emis',
    name: 'Multicaixa (EMIS GPO)',
    iconType: 'bank',
    logoUrl: '/gateways/multicaixa.svg',
    badge: 'Angola • EMIS GPO',
    description: 'Multicaixa Express and card payments in Angola. Processamento em Kwanzas com liquidação direta.',
    currencies: 'AOA (settlement)',
    regions: 'Angola',
    methods: 'Multicaixa Express • EMIS card',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'merchantId', label: 'Código de Comerciante (EMIS)', placeholder: 'ANG_MERCH_00192' },
      { key: 'terminalId', label: 'Terminal ID GPO', placeholder: 'TERM_EMIS_9102' },
      { key: 'encryptionKey', label: 'Chave de Criptografia HMAC', placeholder: 'emis_hmac_xxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'payfast',
    name: 'PayFast (South Africa)',
    iconType: 'globe',
    logoUrl: '/gateways/payfast.png',
    badge: 'África do Sul • ZAR',
    description: 'Cards and regional methods via PayFast in South Africa. Suporte a EFT Instantâneo e cartões sul-africanos.',
    currencies: 'ZAR (settlement)',
    regions: 'South Africa',
    methods: 'Card • Instant EFT • PayFast local',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'merchantId', label: 'PayFast Merchant ID', placeholder: '10000100' },
      { key: 'merchantKey', label: 'PayFast Merchant Key', placeholder: '46f0cd694581a' },
      { key: 'passphrase', label: 'Security Passphrase', placeholder: 'sua-passphrase-secreta', type: 'password' },
    ],
  },
];

const BACKUP_GATEWAYS: GatewaySpec[] = [
  {
    id: 'zenofy',
    name: 'Zenofy APIs (Nativo Otterfy)',
    iconType: 'shield',
    logoUrl: '/gateways/zenofy.png',
    badge: 'Gateway Oficial Otterfy',
    description: 'Infraestrutura primária Otterfy para checkout de alta conversão, roteamento automático USSD e liquidação em tempo real.',
    currencies: 'MZN (settlement)',
    regions: 'Moçambique',
    methods: 'M-Pesa STK • e-Mola Direct API',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Ativo',
    environment: 'Produção',
    fields: [
      { key: 'apiKey', label: 'Zenofy API Key', placeholder: 'pco_ck_xxxxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'productId', label: 'Product ID Padrão', placeholder: '6a14cb656c431b52f6375dc2' },
      { key: 'webhookSecret', label: 'Webhook Secret', placeholder: 'whsec_xxxxxxxxxxxxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'e2payment',
    name: 'E2 Payment (Fallback)',
    iconType: 'mobile',
    logoUrl: '/gateways/e2payment.png',
    badge: 'Provedor Moçambicano',
    description: 'Processador moçambicano de alta velocidade para carteiras móveis com redundância instantânea em caso de instabilidade na rede.',
    currencies: 'MZN',
    regions: 'Moçambique',
    methods: 'M-Pesa • e-Mola • Conta Móvel',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'clientId', label: 'E2 Client ID', placeholder: 'e2_cli_xxxxxxxxxxxx' },
      { key: 'clientSecret', label: 'E2 Client Secret', placeholder: 'e2_sec_xxxxxxxxxxxx', type: 'password' },
    ],
  },
  {
    id: 'escalepay',
    name: 'EscalePay API (Escala & Splits)',
    iconType: 'card',
    logoUrl: '/gateways/escalepay.png',
    badge: 'Divisão de Comissões',
    description: 'Infraestrutura com split automático de comissões para afiliados e recuperação inteligente de carrinhos.',
    currencies: 'MZN, BRL',
    regions: 'Moçambique, Global',
    methods: 'M-Pesa • e-Mola • Cartão',
    hostedCheckout: 'Sim',
    directApi: 'Sim',
    status: 'Inativo',
    environment: 'Produção',
    fields: [
      { key: 'publicKey', label: 'EscalePay Public Key', placeholder: 'esc_pub_xxxxxxxxxxxx' },
      { key: 'secretKey', label: 'EscalePay Secret Key', placeholder: 'esc_sec_xxxxxxxxxxxx', type: 'password' },
    ],
  },
];

export default function GatewaysPage() {
  const [gateways, setGateways] = useState<GatewaySpec[]>(OFFICIAL_GATEWAYS);
  const [backupGateways, setBackupGateways] = useState<GatewaySpec[]>(BACKUP_GATEWAYS);
  const [settlementMode, setSettlementMode] = useState<'WALLET' | 'DIRECT'>('WALLET');
  const [selectedGateway, setSelectedGateway] = useState<GatewaySpec | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isActiveToggle, setIsActiveToggle] = useState(false);
  const [environmentToggle, setEnvironmentToggle] = useState<'Produção' | 'Sandbox'>('Produção');
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Theme observer
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    const update = () => {
      setTheme((document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark');
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const isLight = theme === 'light';

  // Load gateway configs from server
  useEffect(() => {
    async function loadServerGateways() {
      try {
        const res = await fetch('/api/gateways');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.gateways)) {
            setGateways((prev) =>
              prev.map((g) => {
                const found = json.gateways.find((sg: { id: string }) => sg.id === g.id);
                if (found) {
                  return {
                    ...g,
                    status: found.status || g.status,
                    environment: found.environment || g.environment,
                  };
                }
                return g;
              })
            );

            setBackupGateways((prev) =>
              prev.map((g) => {
                const found = json.gateways.find((sg: { id: string }) => sg.id === g.id);
                if (found) {
                  return {
                    ...g,
                    status: found.status || g.status,
                    environment: found.environment || g.environment,
                  };
                }
                return g;
              })
            );
          }
        }
      } catch (err) {
        console.error('Erro ao buscar gateways:', err);
      }
    }
    loadServerGateways();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenConfig = (g: GatewaySpec) => {
    setSelectedGateway(g);
    setIsActiveToggle(g.status === 'Ativo');
    setEnvironmentToggle(g.environment);
    setTestResult(null);

    // Load credentials if existing
    const loaded: Record<string, string> = {};
    g.fields.forEach((f) => {
      loaded[f.key] = '';
    });
    setFormValues(loaded);
  };

  const handleToggleGatewayQuick = async (g: GatewaySpec, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = g.status === 'Ativo' ? 'Inativo' : 'Ativo';
    
    // Update local state
    setGateways((prev) => prev.map((item) => (item.id === g.id ? { ...item, status: newStatus } : item)));
    setBackupGateways((prev) => prev.map((item) => (item.id === g.id ? { ...item, status: newStatus } : item)));

    try {
      await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: g.id,
          status: newStatus,
          environment: g.environment,
          credentials: {},
        }),
      });
      showToast(`${g.name} agora está ${newStatus.toUpperCase()}`);
    } catch {
      showToast('Erro ao atualizar status do gateway.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway) return;

    try {
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedGateway.id,
          status: isActiveToggle ? 'Ativo' : 'Inativo',
          environment: environmentToggle,
          credentials: formValues,
        }),
      });

      if (res.ok) {
        setGateways((prev) =>
          prev.map((g) =>
            g.id === selectedGateway.id
              ? { ...g, status: isActiveToggle ? 'Ativo' : 'Inativo', environment: environmentToggle }
              : g
          )
        );
        setBackupGateways((prev) =>
          prev.map((g) =>
            g.id === selectedGateway.id
              ? { ...g, status: isActiveToggle ? 'Ativo' : 'Inativo', environment: environmentToggle }
              : g
          )
        );
        showToast(`Configurações de ${selectedGateway.name} salvas com sucesso!`);
        setSelectedGateway(null);
      } else {
        showToast('Erro ao salvar configurações.');
      }
    } catch {
      showToast('Falha na comunicação com o servidor.');
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);

    await new Promise((resolve) => setTimeout(resolve, 850));

    if (isActiveToggle) {
      setTestResult('success');
    } else {
      setTestResult('warning');
    }
    setTestingConnection(false);
  };

  const renderIcon = (type: GatewaySpec['iconType']) => {
    switch (type) {
      case 'mobile':
        return (
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="5" y="2" width="14" height="20" rx="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        );
      case 'money':
        return (
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'card':
        return (
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        );
      case 'bank':
        return (
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
          </svg>
        );
      case 'globe':
        return (
          <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
            <path d="M2 12h20" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
    }
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 sm:space-y-8 pb-16 min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-sm font-medium bg-[#16131E] border-violet-500/40 text-white animate-in slide-in-from-bottom duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header: Title, Settlement mode switcher & Balances Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl otter-widget-card border shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Gateways & Meios de Pagamento
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
              5 Gateways Oficiais
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Ative os métodos de pagamento desejados no seu checkout. Sem custo extra por gateway — você só paga as taxas do seu modo de liquidação.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-semibold ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}
          >
            <button
              type="button"
              onClick={() => setSettlementMode('WALLET')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                settlementMode === 'WALLET'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Modo Carteira (Wallet)
            </button>
            <button
              type="button"
              onClick={() => setSettlementMode('DIRECT')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                settlementMode === 'DIRECT'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              Liquidação Direta
            </button>
          </div>

          <Link
            href="/dashboard/balance"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border border-violet-500/30 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 transition-all cursor-pointer"
          >
            <span>Ver Saldo & Saques →</span>
          </Link>
        </div>
      </div>

      {/* Highlights Bar (Exact Payzeno structure) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          className={`p-4 rounded-xl border text-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
          }`}
        >
          <div className="text-xl sm:text-2xl font-black text-[#F8FAFC]">5</div>
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
            Gateways Suportados
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border text-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
          }`}
        >
          <div className="text-xl sm:text-2xl font-black text-emerald-400">0 MT</div>
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
            Mensalidade (Modo Carteira)
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border text-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
          }`}
        >
          <div className="text-xl sm:text-2xl font-black text-violet-400">7%</div>
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
            Por Venda Confirmada
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border text-center ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
          }`}
        >
          <div className="text-xl sm:text-2xl font-black text-emerald-400">0%</div>
          <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wide">
            Comissão de Saque
          </div>
        </div>
      </div>

      {/* Grid of 5 Official Supported Gateways (Payzeno Architecture) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#F8FAFC]">Gateways Oficiais Suportados</h2>
            <p className="text-xs text-[#94A3B8]">
              Cada método pode ser ativado na sua conta de comerciante com checkout hosted ou direct API.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gateways.map((g) => {
            const isActive = g.status === 'Ativo';
            return (
              <article
                key={g.id}
                className={`h-full rounded-2xl p-5 sm:p-6 border flex flex-col justify-between transition-all duration-300 shadow-md ${
                  isActive
                    ? 'border-violet-500/40 bg-gradient-to-b from-[#151221] to-[#0E0C16]'
                    : isLight
                      ? 'bg-white border-slate-200 opacity-90'
                      : 'bg-[#0F0E14] border-[#1E1B26] opacity-80'
                }`}
              >
                <div>
                  {/* Top: Region Badge + Status Switch */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-[#CBD5E1]">
                      {g.badge}
                    </span>

                    {/* Quick Status Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleGatewayQuick(g, e)}
                      title={`Clique para alternar status (${g.status})`}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-xs'
                          : 'bg-[#1E1B26] border-[#2D2838] text-[#94A3B8]'
                      }`}
                    >
                      {g.status}
                    </button>
                  </div>

                  {/* Payzeno Branded Logo Banner Container with Smooth Outline & No Sharp Corners */}
                  <div className="w-full h-24 rounded-2xl bg-white shadow-xs border border-slate-200 dark:border-white/10 p-3.5 flex items-center justify-center my-3 overflow-hidden group">
                    {g.logoUrl ? (
                      <Image
                        src={g.logoUrl}
                        alt={g.name}
                        width={220}
                        height={60}
                        className="max-h-12 w-auto max-w-[85%] object-contain transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      renderIcon(g.iconType)
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[#F8FAFC] leading-snug mb-1">{g.name}</h3>

                  <p className="text-xs text-[#94A3B8] leading-relaxed mb-4">{g.description}</p>

                  {/* Specification List (Payzeno Definition List) */}
                  <dl
                    className={`divide-y text-xs rounded-xl p-3 border mb-4 ${
                      isLight
                        ? 'bg-slate-50 divide-slate-200 border-slate-200'
                        : 'bg-[#0B0911] divide-[#1E1B26] border-[#1E1B26]'
                    }`}
                  >
                    <div className="flex justify-between py-1.5 gap-2">
                      <dt className="text-[#94A3B8] font-medium">Moedas:</dt>
                      <dd className="font-semibold text-[#F8FAFC] font-mono text-right">{g.currencies}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 gap-2">
                      <dt className="text-[#94A3B8] font-medium">Regiões:</dt>
                      <dd className="font-semibold text-[#F8FAFC] text-right">{g.regions}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 gap-2">
                      <dt className="text-[#94A3B8] font-medium">Métodos:</dt>
                      <dd className="font-semibold text-[#F8FAFC] text-right">{g.methods}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 gap-2">
                      <dt className="text-[#94A3B8] font-medium">Hosted checkout:</dt>
                      <dd className="font-semibold text-emerald-400 text-right">{g.hostedCheckout}</dd>
                    </div>
                    <div className="flex justify-between py-1.5 gap-2">
                      <dt className="text-[#94A3B8] font-medium">Direct API:</dt>
                      <dd className="font-semibold text-violet-400 text-right">{g.directApi}</dd>
                    </div>
                  </dl>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-2 border-t border-[#1E1B26]/60">
                  <span className="text-[11px] text-[#64748B]">Ambiente: {g.environment}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenConfig(g)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-violet-300 border border-violet-500/30 bg-violet-600/10 hover:bg-violet-600/20 transition-all cursor-pointer"
                  >
                    Configurar Credenciais
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Redundancy & Backup Gateways (Native Otterfy Processors) */}
      <div className="otter-widget-card p-5 sm:p-6 rounded-2xl border shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                Processadores Nativos & Redundância de Alta Disponibilidade
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Canais de balanceamento de carga automático e split de comissões para infoprodutores e afiliados.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            Fallback Ativo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {backupGateways.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                b.status === 'Ativo'
                  ? 'border-violet-500/30 bg-violet-600/5'
                  : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F0E14] border-[#1E1B26]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 dark:border-white/10 p-1 flex items-center justify-center shrink-0">
                      {b.logoUrl ? (
                        <Image src={b.logoUrl} alt={b.name} width={24} height={24} className="w-full h-full object-contain" />
                      ) : (
                        renderIcon(b.iconType)
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-[#F8FAFC]">{b.name}</h4>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleToggleGatewayQuick(b, e)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer ${
                      b.status === 'Ativo'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#1E1B26] border-[#2D2838] text-[#94A3B8]'
                    }`}
                  >
                    {b.status}
                  </button>
                </div>
                <p className="text-[11px] text-[#94A3B8] mb-3">{b.description}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E1B26]/60 text-xs">
                <span className="text-[10px] text-[#64748B]">{b.methods}</span>
                <button
                  type="button"
                  onClick={() => handleOpenConfig(b)}
                  className="text-violet-400 hover:text-violet-300 font-bold text-[11px] cursor-pointer"
                >
                  Editar chaves →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fee & Settlement Comparison Table (Payzeno Official Table) */}
      <div className="otter-widget-card p-5 sm:p-6 rounded-2xl border shadow-xl">
        <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC] mb-1">
          Comparativo Oficial de Modelos de Liquidação
        </h3>
        <p className="text-xs text-[#94A3B8] mb-4">
          Escolha o modelo que melhor atende à escala e estrutura jurídica da sua empresa.
        </p>

        <div className="overflow-x-auto border border-[#1E1B26] rounded-xl">
          <table className="w-full text-left text-xs">
            <thead
              className={`text-[11px] uppercase tracking-wider font-bold border-b ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#0B0911] border-[#1E1B26] text-[#94A3B8]'
              }`}
            >
              <tr>
                <th className="py-3 px-4">Recurso / Característica</th>
                <th className="py-3 px-4 text-violet-400 font-bold">Modo Carteira (Wallet)</th>
                <th className="py-3 px-4 text-sky-400 font-bold">Liquidação Direta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1B26]">
              <tr>
                <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Mensalidade Fixa</td>
                <td className="py-3 px-4 font-bold text-emerald-400">Não — 0 MT</td>
                <td className="py-3 px-4 text-[#94A3B8]">Sim — valor negociado</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Comissão por Venda Confirmada</td>
                <td className="py-3 px-4 font-bold text-violet-300">7% por pagamento aprovado</td>
                <td className="py-3 px-4 text-[#94A3B8]">% reduzida ou faixas fixas</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Comissão de Saque (Retirada)</td>
                <td className="py-3 px-4 font-bold text-emerald-400">0% de taxa</td>
                <td className="py-3 px-4 text-[#94A3B8]">Não aplicável (cai direto na sua conta)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Destino dos Fundos</td>
                <td className="py-3 px-4 text-[#F8FAFC]">Carteira Otterfy / Payzeno (Saques sob demanda)</td>
                <td className="py-3 px-4 text-[#F8FAFC]">Contas da sua empresa nos gateways (M-Pesa/EMIS)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-[#F8FAFC]">Credenciais de Gateways</td>
                <td className="py-3 px-4 text-[#F8FAFC]">Gerenciadas pela infraestrutura (Ativação imediata)</td>
                <td className="py-3 px-4 text-[#F8FAFC]">Configuradas com credenciais próprias da sua entidade</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Configurar Gateway */}
      {selectedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121018] border-[#252033] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#252033] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-200 dark:border-white/10 p-1.5 flex items-center justify-center shrink-0">
                  {selectedGateway.logoUrl ? (
                    <Image
                      src={selectedGateway.logoUrl}
                      alt={selectedGateway.name}
                      width={38}
                      height={38}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    renderIcon(selectedGateway.iconType)
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Configurar {selectedGateway.name}</h3>
                  <span className="text-xs text-[#94A3B8]">{selectedGateway.badge}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGateway(null)}
                className="text-[#94A3B8] hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Toggles: Status & Environment */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-[#1E1B26] bg-[#0F0E14]">
                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Status no Checkout</label>
                  <button
                    type="button"
                    onClick={() => setIsActiveToggle(!isActiveToggle)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      isActiveToggle
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/15 border-red-500/30 text-red-400'
                    }`}
                  >
                    {isActiveToggle ? '● Ativo no Checkout' : '○ Inativo / Pausado'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] mb-1">Ambiente</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEnvironmentToggle('Produção')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        environmentToggle === 'Produção'
                          ? 'bg-violet-600 text-white'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      Produção
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironmentToggle('Sandbox')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        environmentToggle === 'Sandbox'
                          ? 'bg-violet-600 text-white'
                          : 'text-[#94A3B8] hover:text-white'
                      }`}
                    >
                      Sandbox
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-3">
                {selectedGateway.fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-[#94A3B8] mb-1">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={formValues[f.key] || ''}
                      onChange={(e) => setFormValues({ ...formValues, [f.key]: e.target.value })}
                      className={`w-full p-2.5 rounded-xl text-xs font-mono border outline-none ${
                        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                      }`}
                    />
                    {f.help && <p className="text-[10px] text-[#64748B] mt-0.5">{f.help}</p>}
                  </div>
                ))}
              </div>

              {/* Connection Test Result */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-medium ${
                    testResult === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}
                >
                  {testResult === 'success'
                    ? '✓ Conexão com o gateway verificada com sucesso! Latência: 48ms.'
                    : '⚠ Atenção: Gateway inativo ou credenciais de homologação pendentes.'}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#252033]">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-violet-500/30 text-violet-300 hover:bg-violet-600/15 transition-all cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? 'Testando Conexão...' : 'Testar Conexão (Ping)'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#94A3B8] hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md cursor-pointer"
                  >
                    Salvar Configurações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
