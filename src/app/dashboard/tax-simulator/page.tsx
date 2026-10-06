'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export default function TaxSimulatorPage() {
  const [saleAmount, setSaleAmount] = useState<number>(1000);
  const [method, setMethod] = useState<'mpesa' | 'emola' | 'card'>('mpesa');
  const [withdrawalAmount, setWithdrawalAmount] = useState<number>(1000);

  // Regras de taxa padrão de gateways em Moçambique
  const rates = {
    mpesa: { label: 'M-Pesa (Vodacom)', percent: 3.5, fixed: 0 },
    emola: { label: 'e-Mola (Movitel)', percent: 3.5, fixed: 0 },
    card: { label: 'Cartão de Crédito / Débito', percent: 4.5, fixed: 5 },
  };

  const otterfyFeePercent = 1.99; // Taxa padrão Otterfy
  const withdrawalFee = 15; // Taxa fixa de saque

  const calculation = useMemo(() => {
    const r = rates[method];
    const gatewayFee = (saleAmount * r.percent) / 100 + r.fixed;
    const platformFee = (saleAmount * otterfyFeePercent) / 100;
    const totalFees = gatewayFee + platformFee;
    const netAmount = Math.max(0, saleAmount - totalFees);
    const netPercent = saleAmount > 0 ? ((netAmount / saleAmount) * 100).toFixed(1) : '0';

    return {
      gatewayFee,
      platformFee,
      totalFees,
      netAmount,
      netPercent,
    };
  }, [saleAmount, method]);

  return (
    <div className="w-full max-w-6xl 2xl:max-w-[1800px] mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Ferramentas de Finanças
            </span>
            <span className="otter-sb-badge otter-sb-badge--soon">Calculadora Oficial</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Simulador de Taxas
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Simule o valor líquido exato que você receberá em cada venda na Otterfy por M-Pesa, e-Mola e Cartão.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-400 active:scale-95 transition-all w-fit"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Entrada */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-5">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Configurar Simulação de Venda
            </h2>

            {/* Input Valor da Venda */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Valor da Venda (MT)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-secondary)]">
                  MT
                </span>
                <input
                  type="number"
                  min="1"
                  step="10"
                  value={saleAmount}
                  onChange={(e) => setSaleAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-primary)] text-lg font-bold focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
                />
              </div>

              {/* Atalhos de valores */}
              <div className="flex gap-2 mt-2.5 flex-wrap">
                {[100, 250, 500, 1000, 2500, 5000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSaleAmount(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      saleAmount === v
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'border border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {v.toLocaleString()} MT
                  </button>
                ))}
              </div>
            </div>

            {/* Seleção do Meio de Pagamento */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                Método de Pagamento
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: 'mpesa', name: 'M-Pesa', rate: '3.5%' },
                    { id: 'emola', name: 'e-Mola', rate: '3.5%' },
                    { id: 'card', name: 'Cartão', rate: '4.5% + 5MT' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      method === opt.id
                        ? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/15'
                        : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <p className={`text-sm font-bold ${method === opt.id ? 'text-violet-600 dark:text-violet-400' : 'text-[var(--text-primary)]'}`}>
                      {opt.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Taxa: {opt.rate}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card Saque */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-6 space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Simulador de Saque
            </h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Taxa fixa de transferência bancária/mobile:</span>
              <span className="font-bold text-[var(--text-primary)]">15,00 MT</span>
            </div>
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-primary)]">Ao sacar 1.000 MT você recebe:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">985,00 MT</span>
            </div>
          </div>
        </div>

        {/* Painel de Resultados */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/10 p-6 space-y-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">
                Você receberá líquido
              </p>
              <p className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {calculation.netAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Aproximadamente {calculation.netPercent}% do valor bruto da venda.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--border-color)] text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Valor Bruto:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {saleAmount.toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} MT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Taxa Gateway ({rates[method].label}):</span>
                <span className="font-semibold text-rose-500">
                  - {calculation.gatewayFee.toFixed(2)} MT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Taxa Otterfy ({otterfyFeePercent}%):</span>
                <span className="font-semibold text-rose-500">
                  - {calculation.platformFee.toFixed(2)} MT
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border-color)] font-bold">
                <span className="text-[var(--text-primary)]">Total em Taxas:</span>
                <span className="text-rose-500">
                  - {calculation.totalFees.toFixed(2)} MT
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-secondary)] leading-relaxed">
            💡 <strong className="text-[var(--text-primary)]">Transparência Otterfy:</strong> As taxas são calculadas e descontadas automaticamente no momento da aprovação do pedido. Seu saldo fica disponível para saque de acordo com os termos de liberação da sua conta.
          </div>
        </div>
      </div>
    </div>
  );
}
