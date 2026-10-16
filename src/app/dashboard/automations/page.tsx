'use client';

import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Plus,
  QrCode,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Smartphone,
  Sparkles,
  Send,
  Save,
} from 'lucide-react';
import { Product } from '@/lib/db';

interface WhatsappSession {
  id: string;
  name: string;
  phoneNumber: string;
  status: 'CONNECTED' | 'QR_READY';
  linkedProductIds: string[];
  triggerApproved: boolean;
  triggerAbandoned: boolean;
  triggerPendingPin: boolean;
  approvedMessage: string;
  abandonedMessage: string;
}

const DEFAULT_SESSIONS: WhatsappSession[] = [
  {
    id: 'wa-sess-1',
    name: 'Atendimento Principal MZ',
    phoneNumber: '+258 84 900 1122',
    status: 'CONNECTED',
    linkedProductIds: ['ALL'],
    triggerApproved: true,
    triggerAbandoned: true,
    triggerPendingPin: true,
    approvedMessage:
      'Olá *{cliente}*! ✅ Recebemos o seu pagamento de *{valor} MT* referente ao *{produto}*. Aqui está o seu link de acesso imediato: {link_acesso}',
    abandonedMessage:
      'Olá *{cliente}*, vimos que tentou adquirir o *{produto}* mas a confirmação do M-Pesa/e-Mola não foi concluída. Posso ajudar a finalizar?',
  },
];

const STORAGE_KEY = 'otterfy_whatsapp_sessions_v1';

