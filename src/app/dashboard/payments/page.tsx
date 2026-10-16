'use client';

import { useState, useEffect, useCallback } from 'react';
import PaymentsTable from '@/components/dashboard/PaymentsTable';
import { Download, RefreshCw, Search } from 'lucide-react';
import type { OrderItem } from '@/lib/store';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === 'ALL'
          ? '/api/payments?limit=100'
          : `/api/payments?status=${statusFilter}&limit=100`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPayments(Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []);
      }
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const filteredPayments = payments.filter((p) => {
    const method = p.transaction?.method || '';
    if (gatewayFilter !== 'ALL' && method !== gatewayFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (p.id || '').toLowerCase().includes(q);
      const matchName = (p.customerName || '').toLowerCase().includes(q);
      const matchPhone = (p.customerPhone || '').toLowerCase().includes(q);
      const matchEmail = (p.customerEmail || '').toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchEmail) return false;
    }
    return true;
  });

  const exportCsv = () => {
    const headers = ['Referencia', 'Cliente', 'Telefone', 'Email', 'Metodo', 'Status', 'Valor_MT', 'Data'];
    const rows = filteredPayments.map((p) =>
      [
        p.id,
        `"${(p.customerName || '').replace(/"/g, '""')}"`,
        p.customerPhone || '',
        p.customerEmail || '',
        p.transaction?.method || 'MPESA',
        p.status,
        p.amount,
        p.createdAt,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `otterfy-pagamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Pagamentos</h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Histórico completo de transações, recebimentos e exportação de relatórios CSV
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV ({filteredPayments.length})
          </button>

          <button
            type="button"
            onClick={loadPayments}
            className="p-2.5 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
            title="Atualizar pagamentos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121016] border border-[#1E1B26] p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-2.5" />
            <input
              type="search"
              aria-label="Pesquisar por referência, cliente ou telefone"
              placeholder="Pesquisar cliente, telefone ou ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0F0E14] border border-[#1E1B26] text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#7C3AED]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="status-filter" className="text-xs font-semibold text-[#94A3B8]">
              Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0F0E14] border border-[#1E1B26] text-[#F8FAFC] text-xs font-medium rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="ALL">Todos os Status</option>
              <option value="APPROVED">Aprovado</option>
              <option value="PENDING">Pendente</option>
              <option value="DECLINED">Recusado</option>
              <option value="REFUNDED">Reembolsado</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="gateway-filter" className="text-xs font-semibold text-[#94A3B8]">
              Método:
            </label>
            <select
              id="gateway-filter"
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="bg-[#0F0E14] border border-[#1E1B26] text-[#F8FAFC] text-xs font-medium rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#7C3AED]"
            >
              <option value="ALL">Todos (M-Pesa & e-Mola)</option>
              <option value="MPESA">M-Pesa</option>
              <option value="EMOLA">e-Mola</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-[#94A3B8]">
          Mostrando {filteredPayments.length} transações
        </div>
      </div>

      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
        <PaymentsTable payments={filteredPayments} loading={loading} />
      </div>
    </div>
  );
}
