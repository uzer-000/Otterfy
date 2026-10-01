'use client';

import { useState, useEffect } from 'react';
import PaymentsTable from '@/components/dashboard/PaymentsTable';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const url = statusFilter === 'ALL' ? '/api/payments' : `/api/payments?status=${statusFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setPayments(json.data || []);
        }
      } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, [statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Pagamentos</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Histórico completo de transações e recebimentos</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121016] border border-[#1E1B26] p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-[#94A3B8]">Filtrar por:</span>
          <select 
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

        <div className="text-xs text-[#64748B]">
          Mostrando {payments.length} transações
        </div>
      </div>

      <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl overflow-hidden shadow-xl">
        <PaymentsTable payments={payments} loading={loading} />
      </div>
    </div>
  );
}
