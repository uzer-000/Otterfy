'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatMZN } from '@/lib/utils';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  approvedSales?: Array<{
    id: string;
    customerName: string;
    amount: number;
    createdAt: string;
    method?: string;
  }>;
}

export default function NotificationsDrawer({
  isOpen,
  onClose,
  approvedSales = [],
}: NotificationsDrawerProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [soundEnabled, setSoundEnabled] = useState(false);
  // Whether the notifications are stacked (initial state) or expanded downwards
  const [isExpanded, setIsExpanded] = useState(false);

  // Synchronize theme with html data-theme
  useEffect(() => {
    const updateTheme = () => {
      const current = (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
      setTheme(current);
    };
    updateTheme();

    const observer = new MutationObserver(() => updateTheme());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('storage', updateTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', updateTheme);
    };
  }, []);

  const isLight = theme === 'light';

  // Real approved sales (initialized to zero when empty)
  const notifications = (approvedSales || []).map((s, idx) => ({
    id: s.id || `sale-${idx}`,
    customerName: s.customerName || 'Cliente Otterfy',
    amount: s.amount || 0,
    productName: 'Produto Digital',
    method: (s.method as 'M-Pesa' | 'eMola') || 'M-Pesa',
    createdAt: s.createdAt,
    timeAgo: 'recente',
  }));

  const totalAmount = notifications.reduce((acc, curr) => acc + curr.amount, 0);
  const latestNotification = notifications[0];

  if (!isOpen) return null;

  // Audio player prepared for the user's custom audio file in /public/sounds/venda-aprovada.mp3
  const playCustomSaleSound = () => {
    try {
      const audio = new Audio('/sounds/venda-aprovada.mp3');
      audio.play().catch(() => {
        // Will play as soon as the user provides the MP3
      });
    } catch {
      // Graceful fallback
    }
  };

  const handleToggleSound = async () => {
    if (!soundEnabled) {
      playCustomSaleSound();
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('Otterfy Vendas', {
            body: 'Alertas de vendas aprovadas ativados no seu dispositivo!',
            icon: '/favicon.ico',
          });
        }
      }
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  const handleStackClick = () => {
    setIsExpanded(true);
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity animate-in fade-in duration-300 ${
      isLight ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/70 backdrop-blur-md'
    }`}>
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Vertical iPhone Slide-Over Drawer with Responsive Light/Dark Glass */}
      <div 
        className={`relative z-10 w-full max-w-sm sm:max-w-md h-full border-l backdrop-blur-3xl shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300 transition-colors ${
          isLight
            ? 'bg-white/95 border-[#E2E8F0] text-[#0F172A]'
            : 'bg-[#100E17]/95 border-white/10 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* iOS Central de Notificações Top Header */}
        <div className={`p-4 sm:p-5 border-b backdrop-blur-2xl transition-colors ${
          isLight
            ? 'bg-[#FAFAFD]/90 border-[#E2E8F0]'
            : 'bg-[#14121E]/90 border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-500 flex items-center justify-center shadow-inner">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>
              <div>
                <h3 className={`text-base font-bold tracking-tight flex items-center gap-2 ${
                  isLight ? 'text-[#0F172A]' : 'text-white'
                }`}>
                  <span>Central de Notificações</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    notifications.length > 0
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isLight
                        ? 'bg-slate-100 text-[#64748B] border-slate-200'
                        : 'bg-white/10 text-[#94A3B8] border-white/10'
                  }`}>
                    {notifications.length} {notifications.length === 1 ? 'Venda' : 'Vendas'}
                  </span>
                </h3>
                <p className={`text-[11px] ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  {notifications.length > 0 ? 'Vendas aprovadas em tempo real' : 'Aguardando primeiras vendas'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-sm cursor-pointer border ${
                isLight
                  ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
                  : 'bg-white/[0.07] hover:bg-white/[0.15] text-[#94A3B8] hover:text-white border-white/10'
              }`}
              title="Fechar Central"
            >
              ✕
            </button>
          </div>

          {/* Sound & Status Bar */}
          <div className={`flex items-center justify-between p-2 px-3 rounded-2xl border backdrop-blur-lg transition-colors ${
            isLight
              ? 'bg-[#F8F7FC] border-[#E2E8F0]'
              : 'bg-white/[0.05] border-white/[0.08]'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${isLight ? 'text-[#334155]' : 'text-[#E2E8F0]'}`}>
                Alertas de Venda Aprovada
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                soundEnabled 
                  ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' 
                  : isLight ? 'bg-[#CBD5E1]' : 'bg-[#2A2638]'
              }`}
            >
              <div 
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Scrollable Notifications Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 custom-scrollbar scroll-smooth">
          {notifications.length === 0 ? (
            /* EMPTY STATE: DASHBOARD ZERADA */
            <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 space-y-4 my-auto h-full">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner ${
                isLight ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-violet-600/10 border-violet-500/20 text-violet-400'
              }`}>
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </div>

              <div>
                <h4 className={`text-base font-bold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                  Nenhuma Venda Aprovada Ainda
                </h4>
                <p className={`text-xs max-w-xs mt-1.5 leading-relaxed ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  O painel está reiniciado e zerado. Assim que os seus clientes pagarem via M-Pesa ou eMola, as notificações com estilo de iPhone aparecerão aqui em tempo real.
                </p>
              </div>

              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border ${
                  isLight ? 'bg-slate-100 border-slate-200 text-[#475569]' : 'bg-white/5 border-white/10 text-[#94A3B8]'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Pronto para receber pedidos
                </span>
              </div>
            </div>
          ) : !isExpanded ? (
            /* STATE 1: NOTIFICAÇÕES EMPILHADAS (ESTILO IPHONE) */
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className={`text-[11px] uppercase font-bold tracking-wider ${
                  isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                }`}>
                  Notificações de Vendas (Toque para desempilhar)
                </span>
                <span className="text-[11px] text-violet-600 dark:text-violet-400 font-mono font-bold">
                  {notifications.length} vendas
                </span>
              </div>

              {/* The Iconic iOS Stack of Sales Notifications */}
              <div
                onClick={handleStackClick}
                className="group relative cursor-pointer pt-1 pb-6 transition-all duration-300 transform hover:scale-[1.015]"
                title="Clique aqui para desempilhar e scrollar todas as notificações"
              >
                {/* 1st Foreground Card (Front of the stack) */}
                <div className={`relative z-20 p-4 sm:p-5 rounded-[24px] border backdrop-blur-2xl shadow-xl transition-all duration-300 ${
                  isLight
                    ? 'bg-white hover:bg-[#FAFAFD] border-[#E2E8F0] shadow-slate-200/50'
                    : 'bg-white/[0.10] hover:bg-white/[0.15] border-white/[0.18] shadow-2xl'
                }`}>
                  {/* Top Row: Otterfy Icon + OTTERFY CHECKOUT + Timestamp */}
                  <div className={`flex items-center justify-between pb-2.5 mb-2.5 border-b ${
                    isLight ? 'border-[#E2E8F0]' : 'border-white/[0.08]'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-[10px]">O</span>
                      </div>
                      <span className={`text-xs font-black tracking-wider uppercase ${
                        isLight ? 'text-violet-700' : 'text-violet-300'
                      }`}>
                        OTTERFY CHECKOUT
                      </span>
                    </div>

                    <span className={`text-[11px] font-mono font-medium ${
                      isLight ? 'text-[#64748B]' : 'text-[#CBD5E1]'
                    }`}>
                      {latestNotification?.timeAgo || 'agora'}
                    </span>
                  </div>

                  {/* Body: Customer Name & Count */}
                  <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${
                        isLight ? 'text-[#0F172A]' : 'text-white'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
                        {latestNotification?.customerName || 'Cliente Otterfy'}
                      </h4>
                      <p className={`text-base font-extrabold ${
                        isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'
                      }`}>
                        {notifications.length} Notificações
                      </p>
                      <p className={`text-xs font-medium flex items-center gap-1 pt-1 ${
                        isLight ? 'text-violet-700' : 'text-violet-300'
                      }`}>
                        <span>Toque para desempilhar e scrollar todas</span>
                        <span className="animate-bounce">⤸</span>
                      </p>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className={`text-lg font-black font-mono tracking-tight ${
                        isLight ? 'text-emerald-600' : 'text-emerald-400'
                      }`}>
                        +{formatMZN(latestNotification?.amount || 0)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {latestNotification?.method || 'M-Pesa'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2nd Layer Card Underneath */}
                <div className={`absolute inset-x-3 -bottom-1 h-5 rounded-b-[22px] border-b border-x shadow-md z-10 transition-all duration-300 group-hover:-bottom-2 ${
                  isLight
                    ? 'bg-[#F8F7FC] border-[#E2E8F0]'
                    : 'bg-white/[0.08] dark:bg-[#1A1725] border-white/15 dark:border-white/10'
                }`} />

                {/* 3rd Layer Card Underneath */}
                <div className={`absolute inset-x-6 -bottom-3 h-5 rounded-b-[20px] border-b border-x shadow-xs z-0 transition-all duration-300 group-hover:-bottom-4 ${
                  isLight
                    ? 'bg-[#F1F0F7] border-[#E2E8F0]'
                    : 'bg-white/[0.04] dark:bg-[#13111C] border-white/10 dark:border-white/5'
                }`} />
              </div>
            </div>
          ) : (
            /* STATE 2: AS NOTIFICAÇÕES DESCEM EM CASCATA SUAVE DE IPHONE */
            <div className="space-y-3 animate-in fade-in slide-in-from-top-3 duration-300 ease-out">
              {/* Controls bar when expanded */}
              <div className={`flex items-center justify-between p-2.5 px-3 rounded-2xl border sticky top-0 z-30 backdrop-blur-2xl shadow-sm ${
                isLight
                  ? 'bg-white/95 border-[#E2E8F0] text-[#0F172A]'
                  : 'bg-white/[0.07] border-white/10 text-white'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className={`text-xs font-bold ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
                    {notifications.length} Vendas Desempilhadas
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1 ${
                    isLight
                      ? 'bg-[#F5F3FA] hover:bg-[#EDE9FE] text-violet-700 border-[#E2E8F0]'
                      : 'bg-white/[0.1] hover:bg-white/[0.18] text-violet-300 hover:text-white border-white/10'
                  }`}
                >
                  <span>Empilhar Novamente</span>
                  <span>⤒</span>
                </button>
              </div>

              {/* All sales notifications cards cascading downwards */}
              <div className="space-y-2.5">
                {notifications.map((n, index) => (
                  <div
                    key={n.id}
                    style={{
                      animationDelay: `${Math.min(index * 20, 280)}ms`,
                      animationFillMode: 'both',
                    }}
                    className={`group relative p-3.5 rounded-[22px] border backdrop-blur-2xl shadow-md transition-all duration-200 hover:scale-[1.01] cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300 ease-out ${
                      isLight
                        ? 'bg-white hover:bg-[#FAFAFD] border-[#E2E8F0] text-[#0F172A]'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-white'
                    }`}
                  >
                    {/* Top Row: App Icon + App Name + Index + Timestamp */}
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
                      isLight ? 'border-[#E2E8F0]' : 'border-white/[0.06]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-xs">
                          <span className="text-white font-black text-[9px]">O</span>
                        </div>
                        <span className={`text-[10px] font-bold tracking-wider uppercase ${
                          isLight ? 'text-violet-700' : 'text-violet-300'
                        }`}>
                          OTTERFY CHECKOUT
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold ${
                          isLight ? 'text-[#94A3B8]' : 'text-[#64748B]'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className={`text-[10px] font-medium font-mono ${
                          isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                        }`}>
                          {n.timeAgo}
                        </span>
                      </div>
                    </div>

                    {/* Notification Content */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h4 className={`text-xs font-bold tracking-tight truncate ${
                            isLight ? 'text-[#0F172A]' : 'text-white'
                          }`}>
                            {n.customerName}
                          </h4>
                        </div>
                        <p className={`text-[11px] truncate ${
                          isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'
                        }`}>
                          {n.productName}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-sm font-black font-mono tracking-tight ${
                          isLight ? 'text-emerald-600' : 'text-emerald-400'
                        }`}>
                          +{formatMZN(n.amount)}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          n.method === 'eMola'
                            ? isLight
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                            : isLight
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-red-500/15 text-red-300 border-red-500/25'
                        }`}>
                          {n.method}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer with Quick Total & Extrato */}
        <div className={`p-4 border-t backdrop-blur-2xl flex items-center justify-between transition-colors ${
          isLight
            ? 'bg-[#FAFAFD]/95 border-[#E2E8F0]'
            : 'bg-[#121017]/95 border-white/10'
        }`}>
          <div>
            <p className={`text-[10px] ${isLight ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
              Total neste lote ({notifications.length} vendas)
            </p>
            <p className={`text-sm font-extrabold font-mono ${isLight ? 'text-[#0F172A]' : 'text-white'}`}>
              {formatMZN(totalAmount)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/payments?status=APPROVED"
              onClick={onClose}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors flex items-center gap-1"
            >
              Extrato <span>→</span>
            </Link>

            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0]'
                  : 'bg-white/[0.08] hover:bg-white/[0.15] text-white border-white/10'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
