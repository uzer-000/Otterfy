'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import AwardsModal from './AwardsModal';
import NotificationStack from './NotificationStack';
import { formatMZN } from '@/lib/utils';

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

  // Unlock Web Audio context on first user touch/click
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch {}
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Audio chime player for approved sales (Dual: Real audio file + Web Audio API synthesis)
  const playSaleChime = () => {
    try {
      // 1. Physical vibration for mobile devices
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([150, 80, 200]); } catch {}
      }

      // 2. Play audio file
      const audio = new Audio('/sounds/venda-aprovada.mp3');
      audio.volume = 1.0;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // 3. Fallback: High quality Web Audio synthesizer
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioCtx) return;
          const ctx = new AudioCtx();
          if (ctx.state === 'suspended') ctx.resume();

          const now = ctx.currentTime;

          // Oscillator 1: High crisp bell E6
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(1318.51, now);
          gain1.gain.setValueAtTime(0.4, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.8);

          // Oscillator 2: Shimmering B6
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1975.53, now + 0.05);
          gain2.gain.setValueAtTime(0.35, now + 0.05);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.05);
          osc2.stop(now + 0.9);

          // Oscillator 3: Coin register ring E7
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.type = 'triangle';
          osc3.frequency.setValueAtTime(2637.02, now + 0.1);
          gain3.gain.setValueAtTime(0.3, now + 0.1);
          gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.start(now + 0.1);
          osc3.stop(now + 1.1);
        });
      }
    } catch {
      // ignore
    }
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

  const initialLoadedRef = useRef(false);

  // Fetch approved orders & handle real-time push alerts
  useEffect(() => {
    // Request permission once user interacts with dashboard
    requestPushPermission();

    async function checkOrdersAndAlert() {
      try {
        const res = await fetch('/api/payments?status=APPROVED');
        if (!res.ok) return;

        const json = await res.json();
        const list = json.data || [];
        setApprovedOrders(list);

        const sum = list.reduce((acc: number, o: any) => acc + (Number(o.amount) || 0), 0);
        setTotalRevenue(sum);

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

              // 1. Play sale sound & vibrate phone
              playSaleChime();

              // 2. Feed visual notification stack (acumula no sino do painel)
              if (window.NotifStack) {
                window.NotifStack.push({
                  id: order.id,
                  title: 'Venda Aprovada!',
                  message: `${order.customerName || 'Cliente'} — ${formatMZN(Number(order.amount) || 0)}`,
                  amount: Number(order.amount) || 0,
                  customerName: order.customerName || 'Cliente',
                  method: order.transaction?.method || 'M-Pesa',
                  icon: '/logo.png',
                });
              }

              // 3. Mobile / Desktop Native Push Notification
              sendSystemPushNotification(
                'Venda Aprovada! — Otterfy',
                `${order.customerName || 'Cliente'} comprou no valor de ${formatMZN(Number(order.amount) || 0)} via ${order.transaction?.method || 'M-Pesa'}!`,
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
      }
    }

    checkOrdersAndAlert();

    // Poll every 4 seconds in real time for instant mobile push & sound ping
    const interval = setInterval(checkOrdersAndAlert, 4000);
    return () => clearInterval(interval);
  }, [pathname]);

  // 50K Milestone calculation (0 / 50k)
  const target50k = 50000;
  const progress50k = Math.min(100, Math.round((totalRevenue / target50k) * 100));
  const approvedCount = approvedOrders.length;

  const getPageTitle = (path: string) => {
    if (path === '/dashboard') return 'Painel Geral';
    if (path.startsWith('/dashboard/metrics')) return 'Métricas & Relatórios';
    if (path.startsWith('/dashboard/products/new')) return 'Novo Produto';
    if (path.startsWith('/dashboard/products')) return 'Produtos';
    if (path.startsWith('/dashboard/finances')) return 'Finanças & Saldo';
    if (path.startsWith('/dashboard/gateways')) return 'Gateways de Pagamento';
    if (path.startsWith('/dashboard/integrations')) return 'Integrações';
    if (path.startsWith('/dashboard/affiliates')) return 'Afiliados';
    if (path.startsWith('/dashboard/campaigns')) return 'Campanhas UTM';
    if (path.startsWith('/dashboard/marketing')) return 'Marketing & Cupons';
    if (path.startsWith('/dashboard/settings')) return 'Definições & Conta';
    if (path.startsWith('/dashboard/refunds')) return 'Reembolsos';
    if (path.startsWith('/dashboard/developer')) return 'Desenvolvedor & APIs';
    if (path.startsWith('/dashboard/automations')) return 'Automações';
    return 'Dashboard';
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#08070C]/90 backdrop-blur-md border-b border-[#1E1B26] px-4 md:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* 50K Milestone Progress Bar (Visible in ALL TABS) */}
          <button
            type="button"
            onClick={() => setAwardsModalOpen(true)}
            className="flex items-center gap-2.5 sm:gap-3 p-1.5 px-2.5 sm:px-3 rounded-xl bg-[#121016] hover:bg-[#1A1820] border border-[#1E1B26] hover:border-violet-500/40 transition-all text-left group cursor-pointer shadow-sm flex-1 sm:flex-initial min-w-0 max-w-[340px]"
            title="Meta atual: Pulseira Bronze (50K). Clique para ver todas as premiações."
          >
            {/* Award Badge (Pulseira Bronze 50K) */}
            <div className="relative w-8 h-8 rounded-lg bg-[#171420] border border-amber-500/40 group-hover:border-amber-400 flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/awards/50k.png"
                alt="Pulseira Bronze 50K"
                className="w-full h-full object-cover p-0 scale-125"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent && !parent.querySelector('.award-fallback-icon')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'award-fallback-icon flex flex-col items-center justify-center';
                    fallback.innerHTML = '<span class="text-[10px] font-black text-amber-300 font-mono tracking-tight leading-none">50K</span><span class="text-[6.5px] font-extrabold uppercase text-amber-400/90 tracking-wider">BRONZE</span>';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
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
                    className="h-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progress50k}%` }}
                  />
                </div>
              </div>
            </button>

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
            <div className="pt-2 border-t border-[#1E1B26] flex gap-2">
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
