'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatMZN, formatSaleNotificationMessage, SALE_NOTIFICATION_TITLE } from '@/lib/utils';

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
      push: (n: {
        id?: string;
        title?: string;
        message?: string;
        amount?: number;
        customerName?: string;
        method?: string;
        icon?: string;
        ts?: number;
      }) => void;
      clear: () => void;
      open: () => void;
      close: () => void;
    };
  }
}

const STORAGE_KEY = 'notif_stack_v1';
const CLEARED_AT_KEY = 'notif_stack_cleared_at_v1';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dias
const MAX_ITEMS = 100;
const CARD_H = 64; // altura compacta original
const GAP = 8;
const PEEK_VISIBLE = 3; // profundidade na visualização empilhada

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function loadFromStorage(): NotifItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    const now = Date.now();
    const fresh: NotifItem[] = raw
      .filter((n: any) => n && typeof n.ts === 'number' && now - n.ts < MAX_AGE_MS && !String(n.id || '').startsWith('seed-'))
      .slice(0, MAX_ITEMS)
      .map((n: any) => ({
        ...n,
        title: SALE_NOTIFICATION_TITLE,
        message: n.amount !== undefined ? formatSaleNotificationMessage(n.amount) : n.message || formatSaleNotificationMessage(0),
        icon: n.icon || '/logo.png',
        ts: n.ts,
      }));
    if (fresh.length !== raw.length) {
      saveToStorage(fresh);
    }
    return fresh;
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
  const [rowOpen, setRowOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const widgetRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  /* ── Sincronização de tema (Dark / Light) ── */
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

  /* ── Cálculo de altura da lista aberta a partir da viewport ── */
  const computeHeight = useCallback((): number => {
    if (rowOpen) {
      const fullH = items.length * (CARD_H + GAP);
      if (stackRef.current) {
        const top = stackRef.current.getBoundingClientRect().top;
        const available = window.innerHeight - top - 24;
        return Math.max(120, Math.min(fullH, available));
      }
      return Math.max(120, Math.min(fullH, 500));
    }
    return items.length > 0 ? CARD_H + PEEK_VISIBLE * 10 : 0;
  }, [rowOpen, items.length]);

  const [stackHeight, setStackHeight] = useState<number>(CARD_H + PEEK_VISIBLE * 10);

  /* ── Carregamento e sincronização de vendas aprovadas ── */
  useEffect(() => {
    async function loadApprovedSales() {
      try {
        const stored = loadFromStorage();
        if (stored.length > 0) {
          setItems(stored);
        }

        const res = await fetch('/api/payments?status=APPROVED&limit=100', {
          signal: AbortSignal.timeout(6000),
          cache: 'no-store',
        });
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : [];
          const now = Date.now();
          const clearedAt = Number(localStorage.getItem(CLEARED_AT_KEY) || '0') || 0;

          const mapped: NotifItem[] = list
            .map((s: any) => ({
              id: s.id,
              title: SALE_NOTIFICATION_TITLE,
              message: formatSaleNotificationMessage(s.amount),
              amount: Number(s.amount) || 0,
              customerName: s.customerName || 'Cliente',
              method: s.transaction?.method || 'M-Pesa',
              icon: '/logo.png',
              ts: s.createdAt ? new Date(s.createdAt).getTime() : now,
            }))
            .filter((n: NotifItem) => now - n.ts < MAX_AGE_MS && n.ts > clearedAt);

          mapped.sort((a, b) => b.ts - a.ts);
          const fresh = mapped.slice(0, MAX_ITEMS);
          setItems(fresh);
          saveToStorage(fresh);
        }
      } catch {
        // Ignora falhas temporárias de rede
      }
    }

    void loadApprovedSales();
    window.addEventListener('orders_updated', loadApprovedSales);
    return () => {
      window.removeEventListener('orders_updated', loadApprovedSales);
    };
  }, []);

  /* ── API pública window.NotifStack ── */
  useEffect(() => {
    window.NotifStack = {
      push(n) {
        setItems((prev) => {
          if (n.id && prev.some((it) => it.id === n.id)) return prev;
          const entry: NotifItem = {
            id: n.id,
            title: n.title || SALE_NOTIFICATION_TITLE,
            message: n.message || formatSaleNotificationMessage(n.amount),
            amount: n.amount,
            customerName: n.customerName,
            method: n.method,
            icon: n.icon || '/logo.png',
            ts: typeof n.ts === 'number' ? n.ts : Date.now(),
          };
          const next = [entry, ...prev].slice(0, MAX_ITEMS);
          saveToStorage(next);
          return next;
        });
      },
      clear() {
        setItems([]);
        saveToStorage([]);
        try {
          localStorage.setItem(CLEARED_AT_KEY, String(Date.now()));
        } catch {}
      },
      open() {
        setPanelOpen(true);
        setRowOpen(false);
      },
      close() {
        setPanelOpen(false);
        setRowOpen(false);
      },
    };
    return () => {
      delete window.NotifStack;
    };
  }, []);

  /* ── Fechar ao clicar fora e recalcular no redimensionamento ── */
  useEffect(() => {
    const outside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
        setRowOpen(false);
      }
    };
    const resize = () => {
      if (rowOpen) setStackHeight(computeHeight());
    };
    document.addEventListener('mousedown', outside);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('resize', resize);
    };
  }, [rowOpen, computeHeight]);

  useEffect(() => {
    setStackHeight(computeHeight());
  }, [rowOpen, items.length, computeHeight]);

  return (
    <div ref={widgetRef} className="relative inline-flex flex-col items-end z-50">
      {/* ─ SINO ULTRA GLASS (Mantém tamanho original compacto w-9 h-9 da barra) ─ */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((prev) => !prev);
          setRowOpen(false);
        }}
        aria-label="Notificações"
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl group ${
          isLight
            ? 'bg-white/70 hover:bg-white/90 border-white/80 text-slate-700 hover:text-slate-900 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_8px_rgba(0,0,0,0.04)]'
            : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/15 text-[#94A3B8] hover:text-[#F8FAFC] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_4px_16px_rgba(0,0,0,0.3)]'
        }`}
        title="Notificações de vendas aprovadas"
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

      {/* ─ NOTIFICAÇÕES EM GLASS FLUTUANTE (SEM FUNDO/PAINEL RETANGULAR ATRÁS) ─ */}
      <div
        className={`fixed top-[58px] sm:top-[64px] right-3 sm:right-6 md:right-8 w-[calc(100vw-24px)] sm:w-[350px] max-w-[350px] transition-all duration-300 ${
          panelOpen
            ? 'opacity-100 visible scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 invisible scale-95 pointer-events-none -translate-y-2'
        } origin-top-right`}
        style={{ zIndex: 9999 }}
      >
        {/* Barra superior flutuante leve */}
        <div className="flex items-center justify-between px-3 py-1 mb-2">
          <span className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 drop-shadow-sm">
            {items.length} {items.length === 1 ? 'venda aprovada' : 'vendas aprovadas'}
          </span>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => window.NotifStack?.clear()}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/10"
            >
              Limpar tudo
            </button>
          )}
        </div>

        {/* Estado vazio */}
        {items.length === 0 ? (
          <div
            className={`py-8 text-center text-xs font-medium rounded-2xl border backdrop-blur-2xl ${
              isLight
                ? 'bg-white/70 border-white/80 text-slate-600 shadow-[0_8px_24px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)]'
                : 'bg-white/[0.08] border-white/15 text-[#94A3B8] shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            }`}
          >
            Sem notificações recentes
          </div>
        ) : (
          /* Container da pilha: 10px de folga nas laterais para a sombra em glass nunca ser cortada */
          <div
            ref={stackRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!rowOpen) setRowOpen(true);
            }}
            style={{
              height: `${stackHeight}px`,
              transition: 'height 0.35s cubic-bezier(0.2, 0.8, 0.3, 1)',
              scrollbarWidth: 'none',
            }}
            className={`relative transition-[height] ${
              rowOpen
                ? 'overflow-y-auto overflow-x-hidden cursor-default pr-0.5'
                : 'cursor-pointer overflow-hidden'
            } [&::-webkit-scrollbar]:hidden`}
          >
            {items.map((n, i) => {
              const zIdx = items.length - i;
              let tx: string;
              let op: number;
              const isBehind = !rowOpen && i > 0;

              if (rowOpen) {
                tx = `translateY(${i * (CARD_H + GAP)}px) scale(1)`;
                op = 1;
              } else if (i < PEEK_VISIBLE) {
                tx = `translateY(${i * 10}px) scale(${1 - i * 0.045})`;
                op = 1 - i * 0.28;
              } else {
                tx = `translateY(${PEEK_VISIBLE * 10}px) scale(${1 - PEEK_VISIBLE * 0.045})`;
                op = 0;
              }

              return (
                <div
                  key={`${n.ts}-${n.id || i}`}
                  style={{
                    transform: tx,
                    opacity: op,
                    zIndex: zIdx,
                    height: `${CARD_H}px`,
                    pointerEvents: !rowOpen && i >= PEEK_VISIBLE ? 'none' : 'auto',
                    transition: 'transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
                  }}
                  className={`absolute inset-x-2.5 top-0 rounded-2xl px-3 py-2.5 flex items-center gap-3 backdrop-blur-2xl saturate-[190%] border ${
                    isLight
                      ? 'bg-white/75 border-white/80 text-slate-900 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)]'
                      : 'bg-white/[0.09] border-white/20 text-[#F8FAFC] shadow-[0_8px_25px_-4px_rgba(0,0,0,0.38),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  }`}
                >
                  {/* Conteúdo com opacidade 0 nos cards de trás na fileira para evitar texto fantasma */}
                  <div
                    className={`w-full h-full flex items-center gap-3 transition-opacity duration-200 ${
                      isBehind ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {/* Logo Otterfy Oficial */}
                    <div
                      className={`w-[36px] h-[36px] rounded-xl flex items-center justify-center shrink-0 p-1 shadow-sm backdrop-blur-md ${
                        isLight
                          ? 'bg-violet-50/80 border border-violet-200/60'
                          : 'bg-violet-950/40 border border-violet-400/25'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo.png"
                        alt="Otterfy"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Dados da notificação */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[12.5px] font-bold truncate ${
                            isLight ? 'text-slate-900' : 'text-[#F8FAFC]'
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-[10px] font-semibold shrink-0 text-slate-400">
                          {timeAgo(n.ts)}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] font-medium mt-0.5 ${
                          rowOpen ? 'whitespace-normal' : 'truncate'
                        } ${isLight ? 'text-slate-600' : 'text-slate-300'}`}
                      >
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