export default function WhatsappAutomationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sessions, setSessions] = useState<WhatsappSession[]>(DEFAULT_SESSIONS);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_SESSIONS[0].id);
  const [showQrModal, setShowQrModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(console.error);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistSessions = (next: WhatsappSession[], msg = 'Automação de WhatsApp guardada com sucesso!') => {
    setSessions(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const activeSession = sessions.find((s) => s.id === selectedId) || sessions[0];

  const updateActiveSession = (patch: Partial<WhatsappSession>) => {
    if (!activeSession) return;
    const next = sessions.map((s) => (s.id === activeSession.id ? { ...s, ...patch } : s));
    setSessions(next);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSessionName.trim() || `Sessão WhatsApp #${sessions.length + 1}`;
    const created: WhatsappSession = {
      id: `wa-sess-${Date.now()}`,
      name,
      phoneNumber: 'Aguardando leitura de QR Code',
      status: 'QR_READY',
      linkedProductIds: ['ALL'],
      triggerApproved: true,
      triggerAbandoned: true,
      triggerPendingPin: false,
      approvedMessage: DEFAULT_SESSIONS[0].approvedMessage,
      abandonedMessage: DEFAULT_SESSIONS[0].abandonedMessage,
    };
    const next = [...sessions, created];
    persistSessions(next, `Nova sessão "${name}" criada! Leia o QR Code para emparelhar.`);
    setSelectedId(created.id);
    setNewSessionName('');
    setShowQrModal(true);
  };

  const simulatePairQr = () => {
    if (!activeSession) return;
    const next = sessions.map((s) =>
      s.id === activeSession.id
        ? { ...s, status: 'CONNECTED' as const, phoneNumber: '+258 84 771 9040' }
        : s
    );
    persistSessions(next, 'Dispositivo WhatsApp conectado com sucesso via QR Code!');
    setShowQrModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp Multi-Sessão (Padrão GGCheckout)
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Automação de WhatsApp & Recuperação</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Conecte múltiplas contas de WhatsApp via QR Code, vincule produtos específicos e envie acessos ou recuperação de carrinho automaticamente.
          </p>
        </div>

        <form onSubmit={handleCreateSession} className="flex items-center gap-2">
          <input
            type="text"
            aria-label="Nome da nova sessão de WhatsApp"
            placeholder="Nome da nova sessão..."
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#11111a] border border-white/[0.08] text-xs text-white"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Sessão
          </button>
        </form>
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
        {/* Left: Sessions List */}
        <div className="lg:col-span-4 space-y-3">
          {sessions.map((sess) => {
            const isSelected = sess.id === activeSession?.id;
            return (
              <div
                key={sess.id}
                onClick={() => setSelectedId(sess.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-[#11111a] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">{sess.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      sess.status === 'CONNECTED'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {sess.status === 'CONNECTED' ? 'Conectado' : 'Ler QR Code'}
                  </span>
                </div>
                <div className="text-xs text-[#8b8b9e] mt-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  {sess.phoneNumber}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Active Session Configuration */}
        {activeSession && (
          <div className="lg:col-span-8 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">{activeSession.name}</h2>
                <p className="text-xs text-[#8b8b9e]">{activeSession.phoneNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQrModal(!showQrModal)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-bold text-white"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  {activeSession.status === 'CONNECTED' ? 'Reconectar QR Code' : 'Gerar QR Code'}
                </button>

                {sessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = sessions.filter((s) => s.id !== activeSession.id);
                      persistSessions(next, 'Sessão de WhatsApp removida.');
                      setSelectedId(next[0].id);
                    }}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/15 text-[#8b8b9e] hover:text-rose-400"
                    title="Eliminar sessão"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {showQrModal && (
              <div className="p-5 rounded-2xl bg-[#0a0a0f] border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-36 h-36 rounded-2xl bg-white p-3 flex items-center justify-center shrink-0">
                  <QrCode className="w-28 h-28 text-slate-950" />
                </div>
                <div className="space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-white">Emparelhar Dispositivo no WhatsApp</h3>
                  <ol className="list-decimal list-inside space-y-1 text-[#8b8b9e]">
                    <li>Abra o WhatsApp ou WhatsApp Business no seu telemóvel</li>
                    <li>Toque em <strong>Dispositivos conectados → Conectar um dispositivo</strong></li>
                    <li>Aponte a câmara para o código QR ao lado</li>
                  </ol>
                  <button
                    type="button"
                    onClick={simulatePairQr}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Leitura do QR Code
                  </button>
                </div>
              </div>
            )}

            {/* Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSession.triggerApproved}
                  onChange={(e) => updateActiveSession({ triggerApproved: e.target.checked })}
                  className="rounded border-white/20 text-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Compra Aprovada</div>
                  <div className="text-[10px] text-[#8b8b9e]">Envia acesso imediato</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSession.triggerAbandoned}
                  onChange={(e) => updateActiveSession({ triggerAbandoned: e.target.checked })}
                  className="rounded border-white/20 text-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Carrinho Abandonado</div>
                  <div className="text-[10px] text-[#8b8b9e]">Recuperação automática</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06] cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeSession.triggerPendingPin}
                  onChange={(e) => updateActiveSession({ triggerPendingPin: e.target.checked })}
                  className="rounded border-white/20 text-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-white">Lembrete de PIN</div>
                  <div className="text-[10px] text-[#8b8b9e]">Ajuda M-Pesa / e-Mola</div>
                </div>
              </label>
            </div>

            {/* Message Templates */}
            <div className="space-y-4">
              <div>
                <label htmlFor="wa-msg-approved" className="block text-xs font-semibold text-white mb-1">
                  Mensagem de Compra Aprovada (Entrega Automática)
                </label>
                <textarea
                  id="wa-msg-approved"
                  rows={3}
                  value={activeSession.approvedMessage}
                  onChange={(e) => updateActiveSession({ approvedMessage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
                />
              </div>

              <div>
                <label htmlFor="wa-msg-abandoned" className="block text-xs font-semibold text-white mb-1">
                  Mensagem de Recuperação de Carrinho / Pagamento Pendente
                </label>
                <textarea
                  id="wa-msg-abandoned"
                  rows={3}
                  value={activeSession.abandonedMessage}
                  onChange={(e) => updateActiveSession({ abandonedMessage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => persistSessions(sessions)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
              >
                <Save className="w-4 h-4" />
                Guardar Automação WhatsApp
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
