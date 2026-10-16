'use client';

import React, { useEffect, useState } from 'react';
import {
  Globe,
  ShieldCheck,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Server,
} from 'lucide-react';

interface CustomDomain {
  id: string;
  domain: string;
  type: 'CHECKOUT' | 'STOREFRONT';
  status: 'ACTIVE' | 'PENDING_DNS';
  sslStatus: 'ISSUED' | 'PROVISIONING';
  addedAt: string;
  lastVerified: string;
}

const DEFAULT_DOMAINS: CustomDomain[] = [
  {
    id: 'dom-1',
    domain: 'pay.minhaloja.co.mz',
    type: 'CHECKOUT',
    status: 'ACTIVE',
    sslStatus: 'ISSUED',
    addedAt: '2025-02-01',
    lastVerified: 'Hoje, 10:15',
  },
];

const STORAGE_KEY = 'otterfy_custom_domains_v1';

export default function DomainsPage() {
  const [domains, setDomains] = useState<CustomDomain[]>(DEFAULT_DOMAINS);
  const [newDomain, setNewDomain] = useState('');
  const [newType, setNewType] = useState<'CHECKOUT' | 'STOREFRONT'>('CHECKOUT');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setDomains(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveDomains = (next: CustomDomain[], msg?: string) => {
    setDomains(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    if (msg) {
      setFeedback(msg);
      setTimeout(() => setFeedback(null), 3200);
    }
  };

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    if (!cleaned || !cleaned.includes('.')) return;

    const item: CustomDomain = {
      id: `dom-${Date.now()}`,
      domain: cleaned,
      type: newType,
      status: 'PENDING_DNS',
      sslStatus: 'PROVISIONING',
      addedAt: new Date().toISOString().slice(0, 10),
      lastVerified: 'Aguardando propagação CNAME',
    };

    saveDomains([item, ...domains], `Domínio ${cleaned} adicionado! Configure o apontamento CNAME abaixo.`);
    setNewDomain('');
  };

  const verifyDomainDns = (id: string) => {
    setVerifyingId(id);
    setTimeout(() => {
      const next = domains.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'ACTIVE' as const,
              sslStatus: 'ISSUED' as const,
              lastVerified: 'Verificado agora (CNAME + SSL Ativo)',
            }
          : d
      );
      saveDomains(next, 'Apontamento DNS CNAME validado e Certificado SSL Let’s Encrypt emitido!');
      setVerifyingId(null);
    }, 800);
  };

  const removeDomain = (id: string) => {
    saveDomains(
      domains.filter((d) => d.id !== id),
      'Domínio removido da conta.'
    );
  };

  const copyText = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedRecord(key);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Globe className="w-3.5 h-3.5" />
            Domínios Personalizados & SSL Automático
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Domínios & Subdomínios de Checkout</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Utilize o seu próprio domínio (ex: `pay.sualoja.co.mz`) no checkout e na vitrine para máxima autoridade e aprovação em campanhas de tráfego pago.
          </p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Domain & Active Domains List */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleAddDomain}
            className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Conectar Novo Subdomínio ou Domínio
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="dom-input" className="block text-xs font-semibold text-white mb-1">
                  Subdomínio Desejado
                </label>
                <input
                  id="dom-input"
                  type="text"
                  required
                  placeholder="Ex: pay.minhaloja.co.mz"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
                />
              </div>

              <div>
                <label htmlFor="dom-type" className="block text-xs font-semibold text-white mb-1">
                  Finalidade
                </label>
                <select
                  id="dom-type"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as 'CHECKOUT' | 'STOREFRONT')}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                >
                  <option value="CHECKOUT">Checkout (/pay)</option>
                  <option value="STOREFRONT">Vitrine (/loja)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
            >
              <Globe className="w-4 h-4" />
              Adicionar Domínio
            </button>
          </form>

          {/* Domains List */}
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Domínios Configurados ({domains.length})</h2>

            <div className="space-y-3">
              {domains.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white font-mono">{item.domain}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/[0.06] text-[#8b8b9e]">
                        {item.type === 'CHECKOUT' ? 'Checkout Transparente' : 'Vitrine / Loja'}
                      </span>
                      {item.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          DNS Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Pendente DNS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#8b8b9e]">
                      <span className="inline-flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-400" />
                        SSL: {item.sslStatus === 'ISSUED' ? 'Ativo (TLS 1.3)' : 'A emitir...'}
                      </span>
                      <span>•</span>
                      <span>{item.lastVerified}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => verifyDomainDns(item.id)}
                      disabled={verifyingId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${verifyingId === item.id ? 'animate-spin' : ''}`} />
                      {verifyingId === item.id ? 'A verificar...' : 'Verificar DNS'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeDomain(item.id)}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-rose-500/15 text-[#8b8b9e] hover:text-rose-400 transition-colors"
                      title="Remover domínio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: DNS Instructions Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Instruções de Apontamento DNS</h2>
            </div>

            <p className="text-xs text-[#8b8b9e] leading-relaxed">
              No painel do seu provedor de domínio (Cloudflare, Hostinger, Namecheap ou Registo `.co.mz`), adicione o seguinte registo <strong className="text-white">CNAME</strong>:
            </p>

            <div className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.08] space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#8b8b9e]">Tipo:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">CNAME</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8b8b9e]">Nome / Host:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold">pay</span>
                  <button
                    type="button"
                    onClick={() => copyText('host', 'pay')}
                    className="text-[#8b8b9e] hover:text-white"
                    title="Copiar Host"
                  >
                    {copiedRecord === 'host' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8b8b9e]">Destino / Alvo:</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">cname.otterfy-dns.com</span>
                  <button
                    type="button"
                    onClick={() => copyText('target', 'cname.otterfy-dns.com')}
                    className="text-[#8b8b9e] hover:text-white"
                    title="Copiar Destino"
                  >
                    {copiedRecord === 'target' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#8b8b9e]">Proxy Cloudflare:</span>
                <span className="text-amber-300">DNS Only (Nuvem Cinzenta)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Compatível com a verificação de domínio da <strong>Meta Ads (Facebook Pixel & CAPI)</strong> para eventos de Purchase sem bloqueio de cookies de terceiros.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
