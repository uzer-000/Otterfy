'use client';

import React, { useState } from 'react';
import { formatMZN } from '@/lib/utils';

export function FeaturePlaceholder({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">{title}</h1>
        <p className="text-[#94A3B8] text-sm mt-1">{description}</p>
      </div>

      <div className="p-12 rounded-3xl bg-[#121016] border border-[#1E1B26] text-center flex flex-col items-center justify-center max-w-2xl mx-auto my-12 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[#F8FAFC] mb-2">{title}</h2>
        <p className="text-sm text-[#94A3B8] max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

interface RefundItem {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  amount: number;
  reason: string;
  date: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
}

const DEFAULT_REFUNDS: RefundItem[] = [
  {
    id: 'ref_1',
    orderId: 'OTF-8812A',
    customerName: 'Alberto Chissano',
    customerPhone: '+258 84 332 1199',
    productName: 'Curso de Marketing Digital Pro',
    amount: 1500,
    reason: 'Comprou por engano (queria o e-book)',
    date: 'Ontem às 16:40',
    status: 'Pendente',
  },
  {
    id: 'ref_2',
    orderId: 'OTF-5541B',
    customerName: 'Luisa Diogo',
    customerPhone: '+258 86 441 0022',
    productName: 'E-book Estratégias Secretas M-Pesa',
    amount: 500,
    reason: 'Não conseguiu abrir o arquivo no telemóvel antigo',
    date: '24/03/2026',
    status: 'Pendente',
  },
  {
    id: 'ref_3',
    orderId: 'OTF-1109C',
    customerName: 'Manuel Tome',
    customerPhone: '+258 87 990 8833',
    productName: 'Curso de Marketing Digital Pro',
    amount: 1500,
    reason: 'Desistência no período de 7 dias de garantia',
    date: '20/03/2026',
    status: 'Aprovado',
  },
];

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const pendingRefunds = refunds.filter((r) => r.status === 'Pendente');
  const totalPendingAmount = pendingRefunds.reduce((acc, r) => acc + r.amount, 0);

  const handleAction = (id: string, action: 'Aprovado' | 'Recusado') => {
    setRefunds((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: action } : r))
    );
    setToastMessage(
      action === 'Aprovado'
        ? 'Reembolso aprovado! Ordem de estorno M-Pesa enviada ao gateway.'
        : 'Solicitação de reembolso recusada.'
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl bg-[#121016] border border-violet-500/50 shadow-2xl text-violet-200 text-sm flex items-center gap-3 animate-fadeIn">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-[#94A3B8] hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-600/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">Reembolsos & Disputas</h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Gerencie devoluções de Meticais, suporte ao cliente e solicitações de estorno M-Pesa / e-Mola
          </p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Pendentes de Análise
          </span>
          <p className="text-2xl font-black text-amber-400 mt-2">
            {pendingRefunds.length} pedidos
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">Total: {formatMZN(totalPendingAmount)}</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Taxa de Estorno
          </span>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            0.6%
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">Excelente (abaixo de 2%)</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Garantia Padrão
          </span>
          <p className="text-2xl font-black text-white mt-2">
            7 Dias
          </p>
          <span className="text-[11px] text-violet-400 mt-1 block">Garantia incondicional</span>
        </div>

        <div className="bg-[#121016] border border-[#1E1B26] p-5 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8] block">
            Tempo Médio de Estorno
          </span>
          <p className="text-2xl font-black text-white mt-2">
            3h 20m
          </p>
          <span className="text-[11px] text-[#64748B] mt-1 block">Crédito direto na carteira</span>
        </div>
      </div>

      {/* Refunds Table */}
      <div className="bg-[#121016] border border-[#1E1B26] rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 px-6 border-b border-[#1E1B26] flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Solicitações de Reembolso</h3>
          <span className="text-xs text-[#94A3B8] font-mono">{refunds.length} itens no histórico</span>
        </div>

        {refunds.length === 0 ? (
          <div className="p-16 text-center text-[#94A3B8] space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              ✓
            </div>
            <p className="font-bold text-[#F8FAFC]">Nenhum pedido de reembolso registrado</p>
            <p className="text-xs text-[#64748B]">Sua taxa de estorno está em 0.0% e sua operação está 100% saudável.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F0E14] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#1E1B26]">
              <tr>
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-6">Produto & Pedido</th>
                <th className="py-3.5 px-6">Motivo Declarado</th>
                <th className="py-3.5 px-6 text-right">Valor</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E1B26]">
              {refunds.map((ref) => (
                <tr key={ref.id} className="hover:bg-[#16131F]/50 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-bold text-white text-xs">{ref.customerName}</p>
                    <span className="text-[11px] text-[#64748B] font-mono">{ref.customerPhone}</span>
                  </td>

                  <td className="py-4 px-6">
                    <p className="font-medium text-white text-xs">{ref.productName}</p>
                    <span className="text-[10px] text-violet-400 font-mono">{ref.orderId} • {ref.date}</span>
                  </td>

                  <td className="py-4 px-6 text-[#94A3B8] max-w-xs truncate">
                    {ref.reason}
                  </td>

                  <td className="py-4 px-6 text-right font-black text-white text-sm">
                    {formatMZN(ref.amount)}
                  </td>

                  <td className="py-4 px-6 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        ref.status === 'Aprovado'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : ref.status === 'Pendente'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {ref.status}
                    </span>
                  </td>

                  <td className="py-4 px-6 text-right">
                    {ref.status === 'Pendente' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(ref.id, 'Aprovado')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(ref.id, 'Recusado')}
                          className="px-3 py-1.5 rounded-lg bg-[#1E1B26] hover:bg-red-500/20 text-[#94A3B8] hover:text-red-400 font-bold text-xs transition-colors cursor-pointer"
                        >
                          Recusar
                        </button>
                        <a
                          href={`https://wa.me/${ref.customerPhone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(ref.customerName)},%20recebemos%20sua%20solicita%C3%A7%C3%A3o%20de%20reembolso%20na%20Otterfy`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-[#1E1B26] text-[#94A3B8] hover:text-emerald-400 transition-colors flex items-center justify-center"
                          title="Falar no WhatsApp com o cliente"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.301-.15-1.777-.877-2.052-.977-.276-.101-.477-.15-.678.15-.2.3-.778.977-.954 1.178-.175.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.786-1.676-2.087-.175-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.175.2-.301.301-.501.101-.2.05-.376-.025-.526-.075-.15-.678-1.631-.93-2.235-.245-.589-.494-.509-.678-.519-.176-.01-.376-.01-.577-.01-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509 1.079 2.91 1.229 3.111c.15.201 2.124 3.243 5.145 4.549.718.311 1.279.497 1.716.636.721.229 1.377.197 1.895.12.577-.087 1.777-.727 2.028-1.429.25-.702.25-1.303.175-1.429-.075-.126-.276-.201-.577-.351zM12 21.82c-1.782 0-3.48-.466-4.966-1.28l-.356-.197-3.69 1.018 1.002-3.582-.232-.37C3.003 16.035 2.5 14.07 2.5 12c0-5.238 4.262-9.5 9.5-9.5 2.538 0 4.924.988 6.718 2.782A9.444 9.444 0 0121.5 12c0 5.238-4.262 9.5-9.5 9.5z"/>
                          </svg>
                        </a>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#64748B]">Processado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
