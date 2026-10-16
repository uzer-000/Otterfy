'use client';

import React, { useEffect, useState } from 'react';
import {
  Send,
  Bot,
  CheckCircle2,
  ShieldCheck,
  Save,
  Sparkles,
  Users,
  Bell,
} from 'lucide-react';

interface TelegramConfig {
  botToken: string;
  chatId: string;
  vipGroupInviteLink: string;
  notifyOnSaleApproved: boolean;
  notifyOnOrderCreated: boolean;
  notifyOnRefund: boolean;
  autoSendVipAccess: boolean;
}

const DEFAULT_TELEGRAM: TelegramConfig = {
  botToken: '',
  chatId: '',
  vipGroupInviteLink: 'https://t.me/+OtterfyVipGroupMZ',
  notifyOnSaleApproved: true,
  notifyOnOrderCreated: true,
  notifyOnRefund: true,
  autoSendVipAccess: true,
};

const STORAGE_KEY = 'otterfy_telegram_bot_v1';

export default function TelegramBotPage() {
  const [config, setConfig] = useState<TelegramConfig>(DEFAULT_TELEGRAM);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setConfig({ ...DEFAULT_TELEGRAM, ...JSON.parse(saved) });
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
    setFeedback('Configuração do Bot do Telegram guardada com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendTest = async () => {
    setTesting(true);
    try {
      if (config.botToken && config.chatId) {
        await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: '🦦 *Otterfy Checkout MZ* — Notificação de Teste!\n💰 Venda Aprovada: *1.990 MT* via M-Pesa.',
            parse_mode: 'Markdown',
          }),
        });
        setFeedback('Mensagem real enviada para o seu Chat ID no Telegram!');
      } else {
        setFeedback('Simulação concluída! Preencha o Bot Token (@BotFather) e Chat ID para receber no Telegram.');
      }
    } catch {
      setFeedback('Pedido de teste disparado! Verifique o Token e o Chat ID.');
    } finally {
      setTesting(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            Notificações em Tempo Real & Grupos VIP
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bot do Telegram</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Receba alertas instantâneos a cada venda aprovada via M-Pesa/e-Mola e automatize o acesso a canais ou grupos VIP no Telegram.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendTest}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all"
        >
          <Send className="w-4 h-4" />
          {testing ? 'A enviar teste...' : 'Disparar Notificação de Teste'}
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

      <form
        onSubmit={handleSave}
        className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-5"
      >
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          Credenciais do Bot (@BotFather)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tg-token" className="block text-xs font-semibold text-white mb-1.5">
              Telegram Bot Token
            </label>
            <input
              id="tg-token"
              type="password"
              placeholder="Ex: 7123456789:AAH..."
              value={config.botToken}
              onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>

          <div>
            <label htmlFor="tg-chat" className="block text-xs font-semibold text-white mb-1.5">
              Chat ID ou Canal ID (Destino dos Alertas)
            </label>
            <input
              id="tg-chat"
              type="text"
              placeholder="Ex: -100192837465"
              value={config.chatId}
              onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="tg-vip" className="block text-xs font-semibold text-white mb-1.5">
              Link de Convite do Grupo/Canal VIP para Compradores Aprovados
            </label>
            <input
              id="tg-vip"
              type="url"
              value={config.vipGroupInviteLink}
              onChange={(e) => setConfig({ ...config, vipGroupInviteLink: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
            <input
              type="checkbox"
              checked={config.notifyOnSaleApproved}
              onChange={(e) => setConfig({ ...config, notifyOnSaleApproved: e.target.checked })}
              className="rounded border-white/20 text-emerald-500"
            />
            <div>
              <div className="text-xs font-bold text-white">Notificar Venda Aprovada (M-Pesa / e-Mola)</div>
              <div className="text-[11px] text-[#8b8b9e]">Envia valor, produto e telemóvel do comprador</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer">
            <input
              type="checkbox"
              checked={config.autoSendVipAccess}
              onChange={(e) => setConfig({ ...config, autoSendVipAccess: e.target.checked })}
              className="rounded border-white/20 text-emerald-500"
            />
            <div>
              <div className="text-xs font-bold text-white">Libertar Acesso ao Grupo VIP Automaticamente</div>
              <div className="text-[11px] text-[#8b8b9e]">Envia link único após confirmação do pagamento</div>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-3 border-t border-white/[0.06]">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Configuração Telegram
          </button>
        </div>
      </form>
    </div>
  );
}
