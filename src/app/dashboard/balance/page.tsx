'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatMZN } from '@/lib/utils';
import PaymentMethodBadge, { PaymentMethodOptionCard } from '@/components/ui/PaymentMethodBadge';

interface BalanceData {
  grossRevenue: number;
  platformFeeRate: number;
  totalPlatformFee: number;
  netRevenue: number;
  availableBalance: number;
  pendingEscrow: number;
  totalWithdrawn: number;
  withdrawalFeeRate: number;
  settlementMode: 'WALLET' | 'DIRECT';
}

interface WithdrawalRecord {
  id: string;
  recipientName: string;
  method: 'MPESA' | 'EMOLA' | 'BANK';
  destination: string;
  bankName?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  submittedAt: string;
  processedAt?: string;
  reference: string;
}

interface PayoutAccount {
  id: string;
  type: 'MPESA' | 'EMOLA' | 'BANK';
  holderName: string;
  identifier: string;
  bankName?: string;
  isDefault: boolean;
}

interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  type: 'SALE' | 'FEE' | 'WITHDRAWAL' | 'REFUND';
  description: string;
  method: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  amount: number;
  isCredit: boolean;
}

const MOZ_BANKS = [
  'Millennium BIM',
  'BCI (Banco Comercial e de Investimentos)',
  'Standard Bank Moçambique',
  'Moza Banco',
  'Absa Bank Moçambique',
  'Nedbank Moçambique',
  'First Capital Bank',
  'Ecobank Moçambique',
];

