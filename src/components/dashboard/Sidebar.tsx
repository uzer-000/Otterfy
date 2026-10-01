'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  exact?: boolean;
  badge?: number | string;
  icon: React.ReactNode;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function Sidebar({ userEmail = 'admin@otterfy.co.mz' }: { userEmail?: string }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [approvedSalesCount, setApprovedSalesCount] = useState<number>(0);
  const [profileAvatar, setProfileAvatar] = useState<string>('');

  // Listen to profile avatar updates
  useEffect(() => {
    const updateAvatar = () => {
      const saved = localStorage.getItem('otterfy_profile_avatar');
      setProfileAvatar(saved || '');
    };
    updateAvatar();
    window.addEventListener('profile_updated', updateAvatar);
    window.addEventListener('storage', updateAvatar);
    return () => {
      window.removeEventListener('profile_updated', updateAvatar);
      window.removeEventListener('storage', updateAvatar);
    };
  }, []);

  // Listen to theme switches in real-time
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

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('otterfy-theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    window.dispatchEvent(new Event('themechange'));
    window.dispatchEvent(new Event('storage'));
  };

  useEffect(() => {
    async function loadCount() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) {
            setProductCount(list.length);
          }
        }
      } catch {
        setProductCount(0);
      }
    }
    loadCount();
  }, [pathname]);

  // Organized SaaS Skeleton: authentic Otterfy structure
  const navGroups: NavGroup[] = [
    {
      group: 'Visão Geral',
      items: [
        {
          name: 'Painel Geral',
          href: '/dashboard',
          exact: true,
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          ),
        },
        {
          name: 'Métricas & Relatórios',
          href: '/dashboard/metrics',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'Vendas & Catálogo',
      items: [
        {
          name: 'Meus Produtos',
          href: '/dashboard/products',
          badge: productCount > 0 ? productCount : undefined,
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          ),
        },
        {
          name: 'Vendas & Pedidos',
          href: '/dashboard/payments',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          ),
        },
        {
          name: 'Cupons & Ofertas',
          href: '/dashboard/marketing',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          ),
        },
        {
          name: 'Campanhas & Links',
          href: '/dashboard/campaigns',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.462a20.73 20.73 0 01-1.32-3.832m2.982-.38a20.472 20.472 0 001.693-.574m-1.693.574l2.428-1.4m0 0a20.475 20.475 0 001.693-.574m-1.693.574L16.5 12m-2.428-1.4a20.47 20.47 0 001.693-.574m-1.693.574l-2.428 1.4m4.121-1.974A20.473 20.473 0 0016.5 12m0 0a20.473 20.473 0 011.693-.574" />
            </svg>
          ),
        },
        {
          name: 'Afiliados',
          href: '/dashboard/affiliates',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.999-3.199a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'Financeiro & Saques',
      items: [
        {
          name: 'Finanças & Saldo',
          href: '/dashboard/finances',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          name: 'Reembolsos',
          href: '/dashboard/refunds',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          ),
        },
      ],
    },
    {
      group: 'Ferramentas & Conexões',
      items: [
        {
          name: 'Integrações',
          href: '/dashboard/integrations',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          ),
        },
        {
          name: 'Integrar Gateways',
          href: '/dashboard/gateways',
          badge: '4 APIs',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-6 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
            </svg>
          ),
        },
        {
          name: 'Automações de Vendas',
          href: '/dashboard/automations',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          ),
        },
        {
          name: 'Desenvolvedor & API',
          href: '/dashboard/developer',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          ),
        },
        {
          name: 'Configurações',
          href: '/dashboard/settings',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          name: 'Convidar Amigos',
          href: '/dashboard/invite',
          badge: 'Em breve',
          icon: (
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M21 11.25l-9-5.25-9 5.25m18 0l-9 5.25-9-5.25" />
            </svg>
          ),
        },
      ],
    },
  ];

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const isLight = theme === 'light';

  return (
    <>
      {/* Mobile Top Bar: Apenas os 3 tracinhos na esquerda e logo Otterfy 100% centralizado */}
      <div className={`md:hidden w-full flex items-center justify-between p-3 px-4 border-b transition-colors z-40 ${
        isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#100E15] border-[#1C1924]'
      }`}>
        {/* Left Side: Apenas os 3 tracinhos (Hamburger) */}
        <div className="flex items-center">
          <button 
            onClick={toggleMenu}
            aria-label="Abrir Menu Lateral"
            className={`w-9 h-9 rounded-xl focus:outline-none flex items-center justify-center cursor-pointer transition-colors border ${
              isLight
                ? 'bg-[#F8F7FC] border-[#E2E8F0] text-[#0F172A] hover:border-violet-500/50'
                : 'bg-[#171420] border-[#262135] text-[#F8FAFC] hover:border-violet-500/50'
            }`}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Center: Logo Otterfy 100% centralizado no mobile / ipad / tablet */}
        <div className="flex-1 flex items-center justify-center">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="Otterfy" className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
            </div>
            <span className={`text-lg font-black tracking-tight ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
              Otter<span className="text-[#7C3AED]">fy</span>
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">
              BETA
            </span>
          </Link>
        </div>

        {/* Right side balance spacer: Mantém o logo no centro absoluto */}
        <div className="w-9" />
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[80] transition-opacity animate-in fade-in duration-200" 
          onClick={toggleMenu}
        />
      )}

      {/* Sidebar: Fixed 260px on Desktop, Refined High-End SaaS Identity */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-[90]
        w-[260px] min-w-[260px] max-w-[260px]
        flex flex-col justify-between
        transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
        border-r
        ${isLight ? 'bg-white border-[#E2E8F0] text-[#0F172A]' : 'bg-[#100E15] border-[#1C1924] text-[#F8FAFC]'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top: Brand Header & Quick Action */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className={`p-4 px-5 border-b flex items-center justify-between transition-colors ${
            isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#121017] border-[#1C1924]'
          }`}>
            <Link href="/dashboard" className="flex items-center gap-3 group">
              {/* Distinctive Otterfy Mascot Logo */}
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/logo.png"
                  alt="Otterfy Logo"
                  className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(124,58,237,0.6)] group-hover:scale-105 transition-transform duration-200"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className={`text-lg font-black tracking-tight ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>
                    Otter<span className="text-[#7C3AED]">fy</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-violet-500/10 text-violet-600 border border-violet-500/20">
                    BETA
                  </span>
                </div>
                <span className={`text-[10px] font-medium tracking-tight ${isLight ? 'text-[#64748B]' : 'text-[#64748B]'}`}>
                  Checkout Moçambique
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={toggleMenu}
              className="md:hidden p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              aria-label="Fechar menu lateral"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Quick Action Button: Novo Produto */}
          <div className="px-3 pt-3.5 pb-1">
            <Link
              href="/dashboard/products/new"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm group border ${
                isLight
                  ? 'bg-[#F5F3FA] hover:bg-[#EDE9FE] border-[#E2E8F0] text-[#7C3AED]'
                  : 'bg-[#171420] hover:bg-[#1D1929] border-[#262135] hover:border-violet-500/40 text-violet-300 hover:text-white'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-violet-500 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Novo Produto</span>
            </Link>
          </div>

          {/* Navigation with Delineated Gray Contour Box for Each Module */}
          <nav className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
            {navGroups.map((group) => (
              <div 
                key={group.group} 
                className={`rounded-2xl border p-2 space-y-1 transition-all ${
                  isLight 
                    ? 'bg-[#FAFAFD] border-[#E2E8F0] shadow-xs' 
                    : 'bg-[#13111A]/60 border-[#1E1B26] shadow-xs'
                }`}
              >
                {/* Refined Section Header with subtle contour separation */}
                <div className={`px-2 pb-1.5 pt-0.5 border-b flex items-center justify-between ${
                  isLight ? 'border-[#E2E8F0]' : 'border-[#1E1B26]/80'
                }`}>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                    isLight ? 'text-[#94A3B8]' : 'text-[#64748B]'
                  }`}>
                    {group.group}
                  </span>
                </div>

                {/* Items within the contoured box */}
                <div className="space-y-0.5 pt-1">
                  {group.items.map((item) => {
                    const isActive = item.exact
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all duration-150
                          ${isActive
                            ? isLight
                              ? 'bg-violet-600/10 text-violet-700 font-semibold'
                              : 'bg-gradient-to-r from-violet-600/15 via-violet-600/5 to-transparent text-[#F8FAFC]'
                            : isLight
                              ? 'text-[#475569] hover:bg-[#F5F3FA] hover:text-[#0F172A]'
                              : 'text-[#94A3B8] hover:bg-[#16141D] hover:text-[#F8FAFC]'
                          }
                        `}
                      >
                        {/* Glow left laser accent bar on active */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-gradient-to-b from-violet-400 to-violet-600 shadow-[0_0_10px_rgba(124,58,237,0.6)]" />
                        )}

                        <div className="flex items-center gap-2.5 pl-1">
                          <span className={`transition-colors ${isActive ? 'text-[#7C3AED]' : isLight ? 'text-[#64748B] group-hover:text-violet-600' : 'text-[#64748B] group-hover:text-violet-400'}`}>
                            {item.icon}
                          </span>
                          <span className={isActive ? (isLight ? 'font-bold text-violet-800' : 'font-semibold text-white') : ''}>
                            {item.name}
                          </span>
                        </div>

                        {item.badge !== undefined && (
                          <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                            item.badge === 'Em breve'
                              ? isLight
                                ? 'bg-amber-50 border-amber-200 text-amber-700 font-sans text-[9px]'
                                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-sans text-[9px]'
                              : isActive 
                                ? isLight 
                                  ? 'bg-violet-100 border-violet-300 text-violet-800' 
                                  : 'bg-violet-950/80 border-violet-500/40 text-violet-300' 
                                : isLight
                                  ? 'bg-[#F1F0F7] border-[#E2E8F0] text-[#64748B]'
                                  : 'bg-[#181522] border-[#252033] text-[#818CF8]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom: Gateway Status & User Workspace */}
        <div className={`p-3 border-t space-y-2.5 transition-colors ${
          isLight ? 'bg-[#FAFAFD] border-[#E2E8F0]' : 'bg-[#0E0C13] border-[#1C1924]'
        }`}>
          {/* Zenofy Gateway Pulse Indicator */}
          <div className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-[10px] ${
            isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#14121B] border-[#1E1B27]'
          }`}>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className={`font-medium ${isLight ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>Gateway Zenofy</span>
            </div>
            <span className="text-emerald-500 font-bold uppercase tracking-wider text-[9px]">Ativo</span>
          </div>

          {/* User Workspace Profile Card */}
          <div className={`flex items-center justify-between p-2 rounded-xl border ${
            isLight ? 'bg-white border-[#E2E8F0]' : 'bg-[#14121B] border-[#1E1B27]'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[11px] font-bold text-violet-500 shrink-0 overflow-hidden shadow-xs">
                {profileAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  'PH'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${isLight ? 'text-[#0F172A]' : 'text-[#F8FAFC]'}`}>Pedro Hill</p>
                <p className="text-[10px] text-violet-600 dark:text-violet-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Administrador
                </p>
              </div>
            </div>

            {/* Link to Integrations / Settings */}
            <Link
              href="/dashboard/integrations"
              title="Configurações & Chaves API"
              className={`p-1.5 rounded-lg transition-colors ${
                isLight ? 'text-[#64748B] hover:text-violet-600 hover:bg-[#F1F0F7]' : 'text-[#64748B] hover:text-violet-400 hover:bg-[#1E1A29]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
