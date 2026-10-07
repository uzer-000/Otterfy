'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

interface Transaction {
  id: string;
  reference: string;
  amount: number;
  status: string;
  productName: string;
  date: string;
}

interface CensoredTransactionsTableProps {
  transactions: Transaction[];
}

export default function CensoredTransactionsTable({ transactions }: CensoredTransactionsTableProps) {
  // Start censored by default as requested by user
  const [isCensored, setIsCensored] = useState(true);
  // Show only 6 items by default as requested by user
  const [showAll, setShowAll] = useState(false);

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 6);
  const hasMore = transactions.length > 6;

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#F8FAFC]">Últimas Transações</h2>
          
          {/* Eye Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCensored(!isCensored)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] transition-all cursor-pointer shadow-sm"
            title={isCensored ? "Clique para revelar referências e produtos" : "Clique para censurar referências e produtos"}
          >
            {isCensored ? (
              <>
                {/* Eye Off SVG */}
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
                <span>Mostrar Dados</span>
              </>
            ) : (
              <>
                {/* Eye Open SVG */}
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Ocultar Dados</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#64748B]">
            Mostrando {displayedTransactions.length} de {transactions.length}
          </span>
          <Link
            href="/dashboard/payments"
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            Ver todos os pagamentos <span>→</span>
          </Link>
        </div>
      </div>

      <div className="otter-widget-card rounded-2xl overflow-hidden shadow-xl">
        {displayedTransactions.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            Nenhuma transação recente encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0F0E14]/70 backdrop-blur-sm text-[#94A3B8] border-b border-[#1E1B26]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Referência</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Produto</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Data</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E1B26]">
                {displayedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1A1820] transition-colors">
                    <td className="px-6 py-4 text-[#F8FAFC] font-mono text-xs font-medium">
                      {isCensored ? 'OTF-•••••' : tx.reference}
                    </td>
                    <td className="px-6 py-4 text-[#F8FAFC] font-medium">
                      {isCensored ? (
                        <span className="tracking-widest text-[#94A3B8] select-none">••••••••••••••</span>
                      ) : (
                        tx.productName
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#94A3B8] text-xs">
                      {new Date(tx.date).toLocaleDateString('pt-MZ', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tx.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {tx.status === 'APPROVED' ? 'Aprovado' : tx.status === 'PENDING' ? 'Pendente' : tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-[#F8FAFC] font-bold">
                      {formatMZN(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Expand / Collapse action */}
        {hasMore && (
          <div className="p-3 bg-[#0F0E14] border-t border-[#1E1B26] flex items-center justify-between px-6">
            <span className="text-xs text-[#94A3B8]">
              {showAll
                ? `Mostrando todas as ${transactions.length} transações recentes.`
                : `Exibindo 6 de ${transactions.length} transações recentes.`}
            </span>
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {showAll ? (
                <>
                  <span>Recolher para 6</span>
                  <span>↑</span>
                </>
              ) : (
                <>
                  <span>Ver mais {transactions.length - 6} transações</span>
                  <span>↓</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
