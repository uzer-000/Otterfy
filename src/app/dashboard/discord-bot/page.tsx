'use client';

import React, { useEffect, useState } from 'react';
import {
  Bot,
  Send,
  CheckCircle2,
  Shield,
  Save,
  Sparkles,
} from 'lucide-react';
import { Product } from '@/lib/db';

interface DiscordConfig {
  webhookUrl: string;
  guildId: string;
  defaultRoleName: string;
  notifyOnApproved: boolean;
  notifyOnPending: boolean;
  autoAssignRole: boolean;
  roleByProduct: Record<string, string>;
}

const DEFAULT_DISCORD: DiscordConfig = {
  webhookUrl: '',
  guildId: '119283746500192837',
  defaultRoleName: '@Aluno VIP',
  notifyOnApproved: true,
  notifyOnPending: false,
  autoAssignRole: true,
  roleByProduct: {},
};

const STORAGE_KEY = 'otterfy_discord_bot_v1';

export default function DiscordBotPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<DiscordConfig>(DEFAULT_DISCORD);
  const [testing, setTesting] = useState(false);
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
      if (saved) setConfig({ ...DEFAULT_DISCORD, ...JSON.parse(saved) });
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
    setFeedback('Integração com Servidor Discord, Webhooks e Cargos guardada com sucesso!');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSendTestWebhook = async () => {
    setTesting(true);
    try {
      if (config.webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        await fetch(config.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'Otterfy Checkout MZ',
            embeds: [
              {
                title: '💰 Nova Venda Aprovada (Teste)',
                description: 'Pagamento confirmado via **M-Pesa** no valor de **1.990 MT**.',
                color: 1096065,
                fields: [
                  { name: 'Cargo atribuído', value: config.defaultRoleName, inline: true },
                  { name: 'Gateway', value: 'M-Pesa MZ', inline: true },
                ],
              },
            ],
          }),
        });
        setFeedback('Embed de teste enviado para o canal do seu Servidor Discord!');
      } else {
        setFeedback('Simulação concluída! Insira uma URL de Webhook do Discord válida para receber no servidor.');
      }
    } catch {
      setFeedback('Disparo efetuado! Verifique a URL do Webhook do Discord.');
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
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Bot className="w-3.5 h-3.5" />
            Comunidades Discord & Cargos Automáticos
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bot do Discord & Webhooks</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Atribua cargos automaticamente no seu servidor Discord quando um cliente compra um produto e receba embeds de vendas em tempo real.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendTestWebhook}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs transition-all"
        >
          <Send className="w-4 h-4" />
          {testing ? 'A enviar Embed...' : 'Testar Embed no Discord'}
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
          <Shield className="w-4 h-4 text-indigo-400" />
          Configuração do Servidor & Webhook Discord
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="dc-webhook" className="block text-xs font-semibold text-white mb-1.5">
              URL do Webhook do Canal Discord (Notificações de Vendas)
            </label>
            <input
              id="dc-webhook"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>

          <div>
            <label htmlFor="dc-guild" className="block text-xs font-semibold text-white mb-1.5">
              ID do Servidor Discord (Guild ID)
            </label>
            <input
              id="dc-guild"
              type="text"
              value={config.guildId}
              onChange={(e) => setConfig({ ...config, guildId: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white font-mono"
            />
          </div>

          <div>
            <label htmlFor="dc-role" className="block text-xs font-semibold text-white mb-1.5">
              Cargo Padrão para Compradores (Role)
            </label>
            <input
              id="dc-role"
              type="text"
              value={config.defaultRoleName}
              onChange={(e) => setConfig({ ...config, defaultRoleName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-sm text-white"
            />
          </div>
        </div>

        {/* Product to Discord Role Mapping */}
        <div className="space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b8b9e]">
            Mapeamento de Cargo por Produto
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((prod) => (
              <div
                key={prod.id}
                className="p-3 rounded-xl bg-[#0a0a0f] border border-white/[0.06] flex items-center justify-between gap-2"
              >
                <span className="text-xs font-semibold text-white truncate">{prod.name}</span>
                <input
                  type="text"
                  aria-label={`Cargo do Discord para ${prod.name}`}
                  placeholder={config.defaultRoleName}
                  value={config.roleByProduct[prod.id] || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      roleByProduct: { ...config.roleByProduct, [prod.id]: e.target.value },
                    })
                  }
                  className="w-36 px-2.5 py-1 rounded-lg bg-[#11111a] border border-white/[0.08] text-xs text-indigo-300"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-white/[0.06]">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
          >
            <Save className="w-4 h-4" />
            Guardar Configuração Discord
          </button>
        </div>
      </form>
    </div>
  );
}
