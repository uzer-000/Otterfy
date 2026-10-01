'use client';

import React, { useState, useEffect } from 'react';
import AwardsModal from './AwardsModal';
import NotificationsDrawer from './NotificationsDrawer';
import { formatMZN } from '@/lib/utils';
import Link from 'next/link';

interface DashboardHeaderProps {
  userName?: string;
  totalRevenue?: number;
  approvedSales?: Array<{
    id: string;
    customerName: string;
    amount: number;
    createdAt: string;
    method?: string;
  }>;
}

export default function DashboardHeader({
  userName = 'Administrador',
  totalRevenue = 0,
  approvedSales = [],
}: DashboardHeaderProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('otterfy-theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('otterfy-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleToggleSound = async () => {
    if (!soundEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          new Notification('Otterfy Vendas', {
            body: 'Notificações de vendas aprovadas ativadas!',
            icon: '/favicon.ico',
          });
        }
      }
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  // 50K Milestone calculation
  const target50k = 50000;
  const progress50k = Math.min(100, Math.round((totalRevenue / target50k) * 100));

  // Only approved sales are counted in the bell badge
  const approvedCount = approvedSales.length;

  return (
    <>
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-2 border-b border-[#1E1B26]">
        {/* Left: User Avatar + Greeting */}
        <div className="flex items-center gap-3.5">
          {/* Profile Avatar Button */}
          <button
            type="button"
            onClick={() => setProfileModalOpen(true)}
            className="relative group cursor-pointer"
            title="Clique para ver o perfil do usuário e configurações"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-violet-900/40 border border-violet-500/30 flex items-center justify-center text-sm font-black text-violet-300 group-hover:border-violet-500 transition-all shadow-md overflow-hidden relative">
              <span>{userName.substring(0, 2).toUpperCase()}</span>
              {/* Online pulse indicator */}
              <span className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#121016]" />
            </div>
          </button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              Olá, {userName}
            </h1>
            <p className="text-xs text-[#64748B] mt-1 font-normal tracking-tight">
              Visão geral de sua operação e faturamento
            </p>
          </div>
        </div>

        {/* Right Actions: On Mobile bell and theme on the LEFT, on Desktop on the right */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-3">
          {/* Mobile Only: Bell + Theme Switcher on the LEFT */}
          <div className="flex sm:hidden items-center gap-2 mr-auto order-1">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative w-10 h-10 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
              title="Notificações estilo iPhone"
            >
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {approvedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-emerald-500 text-[9px] font-extrabold text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  {approvedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title={`Alternar para tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>

          {/* Meta Progress Widget with Photo Slot (PNG / ICO) */}
          <button
            type="button"
            onClick={() => setAwardsModalOpen(true)}
            className="order-2 sm:order-1 flex items-center gap-3 p-2.5 px-3.5 rounded-2xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] hover:border-violet-500/40 transition-all text-left group cursor-pointer shadow-sm min-w-[240px]"
            title="Meta atual: Pulseira Bronze (50K). Clique para ver todas as premiações."
          >
            {/* Dedicated Award Photo/Icon Slot */}
            <div className="relative w-9 h-9 rounded-xl bg-[#171420] border border-[#2A2538] group-hover:border-violet-500/50 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/awards/50k.png"
                alt="Pulseira Bronze 50K"
                className="w-full h-full object-cover p-0 scale-125"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.award-fallback-icon')) {
                    const icon = document.createElement('div');
                    icon.className = 'award-fallback-icon text-violet-400 font-black text-[10px] tracking-tight';
                    icon.innerText = '50K';
                    parent.appendChild(icon);
                  }
                }}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                <span className="text-[#94A3B8] group-hover:text-violet-400 transition-colors truncate">
                  Meta: <span className="text-[#F8FAFC] font-bold">{formatMZN(totalRevenue)}</span> / 50k
                </span>
                <span className="text-violet-400 font-mono font-bold text-[11px] shrink-0">
                  {progress50k}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-[#0F0E14] rounded-full overflow-hidden border border-[#1E1B26]">
                <div 
                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress50k}%` }}
                />
              </div>
            </div>
          </button>

          {/* Desktop Only: Notifications Bell + Theme Switcher on the RIGHT */}
          <div className="hidden sm:flex items-center gap-3 order-3">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="relative w-10 h-10 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
              title="Notificações estilo iPhone"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {approvedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[19px] h-[19px] px-1 rounded-full bg-emerald-500 text-[9px] font-extrabold text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                  {approvedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              title={`Alternar para tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* iPhone Style Notifications Drawer (Vertical Slide-over with frosted glass) */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        approvedSales={approvedSales}
      />

      {/* Awards Modal */}
      <AwardsModal
        isOpen={awardsModalOpen}
        onClose={() => setAwardsModalOpen(false)}
        currentRevenue={totalRevenue}
      />

      {/* Profile & Settings Space Modal */}
      {profileModalOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors animate-fadeIn ${
          theme === 'light' ? 'bg-slate-900/40 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm'
        }`}>
          <div 
            className={`rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-6 border transition-colors ${
              theme === 'light'
                ? 'bg-white border-[#E2E8F0] text-[#0F172A]'
                : 'bg-[#121016] border-[#1E1B26] text-[#F8FAFC]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between pb-3 border-b ${
              theme === 'light' ? 'border-[#E2E8F0]' : 'border-[#1E1B26]'
            }`}>
              <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                Perfil do Usuário
              </h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer border ${
                  theme === 'light'
                    ? 'bg-[#F1F0F7] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0]'
                    : 'bg-[#1A1820] text-[#94A3B8] hover:text-[#F8FAFC] border-transparent'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Profile Photo Placeholder Space */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600/30 to-violet-950/60 border-2 border-violet-500/40 flex items-center justify-center text-2xl font-black text-violet-500 dark:text-violet-300 shadow-xl overflow-hidden">
                  <span>{userName.substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium cursor-pointer">
                  Mudar Foto
                </div>
              </div>

              <div>
                <h4 className={`text-lg font-bold ${theme === 'light' ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                  {userName}
                </h4>
                <p className={`text-xs ${theme === 'light' ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  admin@otterfy.co.mz
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Conta Verificada
                </span>
              </div>
            </div>

            {/* Settings Options (Space reserved) */}
            <div className={`space-y-2 pt-2 border-t ${theme === 'light' ? 'border-[#E2E8F0]' : 'border-[#1E1B26]'}`}>
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                theme === 'light' ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#475569]' : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
              }`}>
                <span>Notificações por Email</span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Em Breve</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                theme === 'light' ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#475569]' : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
              }`}>
                <span>Chave de API do Produtor</span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Em Breve</span>
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                theme === 'light' ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#475569]' : 'bg-[#0F0E14] border-[#1E1B26] text-[#94A3B8]'
              }`}>
                <span>Segurança em Duas Etapas</span>
                <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">Em Breve</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="laser-button w-full py-2.5 text-xs font-semibold text-white rounded-xl cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
