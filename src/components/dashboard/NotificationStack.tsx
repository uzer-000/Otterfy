'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatMZN, formatSaleNotificationMessage } from '@/lib/utils';

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
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MAX_ITEMS = 100;
const CARD_H = 64;
const GAP = 8;
const PEEK_VISIBLE = 3;

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
    const now = Date.now();
    const fresh = raw
      .filter((n) => now - n.ts < MAX_AGE_MS && !n.id?.startsWith('seed-'))
      .map((n) => ({
        ...n,
        title: 'Venda Aprovada',
        message: formatSaleNotificationMessage(n.amount),
      }));
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

  /* ── theme sync imediato ── */
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

  const computeHeight = useCallback((): number => {
    if (rowOpen) {
      const fullH = items.length * (CARD_H + GAP);
      if (stackRef.current) {
        const top = stackRef.current.getBoundingClientRect().top;
        const available = window.innerHeight - top - 16;
        return Math.max(120, Math.min(fullH, available));
      }
      return Math.max(120, Math.min(fullH, 500));
    }
    return CARD_H + PEEK_VISIBLE * 10;
  }, [rowOpen, items.length]);

  const [stackHeight, setStackHeight] = useState<number>(CARD_H + PEEK_VISIBLE * 10);

  /* ── carregamento inicial: apenas notificações reais (sem seed fake) ── */
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
            title: 'Venda Aprovada',
            message: formatSaleNotificationMessage(s.amount),
            amount: Number(s.amount) || 0,
            customerName: s.customerName || 'Cliente',
            method: s.transaction?.method || 'M-Pesa',
            icon: '/logo.png',
            ts: s.createdAt ? new Date(s.createdAt).getTime() : Date.now(),
          }));

          mapped.sort((a, b) => b.ts - a.ts);
          setItems(mapped);
          saveToStorage(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar vendas:', err);
      }
    }

    loadApprovedSales();
  }, []);

  /* API pública */
  useEffect(() => {
    window.NotifStack = {
      push(n) {
        setItems((prev) => {
          if (n.id && prev.some((it) => it.id === n.id)) return prev;
          const entry: NotifItem = {
            id: n.id,
            title: n.title || 'Venda Aprovada',
            message: n.message || formatSaleNotificationMessage(n.amount),
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

  /* fechar ao clicar fora + resize */
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
    requestAnimationFrame(() => setStackHeight(computeHeight()));
  }, [rowOpen, items.length, computeHeight]);

  return (
    <div ref={widgetRef} className="relative inline-flex flex-col items-end z-50">
      {/* ─ SINO (Adapta 100% Dark e Light) ─ */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setPanelOpen((prev) => !prev);
          setRowOpen(false);
        }}
        aria-label="Notificações"
        className={`relative w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm group ${
          isLight
            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 shadow-slate-100'
            : 'bg-[#121016] hover:bg-[#1A1820] border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC]'
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

      {/* ─ PAINEL FLUTUANTE ─ */}
      <div
        className={`fixed top-[60px] sm:top-[66px] left-3 sm:left-auto sm:right-6 md:right-8 w-[calc(100vw-24px)] sm:w-[360px] max-w-[360px] transition-all duration-200 ${
          panelOpen
            ? 'opacity-100 scale-100 pointer-events-auto translate-y-0'
            : 'opacity-0 scale-95 pointer-events-none -translate-y-2'
        } origin-top-left sm:origin-top-right`}
        style={{ zIndex: 9999 }}
      >
        <div
          className={`backdrop-blur-2xl border rounded-2xl p-3.5 space-y-2.5 shadow-2xl transition-colors duration-200 ${
            isLight
              ? 'bg-white/98 border-slate-200 shadow-xl shadow-slate-300/40 text-slate-900'
              : 'bg-[#121016]/98 border-[#1E1B26] shadow-[0_20px_60px_rgba(0,0,0,.65)] text-[#F8FAFC]'
          }`}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-1 text-xs font-bold">
            <span className={isLight ? 'text-slate-600' : 'text-[#94A3B8]'}>
              {items.length} {items.length === 1 ? 'venda aprovada' : 'vendas aprovadas'}
            </span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => window.NotifStack?.clear()}
                className={`text-xs font-semibold transition-colors cursor-pointer ${
                  isLight ? 'text-slate-500 hover:text-slate-900' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                Limpar tudo
              </button>
            )}
          </div>

          {/* Empty */}
          {items.length === 0 ? (
            <div className={`py-10 text-center text-xs ${isLight ? 'text-slate-400' : 'text-[#94A3B8]'}`}>
              Sem notificações recentes
            </div>
          ) : (
            /* ─ STACK / LIST (UMA ATRÁS DA OUTRA) ─ */
            <div
              ref={stackRef}
              onClick={(e) => {
                e.stopPropagation();
                if (!rowOpen) setRowOpen(true);
              }}
              style={{ height: `${stackHeight}px` }}
              className={`relative transition-[height] duration-[350ms] ease-[cubic-bezier(.2,.8,.3,1)] ${
                rowOpen ? 'overflow-y-auto overflow-x-hidden cursor-default pr-1' : 'cursor-pointer overflow-hidden'
              }`}
            >
              {items.map((n, i) => {
                const zIdx = items.length - i;
                let tx: string;
                let op: number;

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
                    }}
                    className={`absolute inset-x-0 top-0 border rounded-2xl px-3 py-2.5 flex items-center gap-3 transition-all duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
                      isLight
                        ? 'bg-white border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                        : 'bg-[#181522] border-[#2A2538] shadow-[0_8px_24px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    {/* Logo Otterfy Oficial */}
                    <div
                      className={`w-[36px] h-[36px] rounded-xl flex items-center justify-center shrink-0 p-1 shadow-sm transition-colors ${
                        isLight
                          ? 'bg-violet-50 border border-violet-200'
                          : 'bg-violet-950/40 border border-violet-500/30'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/logo.png"
                        alt="Otterfy"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[13px] font-bold truncate ${isLight ? 'text-slate-900' : 'text-[#F8FAFC]'}`}>
                          {n.title}
                        </span>
                        <span className={`text-[10.5px] font-semibold shrink-0 ${isLight ? 'text-slate-400' : 'text-[#94A3B8]'}`}>
                          {timeAgo(n.ts)}
                        </span>
                      </div>
                      <p className={`text-[11.5px] font-medium mt-0.5 ${rowOpen ? 'whitespace-normal' : 'truncate'} ${isLight ? 'text-slate-600' : 'text-[#94A3B8]'}`}>
                        {n.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
