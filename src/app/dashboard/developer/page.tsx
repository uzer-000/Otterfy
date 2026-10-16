'use client';

import React, { useEffect, useState } from 'react';
import {
  Terminal,
  Key,
  Copy,
  Check,
  RefreshCw,
  Play,
  Sparkles,
  CheckCircle2,
  Cpu,
  Code2,
} from 'lucide-react';

export default function DeveloperMcpPage() {
  const [apiKey, setApiKey] = useState('otf_live_mz_98a7bc65d4e3f21098a7bc65');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [mcpResponse, setMcpResponse] = useState<string>('');
  const [loadingMcp, setLoadingMcp] = useState(false);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('otterfy_mcp_api_key_v1');
      if (savedKey) setApiKey(savedKey);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const rotateKey = () => {
    const rand = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 10);
    const nextKey = `otf_live_mz_${rand}`;
    setApiKey(nextKey);
    try {
      localStorage.setItem('otterfy_mcp_api_key_v1', nextKey);
    } catch (e) {
      console.error(e);
    }
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const testMcpEndpoint = async (toolName: string) => {
    setLoadingMcp(true);
    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName }),
      });
      const data = await res.json();
      setMcpResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setMcpResponse(JSON.stringify({ error: String(e) }, null, 2));
    } finally {
      setLoadingMcp(false);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://otterfy.com';

  const mcpConfigJson = JSON.stringify(
    {
      mcpServers: {
        'otterfy-checkout': {
          url: `${origin}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Model Context Protocol (MCP) & API Pública
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Servidor MCP & API para Desenvolvedores</h1>
          <p className="text-sm text-[#8b8b9e] mt-0.5">
            Conecte a sua loja Otterfy diretamente ao Claude, Cursor, Windsurf ou ChatGPT via MCP para consultar vendas, produtos e carrinhos em tempo real.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: API Key & MCP Config */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              Chave de API & Autenticação MCP
            </h2>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                aria-label="Chave de API ativa"
                value={apiKey}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs font-mono text-emerald-400"
              />
              <button
                type="button"
                onClick={() => copyText('apikey', apiKey)}
                className="px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white inline-flex items-center gap-1.5"
              >
                {copiedItem === 'apikey' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-[#8b8b9e]" />
                )}
                Copiar
              </button>
              <button
                type="button"
                onClick={rotateKey}
                className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8b8b9e] hover:text-white"
                title="Gerar nova chave de API"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Configuração JSON (`claude_desktop_config.json` / `.cursor/mcp.json`)
                </span>
                <button
                  type="button"
                  onClick={() => copyText('mcpjson', mcpConfigJson)}
                  className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  {copiedItem === 'mcpjson' ? 'Copiado!' : 'Copiar JSON'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs font-mono text-slate-300 overflow-x-auto">
                {mcpConfigJson}
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Live MCP Playground */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-[#11111a] border border-white/[0.06] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                Testador Interativo do Servidor MCP (`/api/mcp`)
              </h2>
            </div>

            <p className="text-xs text-[#8b8b9e]">
              Clique numa das ferramentas (`tools`) abaixo para executar uma chamada real ao endpoint `/api/mcp` da sua loja:
            </p>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'get_store_metrics', label: 'get_store_metrics' },
                { id: 'list_products', label: 'list_products' },
                { id: 'list_recent_orders', label: 'list_recent_orders' },
                { id: 'get_abandoned_carts', label: 'get_abandoned_carts' },
              ].map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => testMcpEndpoint(tool.id)}
                  disabled={loadingMcp}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b8b9e]">
                Resposta em Tempo Real do Servidor MCP:
              </span>
              <pre className="p-4 rounded-xl bg-[#0a0a0f] border border-white/[0.08] text-xs font-mono text-emerald-400 min-h-[210px] max-h-[340px] overflow-auto">
                {loadingMcp
                  ? '// A consultar /api/mcp...'
                  : mcpResponse || '// Selecione uma tool acima para inspecionar o payload MCP real.'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
