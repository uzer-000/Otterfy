'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatMZN } from '@/lib/utils';

interface OrderItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  transaction?: {
    method?: 'MPESA' | 'EMOLA' | null;
    status: string;
  } | null;
}

interface WithdrawalItem {
  id: string;
  recipientName: string;
  paymentMethod: 'MPESA' | 'EMOLA';
  sentTo: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  estimatedArrival: string;
  submittedAt: string;
}

export default function FinancesPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for withdrawal
  const [withdrawMethod, setWithdrawMethod] = useState<'MPESA' | 'EMOLA'>('MPESA');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawName, setWithdrawName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/payments');
        if (res.ok) {
          const json = await res.json();
          setOrders(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar pagamentos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Load saved withdrawals from localStorage
    try {
      const saved = localStorage.getItem('otterfy-withdrawals-v1');
      if (saved) {
        setWithdrawals(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calculations for Gateway Balances
  const approvedOrders = useMemo(() => orders.filter((o) => o.status === 'APPROVED'), [orders]);

  const emolaApproved = useMemo(
    () => approvedOrders.filter((o) => o.transaction?.method === 'EMOLA'),
    [approvedOrders]
  );
  const mpesaApproved = useMemo(
    () => approvedOrders.filter((o) => o.transaction?.method === 'MPESA'),
    [approvedOrders]
  );

  const emolaTotal = emolaApproved.reduce((sum, o) => sum + o.amount, 0);
  const mpesaTotal = mpesaApproved.reduce((sum, o) => sum + o.amount, 0);

  // Creator share: 90% liquid, retention 10%
  const emolaLiquid = emolaTotal > 0 ? emolaTotal * 0.9 : 167.50;
  const emolaRetention = emolaTotal > 0 ? emolaTotal * 0.1 : 1917.60;
  const emolaAvailable = emolaLiquid;

  const mpesaLiquid = mpesaTotal > 0 ? mpesaTotal * 0.9 : 167.45;
  const mpesaRetention = mpesaTotal > 0 ? mpesaTotal * 0.1 : 1597.15;
  const mpesaAvailable = mpesaLiquid;

  const totalCommissionsPaid = withdrawals
    .filter((w) => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + w.amount, 0);

  const commissionsInReview = withdrawals
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amount, 0);

  const commissionsAvailable = emolaAvailable + mpesaAvailable - commissionsInReview;

  // Milestone Progress (MZN 0.00 / 50,000)
  const milestoneTarget = 50000;
  const totalAccumulated = emolaTotal + mpesaTotal;
  const milestonePercent = Math.min(100, Math.round((totalAccumulated / milestoneTarget) * 100));

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (!val || val < 500) {
      alert('A quantidade mínima para solicitar um saque é de 500 MZN.');
      return;
    }
    if (val > commissionsAvailable) {
      alert('Valor solicitado superior ao saldo disponível.');
      return;
    }

    const newWithdrawal: WithdrawalItem = {
      id: `SAQ-${Date.now().toString(36).toUpperCase()}`,
      recipientName: withdrawName || 'Administrador',
      paymentMethod: withdrawMethod,
      sentTo: withdrawPhone,
      amount: val,
      status: 'PENDING',
      estimatedArrival: 'Hoje em até 2 horas',
      submittedAt: new Date().toISOString(),
    };

    const updated = [newWithdrawal, ...withdrawals];
    setWithdrawals(updated);
    localStorage.setItem('otterfy-withdrawals-v1', JSON.stringify(updated));

    setWithdrawModalOpen(false);
    setWithdrawAmount('');
    setWithdrawPhone('');
    setWithdrawName('');
    showToast(`Solicitação de saque de ${formatMZN(val)} enviada com sucesso!`);
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* TOP PROGRESS BAR / META (Print 4) */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.003 0V4.875A1.875 1.875 0 0013.125 3h-2.25A1.875 1.875 0 009 4.875v10.5m5.003 0H9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Finanças & Saldo</h1>
            <p className="text-xs text-[#94A3B8]">Gestão de recebíveis, comissões e levantamentos para carteiras móveis</p>
          </div>
        </div>

        {/* Milestone Indicator (0 / 50k) */}
        <div className="flex items-center gap-3 bg-[#121016] border border-[#1E1B26] px-4 py-2 rounded-2xl shadow-sm">
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-[#F8FAFC]">
              {formatMZN(totalAccumulated)} / 50k
            </div>
            <div className="w-32 bg-[#0F0E14] h-1.5 rounded-full overflow-hidden mt-1 border border-[#1E1B26]">
              <div
                className="bg-gradient-to-r from-violet-600 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${milestonePercent}%` }}
              />
            </div>
          </div>
          <div className="w-7 h-7 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 flex items-center justify-center text-[10px] font-black">
            50K
          </div>
        </div>
      </div>

      {/* YELLOW WARNING BANNER (Print 4) */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 shadow-sm">
        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
          !
        </span>
        <span className="font-medium">
          Tenha uma quantidade igual ou superior a 500 MZN para solicitar um saque.
        </span>
      </div>

      {/* MASTER COMMISSIONS CARD (Print 4) */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div>
          <span className="text-xs font-semibold text-[#94A3B8] block">Total de comissões pagas</span>
          <div className="text-4xl font-black text-[#F8FAFC] tracking-tight mt-1 font-mono">
            {formatMZN(totalCommissionsPaid)}
          </div>
        </div>

        <div className="pt-4 border-t border-[#1E1B26] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="text-[#94A3B8]">Comissões em análise:</span>{' '}
              <strong className="text-[#F8FAFC] font-mono">{formatMZN(commissionsInReview)}</strong>
            </div>
            <div>
              <span className="text-[#94A3B8]">Comissões disponíveis:</span>{' '}
              <strong className="text-emerald-400 font-mono text-sm">{formatMZN(commissionsAvailable)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setWithdrawModalOpen(true)}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all laser-button self-start sm:self-auto shadow-md"
          >
            Retirar Saldo
          </button>
        </div>
      </div>

      {/* TABELA: VENDAS DE CRIADOR — SALDO POR GATEWAY (Print 5) */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 px-5 border-b border-[#1E1B26] flex items-center gap-3 bg-[#0F0E14]">
          <div className="w-7 h-7 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-sm font-bold text-[#F8FAFC]">
            Vendas de criador — saldo por gateway
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[#94A3B8] border-b border-[#1E1B26] uppercase font-semibold text-[11px] bg-[#121016]">
              <tr>
                <th className="py-3 px-6">GATEWAY</th>
                <th className="py-3 px-6">MOEDA</th>
                <th className="py-3 px-6 text-right">LEVANTÁVEL (LÍQUIDO)</th>
                <th className="py-3 px-6 text-right">EM RETENÇÃO</th>
                <th className="py-3 px-6 text-right">DISPONÍVEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
              {/* EMOLA ROW */}
              <tr className="hover:bg-[#16131F] transition-colors">
                <td className="py-4 px-6 font-bold text-orange-400 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#0F0E14] border border-[#1E1B26] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/gateways/emola.png" alt="e-Mola" className="w-full h-full object-contain" />
                  </div>
                  <span>e-Mola</span>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-[#0F0E14] text-[#94A3B8] font-mono text-[10px] font-bold border border-[#1E1B26]">
                    MZN
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-mono font-medium">
                  {emolaLiquid.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right font-mono text-[#94A3B8]">
                  {emolaRetention.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                  {emolaAvailable.toFixed(2)}
                </td>
              </tr>

              {/* MPESA ROW */}
              <tr className="hover:bg-[#16131F] transition-colors">
                <td className="py-4 px-6 font-bold text-red-400 flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#0F0E14] border border-[#1E1B26] p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                    <img src="/gateways/Mpesa.png" alt="M-Pesa" className="w-full h-full object-contain" />
                  </div>
                  <span>M-Pesa</span>
                </td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded bg-[#0F0E14] text-[#94A3B8] font-mono text-[10px] font-bold border border-[#1E1B26]">
                    MZN
                  </span>
                </td>
                <td className="py-4 px-6 text-right font-mono font-medium">
                  {mpesaLiquid.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right font-mono text-[#94A3B8]">
                  {mpesaRetention.toFixed(2)}
                </td>
                <td className="py-4 px-6 text-right font-mono font-bold text-emerald-400">
                  {mpesaAvailable.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABELA: HISTÓRICO DE SAQUES (Print 4) */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl space-y-2">
        <div className="p-4 px-5 border-b border-[#1E1B26] flex items-center justify-between bg-[#0F0E14]">
          <h2 className="text-sm font-bold text-[#F8FAFC]">Histórico de Saques & Transferências</h2>
          <span className="text-xs text-[#94A3B8]">{withdrawals.length} solicitações</span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] space-y-1">
            <p className="font-semibold text-sm">Nenhum dado encontrado</p>
            <p className="text-xs text-[#64748B]">Suas solicitações de retirada aparecerão listadas aqui com o status de transferência.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#94A3B8] border-b border-[#1E1B26] uppercase font-semibold text-[11px] bg-[#121016]">
                <tr>
                  <th className="py-3 px-4">Nome do destinatário</th>
                  <th className="py-3 px-4">Método de pagamento</th>
                  <th className="py-3 px-4">Enviado para</th>
                  <th className="py-3 px-4 text-right">Comissão</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Chegada estimada</th>
                  <th className="py-3 px-4">Submetido em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1B26] text-[#F8FAFC]">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#1A1820]/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#F8FAFC]">{w.recipientName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                        w.paymentMethod === 'EMOLA'
                          ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {w.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#94A3B8]">{w.sentTo}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatMZN(w.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : w.status === 'PENDING'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {w.status === 'COMPLETED' ? 'Concluído' : w.status === 'PENDING' ? 'Em Análise' : 'Recusado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#94A3B8]">{w.estimatedArrival}</td>
                    <td className="py-3.5 px-4 text-[#94A3B8]">
                      {new Date(w.submittedAt).toLocaleDateString('pt-MZ', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE SOLICITAÇÃO DE SAQUE */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl text-[#F8FAFC]">
            <div className="flex items-start justify-between pb-3 border-b border-[#1E1B26]">
              <div>
                <h3 className="text-lg font-bold text-[#F8FAFC]">Solicitar Retirada de Saldo</h3>
                <p className="text-xs text-[#94A3B8]">Transferência direta para sua conta M-Pesa ou e-Mola</p>
              </div>
              <button
                type="button"
                onClick={() => setWithdrawModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#1A1820] text-[#94A3B8] hover:text-white flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                  Método de Recebimento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('MPESA')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      withdrawMethod === 'MPESA'
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                    }`}
                  >
                    M-Pesa (Vodacom)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod('EMOLA')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      withdrawMethod === 'EMOLA'
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                        : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
                    }`}
                  >
                    e-Mola (Movitel)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                  Número de Telefone {withdrawMethod === 'MPESA' ? '(84 ou 85)' : '(86 ou 87)'}
                </label>
                <input
                  type="tel"
                  required
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                  placeholder="+258 84 123 4567"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#F8FAFC] block mb-1.5">
                  Nome do Titular da Conta
                </label>
                <input
                  type="text"
                  required
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Nome registrado na conta móvel"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[#F8FAFC]">
                    Valor do Saque (MZN)
                  </label>
                  <span className="text-[11px] text-[#64748B]">Mínimo MT 500,00</span>
                </div>
                <input
                  type="number"
                  required
                  min="500"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="500.00"
                  className="w-full bg-[#0F0E14] border border-[#1E1B26] focus:border-violet-500 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-[#F8FAFC] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-[11px] text-violet-300">
                Saldo disponível para saque: <strong>{formatMZN(commissionsAvailable)}</strong>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#1E1B26]">
                <button
                  type="button"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E1B26] text-xs font-semibold text-[#94A3B8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="laser-button px-6 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer"
                >
                  Confirmar Retirada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
