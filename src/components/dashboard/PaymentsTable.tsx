'use client';

import { formatMZN } from '@/lib/utils';

export default function PaymentsTable({ payments, loading }: { payments: any[], loading: boolean }) {
  if (loading) {
    return <div className="p-12 text-center text-[#94A3B8]">A carregar histórico de pagamentos...</div>;
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p className="text-[#F8FAFC] font-bold text-base mb-1">Nenhum pagamento encontrado</p>
        <p className="text-[#64748B] text-xs">Os pagamentos recebidos via eMola e M-Pesa aparecerão listados aqui.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0F0E14] text-[#94A3B8] border-b border-[#1E1B26]">
          <tr>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Referência</th>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Telefone</th>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Método</th>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1E1B26] bg-[#08070C]">
          {payments.map((p) => {
            const method = p.transaction?.method || p.method;
            return (
              <tr key={p.id} className="hover:bg-[#1A1820] transition-colors text-[#F8FAFC]">
                <td className="px-6 py-4 font-mono text-xs font-medium text-[#F8FAFC]">{p.id}</td>
                <td className="px-6 py-4 font-medium text-sm">
                  {p.customerName || p.customer?.name || '-'}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-[#94A3B8]">
                  {p.customerPhone || p.customer?.phone || '-'}
                </td>
                <td className="px-6 py-4">
                  {method === 'EMOLA' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-600/10 text-violet-400 border border-violet-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      eMola
                    </span>
                  ) : method === 'MPESA' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-fuchsia-600/10 text-fuchsia-400 border border-fuchsia-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                      M-Pesa
                    </span>
                  ) : (
                    <span className="text-xs text-[#64748B]">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    p.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    p.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {p.status === 'APPROVED' ? 'Aprovado' : p.status === 'PENDING' ? 'Pendente' : p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-violet-400">
                  {formatMZN(p.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