export default function BalancePage() {
  const [balance, setBalance] = useState<BalanceData>({
    grossRevenue: 0,
    platformFeeRate: 7,
    totalPlatformFee: 0,
    netRevenue: 0,
    availableBalance: 0,
    pendingEscrow: 0,
    totalWithdrawn: 0,
    withdrawalFeeRate: 0,
    settlementMode: 'WALLET',
  });

  const [settlementMode, setSettlementMode] = useState<'WALLET' | 'DIRECT'>('WALLET');
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<WithdrawalRecord | null>(null);

  // Filter state for ledger
  const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'WITHDRAWAL' | 'FEE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Withdrawal form state
  const [withdrawMethod, setWithdrawMethod] = useState<'MPESA' | 'EMOLA' | 'BANK'>('MPESA');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState(MOZ_BANKS[0]);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // New account form state
  const [newAccType, setNewAccType] = useState<'MPESA' | 'EMOLA' | 'BANK'>('MPESA');
  const [newAccHolder, setNewAccHolder] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccBank, setNewAccBank] = useState(MOZ_BANKS[0]);

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

  // Load balance data from API
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/withdrawals', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.balance) setBalance(json.balance);
        if (json.withdrawals) setWithdrawals(json.withdrawals);
        if (json.accounts) {
          setAccounts(json.accounts);
          // Set default recipient and phone from default account
          const def = json.accounts.find((a: PayoutAccount) => a.isDefault) || json.accounts[0];
          if (def) {
            setWithdrawRecipient(def.holderName);
            setWithdrawDestination(def.identifier);
            setWithdrawMethod(def.type);
            if (def.bankName) setWithdrawBankName(def.bankName);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar saldo e saques:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Build ledger entries from withdrawals and simulated sales fees
  const ledgerEntries: LedgerEntry[] = useMemo(() => {
    const list: LedgerEntry[] = [];

    // Withdrawals entries
    withdrawals.forEach((w) => {
      list.push({
        id: w.id,
        date: w.submittedAt,
        reference: w.reference,
        type: 'WITHDRAWAL',
        description: `Saque ${w.method === 'BANK' ? `(${w.bankName})` : w.method} para ${w.destination}`,
        method: w.method,
        status: w.status,
        amount: w.amount,
        isCredit: false,
      });
    });

    // Mock sales ledger items matching approved volume
    if (balance.grossRevenue > 0) {
      list.push({
        id: 'sale-recent-1',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        reference: 'ORD-MP-84192',
        type: 'SALE',
        description: 'Venda Aprovada Checkout - M-Pesa STK Push',
        method: 'MPESA',
        status: 'COMPLETED',
        amount: Math.round(balance.grossRevenue * 0.4),
        isCredit: true,
      });
      list.push({
        id: 'fee-recent-1',
        date: new Date(Date.now() - 3600000 * 2).toISOString(),
        reference: 'FEE-OTF-84192',
        type: 'FEE',
        description: 'Comissão Payzeno / Otterfy (7%) sobre venda confirmada',
        method: 'INTERNAL',
        status: 'COMPLETED',
        amount: Math.round(balance.grossRevenue * 0.4 * 0.07),
        isCredit: false,
      });

      list.push({
        id: 'sale-recent-2',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'ORD-EM-32910',
        type: 'SALE',
        description: 'Venda Aprovada Checkout - e-Mola Direct API',
        method: 'EMOLA',
        status: 'COMPLETED',
        amount: Math.round(balance.grossRevenue * 0.35),
        isCredit: true,
      });
      list.push({
        id: 'fee-recent-2',
        date: new Date(Date.now() - 86400000).toISOString(),
        reference: 'FEE-OTF-32910',
        type: 'FEE',
        description: 'Comissão Payzeno / Otterfy (7%) sobre venda confirmada',
        method: 'INTERNAL',
        status: 'COMPLETED',
        amount: Math.round(balance.grossRevenue * 0.35 * 0.07),
        isCredit: false,
      });
    }

    // Sort by date descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [withdrawals, balance.grossRevenue]);

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    return ledgerEntries.filter((item) => {
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchSearch =
        searchQuery === '' ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchSearch;
    });
  }, [ledgerEntries, filterType, searchQuery]);

  // Handle submit withdrawal
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(withdrawAmount);
    if (!num || num < 50) {
      showToast('O montante mínimo de saque é 50 MZN.');
      return;
    }
    if (num > balance.availableBalance) {
      showToast(`Saldo insuficiente. Disponível: ${formatMZN(balance.availableBalance)}`);
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: withdrawMethod,
          destination: withdrawDestination,
          bankName: withdrawMethod === 'BANK' ? withdrawBankName : undefined,
          amount: num,
          recipientName: withdrawRecipient || 'Conta Padrão',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        showToast(json.error || 'Erro ao processar saque.');
      } else {
        showToast(json.message || 'Saque solicitado com sucesso!');
        setWithdrawModalOpen(false);
        setWithdrawAmount('');
        await loadData();
      }
    } catch {
      showToast('Falha na comunicação com o servidor.');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Handle save new account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccHolder || !newAccNumber) {
      showToast('Preencha o titular e número da conta.');
      return;
    }

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_account',
          type: newAccType,
          holderName: newAccHolder,
          identifier: newAccNumber,
          bankName: newAccType === 'BANK' ? newAccBank : undefined,
          isDefault: accounts.length === 0,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        showToast('Conta cadastrada com sucesso!');
        setAccountModalOpen(false);
        setNewAccHolder('');
        setNewAccNumber('');
        await loadData();
      } else {
        showToast(json.error || 'Erro ao cadastrar conta.');
      }
    } catch {
      showToast('Erro de conexão ao salvar conta.');
    }
  };

  // Export CSV
  const exportLedgerCSV = () => {
    const headers = ['Data', 'Referencia', 'Tipo', 'Descricao', 'Metodo', 'Status', 'Valor (MZN)'];
    const rows = filteredLedger.map((l) => [
      new Date(l.date).toLocaleString('pt-MZ'),
      l.reference,
      l.type,
      `"${l.description.replace(/"/g, '""')}"`,
      l.method,
      l.status,
      `${l.isCredit ? '+' : '-'}${l.amount}`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_otterfy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Extrato CSV exportado com sucesso!');
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

      {/* Top Header: Title, Settlement mode switcher & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl otter-widget-card border shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tight">
              Saldo & Carteira
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20">
              {settlementMode === 'WALLET' ? 'Modo Carteira (Wallet)' : 'Liquidação Direta'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            {settlementMode === 'WALLET'
              ? 'Recebimento na Carteira Otterfy / Payzeno • 7% por venda aprovada • Saques com 0% de comissão'
              : 'Liquidação direta nas contas da sua empresa nos gateways • Faturamento mensal negociado'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher Tabs */}
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
              Carteira (Wallet)
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

          {/* Request Withdrawal Button */}
          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all cursor-pointer shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Solicitar Saque</span>
          </button>
        </div>
      </div>

      {/* 4 Balance Overview Cards (Exact reverse engineering of Payzeno metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Saldo Disponível */}
        <div className="otter-stat-card otter-stat-card--emerald otter-keep-colors p-5 sm:p-6 rounded-2xl min-h-[160px] flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[13px] font-medium text-white/95 tracking-tight">
              Saldo Disponível
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
              0% taxa de saque
            </span>
          </div>

          <div className="my-2">
            <span className="text-3xl sm:text-[32px] font-bold text-white tracking-tight leading-none font-mono">
              {formatMZN(balance.availableBalance)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>Disponível para saque imediato</span>
            <span className="font-semibold text-white">M-Pesa / e-Mola / Banco</span>
          </div>
        </div>

        {/* Card 2: Saldo a Liberar (Pending Escrow) */}
        <div className="otter-stat-card otter-stat-card--amber otter-keep-colors p-5 sm:p-6 rounded-2xl min-h-[160px] flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[13px] font-medium text-white/95 tracking-tight">
              Saldo a Liberar
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
              Em processamento
            </span>
          </div>

          <div className="my-2">
            <span className="text-3xl sm:text-[32px] font-bold text-white tracking-tight leading-none font-mono">
              {formatMZN(balance.pendingEscrow)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80 pt-1">
            <span>Vendas em compensação (D+1)</span>
            <span className="font-semibold text-white">Próximo ciclo</span>
          </div>
        </div>

        {/* Card 3: Total Sacado */}
        <div className={`otter-widget-card p-5 sm:p-6 rounded-2xl min-h-[160px] flex flex-col justify-between shadow-lg border ${
          isLight ? 'border-slate-200 bg-white' : 'border-[#1E1B26]'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <span className={`text-[13px] font-medium tracking-tight ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              Total Sacado
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <span className={`text-3xl sm:text-[32px] font-bold tracking-tight leading-none font-mono ${isLight ? 'text-slate-900' : 'text-[#F8FAFC]'}`}>
              {formatMZN(balance.totalWithdrawn)}
            </span>
          </div>

          <div className={`flex items-center justify-between text-[11px] pt-1 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
            <span>Retiradas liquidadas com sucesso</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% pagas</span>
          </div>
        </div>

        {/* Card 4: Faturamento Líquido */}
        <div className={`otter-widget-card p-5 sm:p-6 rounded-2xl min-h-[160px] flex flex-col justify-between shadow-lg border ${
          isLight ? 'border-slate-200 bg-white' : 'border-[#1E1B26]'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <span className={`text-[13px] font-medium tracking-tight ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
              Faturamento Líquido
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div className="my-2">
            <span className={`text-3xl sm:text-[32px] font-bold tracking-tight leading-none font-mono ${isLight ? 'text-slate-900' : 'text-[#F8FAFC]'}`}>
              {formatMZN(balance.netRevenue)}
            </span>
          </div>

          <div className={`flex items-center justify-between text-[11px] pt-1 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>
            <span>Após taxa da plataforma (7%)</span>
            <span className="font-semibold text-violet-600 dark:text-violet-400 font-mono">Bruto: {formatMZN(balance.grossRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Visual Fee Journey Flow (Payzeno's 4 Practical Steps) */}
      <div className="otter-widget-card p-5 sm:p-6 rounded-2xl border shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 mb-1">
              Transparência de Taxas • Modelo Carteira
            </span>
            <h3 className={`text-base sm:text-lg font-bold ${isLight ? 'text-slate-900' : 'text-[#F8FAFC]'}`}>
              Como funciona o fluxo do dinheiro na sua carteira
            </h3>
          </div>
          <Link
            href="/dashboard/gateways"
            className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-semibold flex items-center gap-1"
          >
            Ver gateways suportados →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>Pagamento Confirmado</span>
            </div>
            <div className="my-1">
              <span className={`text-xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-[#F8FAFC]'}`}>1 000 MZN</span>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Cliente paga no checkout via M-Pesa, e-Mola ou Cartão.</p>
          </div>

          {/* Step 2 */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-red-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>Taxa da Plataforma (7%)</span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold font-mono text-red-600 dark:text-red-400">- 70 MZN</span>
            </div>
            <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-[#94A3B8]'}`}>Cobrada unicamente sobre pagamentos aprovados. Sem mensalidade.</p>
          </div>

          {/* Step 3 */}
          <div
            className={`p-4 rounded-xl border border-violet-500/30 flex flex-col justify-between ${
              isLight ? 'bg-violet-50/50' : 'bg-violet-950/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-xs font-semibold text-violet-400">Saldo Disponível</span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold font-mono text-violet-300">930 MZN</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Líquido adicionado à sua carteira, pronto para solicitação de saque.</p>
          </div>

          {/* Step 4 */}
          <div
            className={`p-4 rounded-xl border border-emerald-500/30 flex flex-col justify-between ${
              isLight ? 'bg-emerald-50/50' : 'bg-emerald-950/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                4
              </span>
              <span className="text-xs font-semibold text-emerald-400">Saque (0% Comissão)</span>
            </div>
            <div className="my-1">
              <span className="text-xl font-bold font-mono text-emerald-400">930 MZN</span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-1">Cai 100% limpo na sua conta bancária ou M-Pesa. Taxa de saque: 0 MT.</p>
          </div>
        </div>
      </div>

      {/* Contas Cadastradas para Recebimento */}
      <div className="otter-widget-card p-5 sm:p-6 rounded-2xl border shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Contas & Carteiras de Saque Cadastradas
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Gerencie suas carteiras M-Pesa, e-Mola e contas bancárias moçambicanas de destino.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAccountModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-violet-500/30 bg-violet-600/10 text-violet-700 dark:text-violet-300 hover:bg-violet-600/20 transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>+ Adicionar Conta de Saque</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 relative ${
                acc.isDefault
                  ? 'border-violet-500/50 bg-violet-600/5'
                  : isLight
                    ? 'bg-white border-slate-200'
                    : 'bg-[#0F0E14] border-[#1E1B26]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-slate-200/90 dark:border-white/10 p-1.5 flex items-center justify-center shrink-0">
                    {acc.type === 'MPESA' ? (
                      <Image src="/gateways/mpesa.svg" alt="M-Pesa" width={32} height={32} className="w-full h-full object-contain" />
                    ) : acc.type === 'EMOLA' ? (
                      <Image src="/gateways/emola.svg" alt="e-Mola" width={32} height={32} className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">{acc.holderName}</h4>
                    <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                      {acc.type === 'BANK' ? acc.bankName : acc.type === 'MPESA' ? 'Vodacom M-Pesa' : 'Movitel e-Mola'}
                    </span>
                  </div>
                </div>
                {acc.isDefault && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Padrão
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-[#F8FAFC]">
                <span>{acc.identifier}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">0% Taxa</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extrato Financeiro & Histórico de Movimentações */}
      <div className="otter-widget-card p-5 sm:p-6 rounded-2xl border shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Extrato Financeiro e Movimentações
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Histórico detalhado de vendas aprovadas, taxas e saques liquidados.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por referência..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`px-3 py-1.5 pl-8 rounded-xl text-xs border outline-none focus:border-violet-500 transition-colors ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                }`}
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Tabs */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-medium ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0F0E14] border-[#1E1B26]'
              }`}
            >
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'ALL' ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterType('WITHDRAWAL')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'WITHDRAWAL' ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white'
                }`}
              >
                Saques
              </button>
              <button
                type="button"
                onClick={() => setFilterType('SALE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'SALE' ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white'
                }`}
              >
                Vendas (+)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('FEE')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'FEE' ? 'bg-violet-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white'
                }`}
              >
                Taxas (7%)
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={exportLedgerCSV}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  : 'bg-[#0F0E14] border-[#1E1B26] hover:bg-[#16131E] text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`text-[11px] uppercase tracking-wider font-bold border-b ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0B0911] border-[#1E1B26] text-[#64748B]'
            }`}>
              <tr>
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Referência</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#1E1B26]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-[#94A3B8]">
                    Nenhuma movimentação encontrada para este filtro.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-[#16131E]/60'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-[#94A3B8]">
                      {new Date(item.date).toLocaleString('pt-MZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {item.reference}
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-[#F8FAFC]">
                      {item.description}
                    </td>
                    <td className="py-3 px-4">
                      <PaymentMethodBadge method={item.method} size="xs" />
                    </td>
                    <td className="py-3 px-4">
                      {item.status === 'COMPLETED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          Concluído
                        </span>
                      ) : item.status === 'PENDING' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                          Pendente
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25">
                          Recusado
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold text-sm ${
                        item.isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {item.isCredit ? '+' : '-'} {formatMZN(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.type === 'WITHDRAWAL' && (
                        <button
                          type="button"
                          onClick={() => {
                            const rec = withdrawals.find((w) => w.id === item.id);
                            if (rec) setSelectedReceipt(rec);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-600/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-600/20 transition-all cursor-pointer"
                        >
                          Recibo
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Solicitar Saque */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121018] border-[#252033] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#252033] mb-5">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-2xl bg-violet-600/20 border border-violet-500/30 text-violet-500 dark:text-violet-400 flex items-center justify-center font-bold text-sm">
                  $
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">Solicitar Saque</h3>
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">0% de comissão de retirada • Transferência segura</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-white text-sm font-bold flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-2 uppercase tracking-wide">
                  Selecione o Canal de Saque
                </label>
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                  <PaymentMethodOptionCard
                    method="MPESA"
                    selected={withdrawMethod === 'MPESA'}
                    onSelect={() => setWithdrawMethod('MPESA')}
                    prefixHelper="Instantâneo (0% taxa)"
                    layout="vertical"
                  />

                  <PaymentMethodOptionCard
                    method="EMOLA"
                    selected={withdrawMethod === 'EMOLA'}
                    onSelect={() => setWithdrawMethod('EMOLA')}
                    prefixHelper="Instantâneo (0% taxa)"
                    layout="vertical"
                  />

                  <PaymentMethodOptionCard
                    method="BANK"
                    selected={withdrawMethod === 'BANK'}
                    onSelect={() => setWithdrawMethod('BANK')}
                    prefixHelper="Até 2h (Bancos MZ)"
                    layout="vertical"
                  />
                </div>
              </div>

              {/* Bank Selector if method is BANK */}
              {withdrawMethod === 'BANK' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1.5">Banco de Moçambique</label>
                  <select
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium transition-all ${
                      isLight ? 'bg-white border-slate-200 text-slate-900 focus:border-violet-500' : 'bg-[#0F0E14] border-[#1E1B26] text-white focus:border-violet-500'
                    }`}
                  >
                    {MOZ_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Titular e Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1.5">Nome do Titular</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo cadastrado"
                    value={withdrawRecipient}
                    onChange={(e) => setWithdrawRecipient(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isLight ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500' : 'bg-[#0F0E14] border-[#1E1B26] text-white placeholder:text-slate-600 focus:border-violet-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1.5">
                    {withdrawMethod === 'BANK' ? 'NIB / Conta Bancária' : 'Número de Telefone (+258)'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={withdrawMethod === 'BANK' ? '0001 0000 xxxx xxxx x' : '84 / 85 / 86 / 87 ...'}
                    value={withdrawDestination}
                    onChange={(e) => setWithdrawDestination(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none transition-all ${
                      isLight ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-violet-500' : 'bg-[#0F0E14] border-[#1E1B26] text-white placeholder:text-slate-600 focus:border-violet-500'
                    }`}
                  />
                </div>
              </div>

              {/* Montante com botão Max */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-[#94A3B8]">Montante a Sacar (MZN)</label>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(`${balance.availableBalance}`)}
                    className="text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 cursor-pointer"
                  >
                    Sacar Tudo ({formatMZN(balance.availableBalance)})
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    step="1"
                    required
                    placeholder="Ex: 5000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className={`w-full p-3 rounded-xl text-base font-mono font-bold border outline-none ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                    }`}
                  />
                  <span className="absolute right-3 top-3.5 text-xs text-slate-400 dark:text-[#94A3B8] font-bold">MZN</span>
                </div>
              </div>

              {/* Resumo do Saque */}
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0B0911] border-[#1E1B26]'
                }`}
              >
                <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                  <span>Taxa de Retirada Otterfy:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">0% (0,00 MT)</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                  <span>Valor Líquido a Receber:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    {formatMZN(Number(withdrawAmount) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                  <span>Prazo Estimado:</span>
                  <span className="font-bold text-violet-600 dark:text-violet-300">
                    {withdrawMethod === 'BANK' ? 'Até 2 horas' : 'Instantâneo'}
                  </span>
                </div>
              </div>

              {/* Botão de Envio */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWithdraw ? 'Processando Saque...' : 'Confirmar Saque Imediato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Conta */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121018] border-[#252033] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#252033] mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Cadastrar Conta de Saque</h3>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1">Tipo de Conta</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['MPESA', 'EMOLA', 'BANK'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAccType(t)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        newAccType === t
                          ? 'border-violet-500 bg-violet-600/20 text-violet-700 dark:text-white'
                          : isLight
                            ? 'border-slate-200 bg-slate-50 text-slate-700'
                            : 'border-[#1E1B26] bg-[#0F0E14] text-[#94A3B8]'
                      }`}
                    >
                      {t === 'MPESA' ? 'M-Pesa' : t === 'EMOLA' ? 'e-Mola' : 'Banco'}
                    </button>
                  ))}
                </div>
              </div>

              {newAccType === 'BANK' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1">Banco</label>
                  <select
                    value={newAccBank}
                    onChange={(e) => setNewAccBank(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                    }`}
                  >
                    {MOZ_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1">Nome do Titular</label>
                <input
                  type="text"
                  required
                  placeholder="Nome completo registrado"
                  value={newAccHolder}
                  onChange={(e) => setNewAccHolder(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-[#94A3B8] mb-1">
                  {newAccType === 'BANK' ? 'NIB / IBAN' : 'Número de Telefone'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={newAccType === 'BANK' ? '0001 0000 1234 ...' : '+258 84 ...'}
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0F0E14] border-[#1E1B26] text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 shadow-md cursor-pointer"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Recibo de Saque */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121018] border-[#252033] text-white'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#252033] mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Comprovante de Saque Oficial
              </span>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 border-b border-slate-200 dark:border-[#252033] space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-xs border-2 border-slate-200 p-2 flex items-center justify-center">
                {selectedReceipt.method === 'MPESA' ? (
                  <Image src="/gateways/mpesa.svg" alt="M-Pesa" width={48} height={48} className="w-full h-full object-contain" />
                ) : selectedReceipt.method === 'EMOLA' ? (
                  <Image src="/gateways/emola.svg" alt="e-Mola" width={48} height={48} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z" />
                  </svg>
                )}
              </div>
              <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatMZN(selectedReceipt.amount)}
              </span>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Transferência concluída com 0% de comissão</p>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Código de Referência:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedReceipt.reference}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Destinatário:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedReceipt.recipientName}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Canal / Método:</span>
                <span className="font-semibold text-violet-600 dark:text-violet-300">
                  {selectedReceipt.method === 'BANK' ? selectedReceipt.bankName : selectedReceipt.method}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Conta de Destino:</span>
                <span className="font-mono text-slate-900 dark:text-white">{selectedReceipt.destination}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Data de Processamento:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {new Date(selectedReceipt.submittedAt).toLocaleString('pt-MZ')}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-[#94A3B8]">
                <span>Status da Liquidação:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">LIQUIDADO</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white cursor-pointer shadow-md"
              >
                Fechar Comprovante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
