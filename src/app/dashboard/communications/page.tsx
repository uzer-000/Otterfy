'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  MessageSquare,
  CheckCircle2,
  Send,
  Save,
  Sparkles,
  Bell,
} from 'lucide-react';

interface CommTemplate {
  id: string;
  event: 'order.approved' | 'order.created' | 'abandoned_cart' | 'order.refunded';
  title: string;
  channel: 'EMAIL_AND_WHATSAPP' | 'WHATSAPP_ONLY' | 'EMAIL_ONLY';
  subject: string;
  body: string;
  enabled: boolean;
}

const DEFAULT_TEMPLATES: CommTemplate[] = [
  {
    id: 'tpl-approved',
    event: 'order.approved',
    title: 'Compra Aprovada & Entrega do Produto',
    channel: 'EMAIL_AND_WHATSAPP',
    subject: '✅ Seu acesso a {produto} está liberado! (Pedido #{pedido})',
    body: 'Olá {cliente}! O seu pagamento de {valor} MT via {gateway} foi confirmado com sucesso. Aceda ao seu produto agora mesmo através do link seguro: {link_acesso}',
    enabled: true,
  },
  {
    id: 'tpl-created',
    event: 'order.created',
    title: 'Pedido Gerado (Aguardando PIN M-Pesa / e-Mola)',
    channel: 'WHATSAPP_ONLY',
    subject: '⏳ Confirme o pedido #{pedido} no seu telemóvel',
    body: 'Olá {cliente}! Enviámos a solicitação de pagamento de {valor} MT para o seu telemóvel. Caso a notificação tenha expirado, conclua aqui: {link_checkout}',
    enabled: true,
  },
  {
    id: 'tpl-abandoned',
    event: 'abandoned_cart',
    title: 'Recuperação de Carrinho Abandonado (15 min após saída)',
    channel: 'EMAIL_AND_WHATSAPP',
    subject: '🎁 Guardámos o seu acesso a {produto} com condição especial!',
    body: 'Olá {cliente}, notámos que não conseguiu concluir a sua inscrição no {produto}. Use o link abaixo para finalizar em segundos via M-Pesa ou e-Mola: {link_checkout}',
    enabled: true,
  },
  {
    id: 'tpl-refunded',
    event: 'order.refunded',
    title: 'Notificação de Reembolso Processado',
    channel: 'EMAIL_ONLY',
    subject: 'Reembolso confirmado — Pedido #{pedido}',
    body: 'Olá {cliente}, confirmamos que o estorno referente ao pedido #{pedido} ({valor} MT) foi processado de acordo com a nossa Política de Reembolso.',
    enabled: true,
  },
];

const STORAGE_KEY = 'otterfy_communications_templates_v1';

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState<CommTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [testDestination, setTestDestination] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTemplates(parsed);
          setSelectedId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const activeTemplate = templates.find((t) => t.id === selectedId) || templates[0];

  const updateActive = (patch: Partial<CommTemplate>) => {
    const next = templates.map((t) => (t.id === activeTemplate.id ? { ...t, ...patch } : t));
    setTemplates(next);
  };

  const saveAll = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (e) {
      console.error(e);
    }
    setFeedback('Templates de comunicação transacional guardados com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const sendTestMessage = () => {
    if (!testDestination.trim()) return;
    setFeedback(`Disparo de teste do evento "${activeTemplate.title}" enviado para ${testDestination}!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5" />
            Régua de Comunicação Transacional
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Comunicações Automáticas (E-mail, SMS & WhatsApp)</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Personalize as mensagens automáticas enviadas aos compradores em cada etapa do pedido.
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
        {/* Left: Event Selector */}
        <div className="lg:col-span-4 space-y-3">
          {templates.map((tpl) => {
            const isSelected = tpl.id === activeTemplate.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-[#11111a] border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] text-emerald-400">
                    {tpl.event}
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      tpl.enabled ? 'text-emerald-400' : 'text-[#8b8b9e]'
                    }`}
                  >
                    {tpl.enabled ? '● Ativo' : '○ Inativo'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{tpl.title}</h3>
              </div>
            );
          })}
        </div>

        {/* Right: Template Editor */}
        {activeTemplate && (
          <div className="lg:col-span-8 bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">{activeTemplate.title}</h2>
                <p className="text-xs text-[#8b8b9e]">
                  Variáveis disponíveis: <code>{'{cliente}'}</code>, <code>{'{produto}'}</code>,{' '}
                  <code>{'{valor}'}</code>, <code>{'{pedido}'}</code>, <code>{'{gateway}'}</code>,{' '}
                  <code>{'{link_acesso}'}</code>, <code>{'{link_checkout}'}</code>
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeTemplate.enabled}
                  onChange={(e) => updateActive({ enabled: e.target.checked })}
                  className="rounded border-white/20 text-emerald-500"
                />
                Ativar disparo automático
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="comm-channel" className="block text-xs font-semibold text-white mb-1.5">
                  Canais de Envio
                </label>
                <select
                  id="comm-channel"
                  value={activeTemplate.channel}
                  onChange={(e) =>
                    updateActive({ channel: e.target.value as CommTemplate['channel'] })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                >
                  <option value="EMAIL_AND_WHATSAPP">E-mail + WhatsApp Automático</option>
                  <option value="WHATSAPP_ONLY">Apenas WhatsApp</option>
                  <option value="EMAIL_ONLY">Apenas E-mail Transacional</option>
                </select>
              </div>

              <div>
                <label htmlFor="comm-subject" className="block text-xs font-semibold text-white mb-1.5">
                  Assunto da Mensagem / E-mail
                </label>
                <input
                  id="comm-subject"
                  type="text"
                  value={activeTemplate.subject}
                  onChange={(e) => updateActive({ subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="comm-body" className="block text-xs font-semibold text-white mb-1.5">
                Corpo da Mensagem
              </label>
              <textarea
                id="comm-body"
                rows={5}
                value={activeTemplate.body}
                onChange={(e) => updateActive({ body: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white leading-relaxed"
              />
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  aria-label="Destino para envio de teste"
                  placeholder="Telemóvel ou e-mail para teste..."
                  value={testDestination}
                  onChange={(e) => setTestDestination(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs text-white"
                />
                <button
                  type="button"
                  onClick={sendTestMessage}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-white"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  Testar Disparo
                </button>
              </div>

              <button
                type="button"
                onClick={saveAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
              >
                <Save className="w-4 h-4" />
                Guardar Templates
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
