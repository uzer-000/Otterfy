'use client';

import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Building2,
  Receipt,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Transaction, normalizeTransactions } from '@/lib/db';

interface ErpConfig {
  provider: 'PRIMAVERA_MZ' | 'PHC_CS' | 'ODOO' | 'BLING' | 'SPEDY';
  companyName: string;
  nuit: string;
  ivaPercent: number;
  autoIssueOnPaid: boolean;
  apiKey: string;
  webhookEndpoint: string;
}

const DEFAULT_ERP: ErpConfig = {
  provider: 'PRIMAVERA_MZ',
  companyName: 'Otterfy Pagamentos Digitais Lda',
  nuit: '401293847',
  ivaPercent: 16,
  autoIssueOnPaid: true,
  apiKey: '',
  webhookEndpoint: 'https://erp.sualoja.co.mz/api/v1/invoices',
};

const STORAGE_KEY = 'otterfy_erp_config_v1';

export default function ErpIntegrationPage() {
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [config, setConfig] = useState<ErpConfig>(DEFAULT_ERP);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments')
      .then((res) => res.json())
      .then((data) => {
        setOrders(normalizeTransactions(data));
      })
      .catch(console.error);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfig({ ...DEFAULT_ERP, ...JSON.parse(saved) });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.error(err);
    }
    setFeedback('Integração ERP e regras fiscais (NUIT / IVA) guardadas com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const exportAccountingCsv = () => {
    const headers = [
      'ID_Pedido',
      'Data_ISO',
      'Estado',
      'Gateway',
      'Telefone_Cliente',
      'Email_Cliente',
      'Valor_Bruto_MT',
      'IVA_MT',
      'Valor_Liquido_MT',
      'NUIT_Emitente',
    ];
    const rows = orders.map((o) => {
      const ivaAmount = Number(((o.amount * config.ivaPercent) / 100).toFixed(2));
      const netAmount = Number((o.amount - ivaAmount).toFixed(2));
      return [
        o.id,
        o.createdAt,
        o.status,
        o.gateway,
        o.customerPhone,
        o.customerEmail || '',
        o.amount,
        ivaAmount,
        netAmount,
        config.nuit,
      ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `otterfy-faturacao-erp-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const totalGross = paidOrders.reduce((acc, o) => acc + o.amount, 0);
  const totalTax = Math.round((totalGross * config.ivaPercent) / 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Faturação Automática & Contabilidade
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sistema ERP & Emissão de Recibos</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Sincronize as suas vendas aprovadas com Primavera BSS, PHC CS, Odoo, Bling ou exporte relatórios fiscais com cálculo de IVA.
          </p>
        </div>

        <button
          type="button"
          onClick={exportAccountingCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          Exportar CSV Contabilístico ({orders.length})
        </button>
      </div>

      {feedback && (
        <div
          role="status"
          className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="text-xs text-[#8b8b9e]">Recibos / Faturas Emitidas</div>
          <div className="text-2xl font-bold text-white mt-1">{paidOrders.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Sincronização automática em vendas pagas</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="text-xs text-[#8b8b9e]">Volume Faturado (Aprovado)</div>
          <div className="text-2xl font-bold text-white mt-1">
            {totalGross.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-400">MT</span>
          </div>
          <div className="text-[11px] text-[#8b8b9e] mt-1">NUIT: {config.nuit}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#11111a] border border-white/[0.06]">
          <div className="text-xs text-[#8b8b9e]">Estimativa de IVA ({config.ivaPercent}%)</div>
          <div className="text-2xl font-bold text-amber-300 mt-1">
            {totalTax.toLocaleString('pt-MZ')} <span className="text-xs">MT</span>
          </div>
          <div className="text-[11px] text-[#8b8b9e] mt-1">Taxa configurável abaixo</div>
        </div>
      </div>

      {/* ERP Form */}
      <form
        onSubmit={handleSave}
        className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-400" />
          Conector ERP & Dados Fiscais da Empresa
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="erp-provider" className="block text-xs font-semibold text-white mb-1.5">
              Sistema ERP / Faturação
            </label>
            <select
              id="erp-provider"
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as ErpConfig['provider'] })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
            >
              <option value="PRIMAVERA_MZ">Primavera BSS (Moçambique)</option>
              <option value="PHC_CS">PHC CS Corporate / Web</option>
              <option value="ODOO">Odoo ERP Cloud</option>
              <option value="BLING">Bling ERP</option>
              <option value="SPEDY">Spedy / eNotas Webhook</option>
            </select>
          </div>

          <div>
            <label htmlFor="erp-company" className="block text-xs font-semibold text-white mb-1.5">
              Razão Social / Nome Fiscal
            </label>
            <input
              id="erp-company"
              type="text"
              value={config.companyName}
              onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="erp-nuit" className="block text-xs font-semibold text-white mb-1.5">
              NUIT (Número Único de Identificação Tributária)
            </label>
            <input
              id="erp-nuit"
              type="text"
              value={config.nuit}
              onChange={(e) => setConfig({ ...config, nuit: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>

          <div>
            <label htmlFor="erp-iva" className="block text-xs font-semibold text-white mb-1.5">
              Alíquota de IVA Padrão (%)
            </label>
            <input
              id="erp-iva"
              type="number"
              min={0}
              max={30}
              value={config.ivaPercent}
              onChange={(e) => setConfig({ ...config, ivaPercent: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="erp-apikey" className="block text-xs font-semibold text-white mb-1.5">
              Chave de API / Token ERP
            </label>
            <input
              id="erp-apikey"
              type="password"
              placeholder="••••••••••••••••••••••••"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
            />
          </div>

          <div>
            <label htmlFor="erp-webhook" className="block text-xs font-semibold text-white mb-1.5">
              URL de Sincronização Fiscal
            </label>
            <input
              id="erp-webhook"
              type="url"
              value={config.webhookEndpoint}
              onChange={(e) => setConfig({ ...config, webhookEndpoint: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
          <input
            type="checkbox"
            checked={config.autoIssueOnPaid}
            onChange={(e) => setConfig({ ...config, autoIssueOnPaid: e.target.checked })}
            className="rounded border-white/20 text-emerald-500 focus:ring-emerald-500"
          />
          <div>
            <div className="text-xs font-bold text-white">
              Emitir recibo/fatura automaticamente assim que o pagamento M-Pesa ou e-Mola for confirmado
            </div>
            <div className="text-[11px] text-[#8b8b9e]">
              Envia o comprovativo fiscal para o e-mail do comprador sem intervenção manual.
            </div>
          </div>
        </label>

        <div className="flex justify-end pt-3 border-t border-white/[0.06]">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Configuração ERP
          </button>
        </div>
      </form>
    </div>
  );
}
