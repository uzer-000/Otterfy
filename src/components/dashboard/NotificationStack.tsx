'use client';

import React, { useState, useEffect, useRef } from 'react';
import { formatMZN } from '@/lib/utils';

export interface NotifItem {
  id?: string;
  title: string;
  message: string;
  amount?: number;
  customerName?: string;
  method?: string;
  icon?: string;
  ts: number;
}

declare global {
  interface Window {
    NotifStack?: {
      push: (n: { title?: string; message?: string; icon?: string; id?: string; amount?: number; customerName?: string; method?: string }) => void;
      clear: () => void;
      open: () => void;
      close: () => void;
    };
  }
}

const STORAGE_KEY = 'notif_stack_v1';
const MAX_ITEMS = 150;

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function loadFromStorage(): NotifItem[] {
  try {
    const raw: NotifItem[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return raw.filter((n) => !n.id?.startsWith('seed-') && !n.id?.startsWith('sale-197-'));
  } catch {
    return [];
  }
}

function saveToStorage(list: NotifItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export default function NotificationStack() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const widgetRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    const readTheme = (): 'dark' | 'light' => {
      const docTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
      if (docTheme) return docTheme;
      const stored = localStorage.getItem('otterfy-theme') as 'dark' | 'light' | null;
      return stored || 'light';
    };

    const update = () => setTheme(readTheme());
    update();

    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', update);
    window.addEventListener('themechange', update);

    return () => {
      obs.disconnect();
      window.removeEventListener('storage', update);
      window.removeEventListener('themechange', update);
    };
  }, []);

  const isLight = theme === 'light';

  // Load all real approved sales from API on mount
  useEffect(() => {
    async function loadApprovedSales() {
      try {
        const stored = loadFromStorage();
        if (stored.length > 0) {
          setItems(stored);
        }

        const res = await fetch('/api/payments?status=APPROVED&limit=100');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          const mapped: NotifItem[] = list.map((s: any) => ({
            id: s.id,
            title: 'Venda Aprovada!',
            message: `${s.customerName || 'Cliente'} — ${formatMZN(Number(s.amount) || 0)}`,
            amount: Number(s.amount) || 0,
            customerName: s.customerName || 'Cliente',
            method: s.transaction?.method || 'M-Pesa',
            icon: '/logo.png',
            ts: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
          }));

          // Sort descending by timestamp
          mapped.sort((a, b) => b.ts - a.ts);
          setItems(mapped);
          saveToStorage(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar vendas no sino de notificações:', err);
      }
    }

    loadApprovedSales();
  }, []);

  // Public window.NotifStack API
  useEffect(() => {
    window.NotifStack = {
      push(n) {
        setItems((prev) => {
          if (n.id && prev.some((it) => it.id === n.id)) return prev;
          const entry: NotifItem = {
            id: n.id,
            title: n.title || 'Venda Aprovada!',
            message: n.message || '',
            amount: n.amount,
            customerName: n.customerName,
            method: n.method,
            icon: n.icon || '/logo.png',
            ts: Date.now(),
          };
          const next = [entry, ...prev].slice(0, MAX_ITEMS);
          saveToStorage(next);
          return next;
        });
      },
      clear() {
        setItems([]);
        saveToStorage([]);
      },
      open() {
        setPanelOpen(true);
      },
      close() {
        setPanelOpen(false);
      },
    };

    return () => {
      delete window.NotifStack;
    };
  }, []);

  // Close on click outside
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  return (
    <div ref={widgetRef} className="relative inline-flex flex-col items-end z-50">
      {/* ─ SINO DE NOTIFICAÇÕES ─ */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((prev) => !prev);
        }}
        aria-label="Notificações"
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm group ${
          isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-slate-100'
            : 'bg-[#121016] hover:bg-[#1A1820] border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC]'
        }`}
        title="Histórico de vendas aprovadas"
      >
        <svg
          className={`w-4 h-4 transition-colors ${
            isLight ? 'text-slate-600 group-hover:text-violet-600' : 'text-violet-400 group-hover:text-violet-300'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.85}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>

        {items.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg shadow-emerald-500/30 leading-none">
            {items.length > 99 ? '99+' : items.length}
          </span>
        )}
      </button>

      {/* ─ PAINEL FLUTUANTE SCROLLÁVEL ─ */}
      <div
        className={`fixed top-[60px] sm:top-[66px] left-3 sm:left-auto sm:right-6 md:right-8 w-[calc(100vw-24px)] sm:w-[380px] max-w-[380px] transition-all duration-200 ${
          panelOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
        } origin-top-left sm:origin-top-right`}
        style={{ zIndex: 9999 }}
      >
        <div
          className={`backdrop-blur-2xl border rounded-2xl p-4 space-y-3 shadow-2xl transition-colors duration-200 ${
            isLight
              ? 'bg-white/98 border-slate-200 shadow-xl shadow-slate-300/40 text-slate-900'
              : 'bg-[#121016]/98 border-[#1E1B26] shadow-[0_20px_60px_rgba(0,0,0,.65)] text-[#F8FAFC]'
          }`}
        >
          {/* Header / Toolbar */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-[#1E1B26]/40 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={isLight ? 'text-slate-800' : 'text-white'}>
                {items.length} {items.length === 1 ? 'Venda Aprovada' : 'Vendas Aprovadas'}
              </span>
            </div>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => window.NotifStack?.clear()}
                className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Limpar lista
              </button>
            )}
          </div>

          {/* Lista Scrollável de Vendas */}
          {items.length === 0 ? (
            <div className={`py-12 text-center text-xs space-y-1 ${isLight ? 'text-slate-400' : 'text-[#94A3B8]'}`}>
              <div className="text-2xl mb-1">🔔</div>
              <p className="font-semibold text-sm">Nenhuma venda registrada ainda</p>
              <p className="text-[11px] text-[#64748B]">Suas vendas aprovadas aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-transparent">
              {items.map((n, i) => (
                <div
                  key={`${n.id || i}-${n.ts}`}
                  className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    isLight
                      ? 'bg-slate-50/80 hover:bg-slate-100/90 border-slate-200/80 shadow-sm'
                      : 'bg-[#181522] hover:bg-[#1E1A2B] border-[#2A2538] shadow-md'
                  }`}
                >
                  {/* Logo Otterfy Oficial */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 p-1 shadow-sm ${
                      isLight
                        ? 'bg-violet-100/70 border border-violet-200'
                        : 'bg-violet-950/40 border border-violet-500/30'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="Otterfy" className="w-full h-full object-contain" />
                  </div>

                  {/* Detalhes da Venda */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {n.title}
                      </span>
                      <span className={`text-[10px] font-semibold shrink-0 ${isLight ? 'text-slate-400' : 'text-[#64748B]'}`}>
                        {timeAgo(n.ts)}
                      </span>
                    </div>

                    <p className={`text-xs font-semibold mt-0.5 truncate ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
                      {n.message}
                    </p>

                    {n.method && (
                      <span className="inline-block mt-1 text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        via {n.method}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
