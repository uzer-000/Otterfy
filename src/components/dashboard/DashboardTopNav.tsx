'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AwardsModal from './AwardsModal';
import NotificationStack from './NotificationStack';
import { formatMZN, formatSaleNotificationMessage } from '@/lib/utils';

declare global {
  interface Window {
    triggerSaleNotification?: (amount?: number) => void;
  }
}

export default function DashboardTopNav() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [awardsModalOpen, setAwardsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [approvedOrders, setApprovedOrders] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [profileAvatar, setProfileAvatar] = useState<string>('');

  // Synchronize avatar from localStorage & API
  useEffect(() => {
    const updateAvatar = () => {
      const saved = localStorage.getItem('otterfy_profile_avatar');
      if (saved) setProfileAvatar(saved);
    };
    updateAvatar();

    // Fetch from API to ensure persistence across devices
    fetch('/api/user/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.avatarImage) {
          setProfileAvatar(d.profile.avatarImage);
          localStorage.setItem('otterfy_profile_avatar', d.profile.avatarImage);
        }
      })
      .catch(() => {});

    window.addEventListener('profile_updated', updateAvatar);
    window.addEventListener('storage', updateAvatar);
    return () => {
      window.removeEventListener('profile_updated', updateAvatar);
      window.removeEventListener('storage', updateAvatar);
    };
  }, []);

  // Synchronize theme with DOM (Default: Light)
  useEffect(() => {
    const savedTheme = (localStorage.getItem('otterfy-theme') as 'dark' | 'light') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('otterfy-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    window.dispatchEvent(new Event('themechange'));
    window.dispatchEvent(new Event('storage'));
  };

  // Register Service Worker for Mobile (PWA/Chrome on Android) and Desktop Push
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  // Request browser/mobile push permissions
  const requestPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {}
      }
    }
  };

  // Cross-platform push dispatcher (Mobile PWA/Android + Desktop Windows/Mac)
  const sendSystemPushNotification = async (title: string, body: string, tag: string) => {
    // 1. Mobile Chrome / PWA via Service Worker (MANDATORY on Android)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/logo.png',
            tag,
            vibrate: [200, 100, 200, 100, 300],
            data: { url: '/dashboard' },
          } as any);
          return;
        }
      } catch (e) {
        console.warn('SW showNotification fallback:', e);
      }
    }

    // 2. Desktop Fallback: Window Notification API
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/logo.png',
          tag,
        });
      } catch (e) {
        console.warn('Window Notification fallback:', e);
      }
    }
  };

  // Helper to trigger test notification from any UI or DevTools
  useEffect(() => {
    window.triggerSaleNotification = (amount?: number) => {
      const finalAmount = amount !== undefined ? amount : 455;
      const msg = formatSaleNotificationMessage(finalAmount);
      if (window.NotifStack) {
        window.NotifStack.push({
          id: `test-${Date.now()}`,
          title: 'Venda Aprovada',
          message: msg,
          amount: finalAmount,
          icon: '/logo.png',
        });
        window.NotifStack.open();
      }
      sendSystemPushNotification('Venda Aprovada', msg, `test-${Date.now()}`);
    };
    return () => {
      delete window.triggerSaleNotification;
    };
  }, []);

  const initialLoadedRef = useRef(false);

  const isFetchingRef = useRef(false);

  // Fetch approved orders & handle real-time push alerts
  useEffect(() => {
    // Request permission once user interacts with dashboard
    requestPushPermission();

    async function checkOrdersAndAlert() {
      if (isFetchingRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      isFetchingRef.current = true;
      try {
        const res = await fetch('/api/payments?status=APPROVED');
        if (!res.ok) return;

        const json = await res.json();
        const list = json.data || [];

        setApprovedOrders((prev) => {
          if (prev.length === list.length && prev[0]?.id === list[0]?.id) {
            return prev;
          }
          return list;
        });

        const sum = list.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0);
        setTotalRevenue((prev) => (prev === sum ? prev : sum));

        // Track already notified IDs in localStorage
        const storedNotified = JSON.parse(localStorage.getItem('otterfy_notified_orders') || '[]');
        const notifiedSet = new Set<string>(storedNotified);

        // On initial mount / first load, mark all existing past orders as already seen
        if (!initialLoadedRef.current) {
          list.forEach((o: any) => notifiedSet.add(o.id));
          localStorage.setItem('otterfy_notified_orders', JSON.stringify(Array.from(notifiedSet)));
          initialLoadedRef.current = true;
        } else {
          // Check for brand new approved orders
          const newOrders = list.filter((o: any) => !notifiedSet.has(o.id));
          if (newOrders.length > 0) {
            newOrders.forEach((order: any) => {
              notifiedSet.add(order.id);

              // Vibrate phone on mobile if supported (silent, no audio)
              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                try { navigator.vibrate([200, 100, 300]); } catch {}
              }

              const saleMsg = formatSaleNotificationMessage(order.amount);

              // 2. Feed visual notification stack (acumula no sino do painel)
              if (window.NotifStack) {
                window.NotifStack.push({
                  id: order.id,
                  title: 'Venda Aprovada',
                  message: saleMsg,
                  amount: Number(order.amount) || 0,
                  customerName: order.customerName || 'Cliente',
                  method: order.transaction?.method || 'M-Pesa',
                  icon: '/logo.png',
                });
              }

              // 3. Mobile / Desktop Native Push Notification
              sendSystemPushNotification(
                'Venda Aprovada',
                saleMsg,
                `sale-${order.id}`
              );
            });

            localStorage.setItem('otterfy_notified_orders', JSON.stringify(Array.from(notifiedSet)));
          }
        }

        // ==========================================================
        // 23:00 DAILY CLOSURE PUSH (Trigger only if there are sales!)
        // ==========================================================
        const now = new Date();
        const currentHour = now.getHours();
        const todayDateKey = now.toISOString().split('T')[0];
        const lastSentDate = localStorage.getItem('otterfy_daily_closure_date');

        if (currentHour === 23 && lastSentDate !== todayDateKey) {
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todaySales = list.filter((o: any) => new Date(o.createdAt) >= startOfToday);
          const todayTotal = todaySales.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0);

          // PINGA APENAS SE TIVER VENDAS NO DIA!
          if (todayTotal > 0) {
            localStorage.setItem('otterfy_daily_closure_date', todayDateKey);

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('📊 Fechamento do Dia — Otterfy', {
                body: `Total hoje: ${formatMZN(todayTotal)} em ${todaySales.length} venda(s) aprovada(s). Parabéns, Pedro!`,
                icon: '/logo.png',
                tag: `daily-closure-${todayDateKey}`,
              });
            }
          }
        }

      } catch {
        // keep fallback
      } finally {
        isFetchingRef.current = false;
      }
    }

    checkOrdersAndAlert();

    // Poll every 4 seconds in real time for instant mobile push & sound ping
    const interval = setInterval(checkOrdersAndAlert, 4000);

    const handleVisibility = () => {
      if (!document.hidden) {
        checkOrdersAndAlert();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pathname]);

  // Dynamic Milestone calculation (6 marcos oficiais Otterfy)
  const getNextMilestone = (rev: number) => {
    if (rev < 50000) return { name: 'Pulseira Bronze', target: 50000, tag: '1/6', image: '/awards/50k.png' };
    if (rev < 100000) return { name: 'Placa Prata', target: 100000, tag: '2/6', image: '/awards/100k.png' };
    if (rev < 500000) return { name: 'Placa Ouro', target: 500000, tag: '3/6', image: '/awards/500k.png' };
    if (rev < 1000000) return { name: 'Placa Diamante', target: 1000000, tag: '4/6', image: '/awards/1m.png' };
    if (rev < 5000000) return { name: 'Placa Black', target: 5000000, tag: '5/6', image: '/awards/5m.png' };
    return { name: 'Placa Titan', target: 10000000, tag: '6/6', image: '/awards/10m.png' };
  };
  const nextMilestone = getNextMilestone(totalRevenue);
  const milestoneProgress = Math.min(100, Math.round((totalRevenue / nextMilestone.target) * 100));
  const approvedCount = approvedOrders.length;

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Painel Geral';
    if (path.startsWith('/dashboard/awards')) return 'Premiações';
    if (path.startsWith('/dashboard/settings')) return 'Configurações da Conta';
    if (path.startsWith('/dashboard/metrics')) return 'Métricas & Relatórios';
    if (path.startsWith('/dashboard/products/new')) return 'Novo Produto';
    if (path.startsWith('/dashboard/products')) return 'Produtos';
    if (path.startsWith('/dashboard/finances')) return 'Finanças & Saldo';
    if (path.startsWith('/dashboard/gateways')) return 'Gateways de Pagamento';
    if (path.startsWith('/dashboard/integrations')) return 'Integrações';
    if (path.startsWith('/dashboard/affiliates')) return 'Afiliados';
    if (path.startsWith('/dashboard/campaigns')) return 'Campanhas UTM';
    if (path.startsWith('/dashboard/marketing')) return 'Marketing & Cupons';
    if (path.startsWith('/dashboard/refunds')) return 'Reembolsos';
    if (path.startsWith('/dashboard/developer')) return 'Desenvolvedor & APIs';
    if (path.startsWith('/dashboard/automations')) return 'Automações';
    return 'Dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#08070C]/90 backdrop-blur-md border-b border-[#1E1B26] px-4 sm:px-6 lg:px-8 2xl:px-10 py-3.5 transition-colors transform-gpu will-change-transform">
        <div className="w-full max-w-[2000px] 2xl:max-w-full mx-auto flex items-center justify-between gap-3">
          {/* Milestone Progress Bar (Visible in ALL TABS, direct link to /dashboard/awards) */}
          <Link
            href="/dashboard/awards"
            className="flex items-center gap-2.5 sm:gap-3 p-1.5 px-2.5 sm:px-3 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] hover:border-violet-500/40 transition-all text-left group cursor-pointer shadow-sm flex-1 sm:flex-initial min-w-0 max-w-[340px] md:max-w-[440px]"
            title={`Meta: ${nextMilestone.name} (${nextMilestone.tag}). Clique para ver a jornada de conquistas completa.`}
          >
            {/* Award Badge */}
            <div className="relative w-8 h-8 rounded-lg bg-[#171420] border border-amber-500/40 group-hover:border-amber-400 flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={nextMilestone.image}
                alt={nextMilestone.name}
                className="w-full h-full object-cover p-0 scale-125"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.award-fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'award-fallback-icon flex flex-col items-center justify-center';
                    fallback.innerHTML = '<span class="text-[10px] font-black text-amber-300 font-mono tracking-tight leading-none">🏆</span>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center justify-between text-xs font-semibold gap-2">
                <span className="text-[#94A3B8] group-hover:text-violet-400 transition-colors truncate">
                  {nextMilestone.name}: <span className="text-[#F8FAFC] font-bold">{formatMZN(totalRevenue)}</span> / {formatMZN(nextMilestone.target)}
                </span>
                <span className="text-violet-400 font-mono font-bold text-[11px] shrink-0">
                  {milestoneProgress}%
                </span>
              </div>

              <div className="w-full h-1.5 bg-[#0F0E14] rounded-full overflow-hidden border border-[#1E1B26]">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
            </div>
          </Link>

          {/* Right: Notifications + Theme Switcher + Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Notification Stack (sino de vendas aprovadas scrollável) */}
            <NotificationStack />

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] text-[#94A3B8] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer"
              title={`Alternar para tema ${theme === 'dark' ? 'Claro' : 'Escuro'}`}
            >
              {theme === 'dark' ? (
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>

            {/* Profile Avatar */}
            <button
              type="button"
              onClick={() => setProfileModalOpen(true)}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-violet-900/40 border border-violet-500/30 flex items-center justify-center text-xs font-black text-violet-300 hover:border-violet-500 transition-all cursor-pointer relative overflow-hidden"
              title="Perfil Administrador"
            >
              {profileAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileAvatar} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span>AD</span>
              )}
              <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#121016]" />
            </button>
          </div>
        </div>
      </header>

      {/* Awards Modal (Milestones & Trophies) */}
      <AwardsModal
        isOpen={awardsModalOpen}
        onClose={() => setAwardsModalOpen(false)}
        currentRevenue={totalRevenue}
      />

      {/* Simple Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121016] border border-[#1E1B26] rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-[#F8FAFC]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E1B26]">
              <h3 className="font-bold text-sm">Perfil do Usuário</h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-[#64748B] hover:text-white text-xs">✕</button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-sm font-bold text-violet-400 overflow-hidden">
                {profileAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatar} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span>AD</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-[#F8FAFC]">Pedro Hill</p>
                <p className="text-xs text-[#94A3B8]">nhacossfilipe@gmail.com</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600/20 text-violet-300 border border-violet-500/30">
                  Produtor Verificado
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#1E1B26] flex flex-col gap-2">
              <Link
                href="/dashboard/settings"
                onClick={() => setProfileModalOpen(false)}
                className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-colors text-center flex items-center justify-center gap-1.5"
              >
                <span>⚙️</span>
                <span>Configurações da Conta</span>
              </Link>
              <button
                type="button"
                onClick={() => setProfileModalOpen(false)}
                className="w-full py-2 bg-[#1A1820] hover:bg-[#231F2E] border border-[#1E1B26] text-xs font-semibold rounded-xl transition-colors"
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
